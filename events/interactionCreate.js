const { checkCooldown } = require("../utils/cooldown")
const User = require("../models/userModel")
const { resetQuestsIfNeeded } = require("../utils/questUtils")
const { checkAchievements } = require("../utils/achievementUtils")
const { cleanupExpiredEffects } = require("../utils/potionUtils")
const { applyRankDecay } = require("../utils/rankUtils")

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName)

      if (!command) return

      try {
        // Check for command cooldown
        const cooldownTime = checkCooldown(client, interaction, command)
        if (cooldownTime) {
          return interaction.reply({
            content: `Please wait ${cooldownTime.toFixed(1)} more seconds before using the \`${command.data.name}\` command.`,
            ephemeral: true,
          })
        }

        // Find or create user in database
        const user = await User.findOrCreate(interaction.user.id, interaction.user.username)

        // Clean up expired effects
        cleanupExpiredEffects(user)

        // Apply rank decay
        const decayResult = applyRankDecay(user)
        if (decayResult.applied) {
          console.log(`Applied rank decay to ${user.username}: -${decayResult.amount} XP`)

          // If significant decay, notify the user
          if (decayResult.amount > 100) {
            try {
              interaction.user
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

        // Reset quests if needed
        await resetQuestsIfNeeded(user)

        // Execute command
        await command.execute(interaction, client, user)

        // Check for achievements after command execution
        await checkAchievements(user)

        // Save user changes
        await user.save()
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error)

        // Safely respond to the interaction
        try {
          const errorMessage = "There was an error executing this command!"

          if (interaction.deferred || interaction.replied) {
            // If we've already sent an initial response, use followUp
            await interaction
              .followUp({
                content: errorMessage,
                ephemeral: true,
              })
              .catch((e) => {
                // If followUp fails, just log it - don't throw another error
                console.error("Failed to send error followUp:", e)
              })
          } else {
            // If we haven't responded yet, use reply
            await interaction
              .reply({
                content: errorMessage,
                ephemeral: true,
              })
              .catch((e) => {
                // If reply fails, just log it - don't throw another error
                console.error("Failed to send error reply:", e)
              })
          }
        } catch (replyError) {
          // If all error handling fails, just log it and continue
          console.error("Failed to respond with error message:", replyError)
        }
      }
    }
  },
}
