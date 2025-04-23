const { checkCooldown } = require("../utils/cooldown")
const User = require("../models/userModel")
const { resetQuestsIfNeeded } = require("../utils/questUtils")
const { checkAchievements } = require("../utils/achievementUtils")
const { cleanupExpiredEffects } = require("../utils/potionUtils")
const { applyRankDecay } = require("../utils/rankUtils")
const fs = require("fs")
const path = require("path")

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    // Ignore messages from bots
    if (message.author.bot) return

    // Check if message starts with the prefix
    const prefix = "pixel"
    if (!message.content.toLowerCase().startsWith(prefix)) return

    // Parse command and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const commandName = args.shift().toLowerCase()

    // Find the command in the collection
    let command = client.commands.get(commandName)

    // If command not found directly, search in subdirectories
    if (!command) {
      // Get all command folders
      const commandFolders = fs.readdirSync(path.join(__dirname, "../commands"))

      // Search for command in each folder
      for (const folder of commandFolders) {
        // Skip if not a directory
        if (!fs.statSync(path.join(__dirname, "../commands", folder)).isDirectory()) continue

        const commandFiles = fs
          .readdirSync(path.join(__dirname, "../commands", folder))
          .filter((file) => file.endsWith(".js"))

        for (const file of commandFiles) {
          const potentialCommand = require(path.join(__dirname, "../commands", folder, file))
          if (potentialCommand.data && potentialCommand.data.name === commandName) {
            command = potentialCommand
            break
          }
        }

        if (command) break
      }

      // Check for root-level commands if still not found
      if (!command) {
        const rootCommandFiles = fs
          .readdirSync(path.join(__dirname, "../commands"))
          .filter((file) => file.endsWith(".js"))

        for (const file of rootCommandFiles) {
          const potentialCommand = require(path.join(__dirname, "../commands", file))
          if (potentialCommand.data && potentialCommand.data.name === commandName) {
            command = potentialCommand
            break
          }
        }
      }
    }

    if (!command) {
      console.log(`Command not found: ${commandName}`)
      return
    }

    try {
      console.log(`Executing prefix command: ${commandName}`)

      // Create a mock interaction object to reuse slash command logic
      const mockInteraction = {
        user: message.author,
        guild: message.guild,
        channel: message.channel,
        options: {
          getUser: (name) => {
            // Try to get mentioned user
            if (name === "opponent" || name === "user") {
              return message.mentions.users.first()
            }
            return null
          },
          getInteger: (name) => {
            // Try to parse integer arguments
            if (["amount", "number", "item", "quantity", "page"].includes(name)) {
              const value = Number.parseInt(args[0])
              return isNaN(value) ? null : value
            }
            return null
          },
          getString: (name) => {
            // Try to parse string arguments
            if (args.length > 0) {
              if (["type", "theme", "text", "item", "potion", "sort", "structure", "task"].includes(name)) {
                return args[0]
              }
              if (["name", "current", "new", "animal", "parent1", "parent2"].includes(name)) {
                return args.join(" ")
              }
            }
            return null
          },
          getSubcommand: () => {
            // Try to get subcommand from first argument
            return args.length > 0 ? args[0] : null
          },
        },
        reply: async (options) => {
          // Convert embed to message reply
          if (options.embeds) {
            return message.reply({ embeds: options.embeds, content: options.content || "" })
          } else {
            return message.reply(options.content || "Command executed!")
          }
        },
        deferReply: async () => {
          // Simulate defer by sending a typing indicator
          return message.channel.sendTyping()
        },
        editReply: async (options) => {
          // Edit the last bot message in the channel
          const messages = await message.channel.messages.fetch({ limit: 5 })
          const lastBotMessage = messages.find((m) => m.author.id === client.user.id)
          if (lastBotMessage) {
            return lastBotMessage.edit(options)
          } else {
            return message.reply(options)
          }
        },
        followUp: async (options) => {
          return message.reply(options)
        },
        deferred: false,
        replied: false,
      }

      // Check for command cooldown
      const cooldownTime = checkCooldown(client, mockInteraction, command)
      if (cooldownTime) {
        return message.reply(
          `Please wait ${cooldownTime.toFixed(1)} more seconds before using the \`${command.data.name}\` command.`,
        )
      }

      // Find or create user in database
      const user = await User.findOrCreate(message.author.id, message.author.username)

      // Apply rank decay
      const decayResult = applyRankDecay(user)
      if (decayResult.applied) {
        console.log(`Applied rank decay to ${user.username}: -${decayResult.amount} XP`)

        // If significant decay, notify the user
        if (decayResult.amount > 100) {
          try {
            message.author
              .send({
                content: `Due to inactivity (60+ days), your rank has decayed and you've lost ${decayResult.amount} XP. Stay active to maintain your rank!`,
              })
              .catch(() => {
                // Ignore errors if DM fails
              })
          } catch (error) {
            // Ignore errors
          }
        }
      }

      // Clean up expired effects
      cleanupExpiredEffects(user)

      // Reset quests if needed
      await resetQuestsIfNeeded(user)

      // Execute command
      await command.execute(mockInteraction, client, user)

      // Check for achievements after command execution
      await checkAchievements(user)

      // Save user changes
      await user.save()
    } catch (error) {
      console.error(`Error executing prefix command ${commandName}:`, error)
      message.reply("There was an error executing this command!")
    }
  },
}
