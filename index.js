require("dotenv").config()
const fs = require("fs")
const path = require("path")
const { Client, Collection, GatewayIntentBits, REST, Routes } = require("discord.js")
const mongoose = require("mongoose")
const chalk = require("chalk")

// Initialize Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
})

// Collections for commands and cooldowns
client.commands = new Collection()
client.cooldowns = new Collection()

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err))

// Load commands
async function loadCommands() {
  const commands = []
  const commandFolders = fs.readdirSync(path.join(__dirname, "commands"))

  for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(path.join(__dirname, "commands", folder)).filter((file) => file.endsWith(".js"))

    for (const file of commandFiles) {
      const command = require(path.join(__dirname, "commands", folder, file))
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command)
        commands.push(command.data.toJSON())
        console.log(`📝 Loaded command: ${command.data.name}`)
      } else {
        console.log(`⚠️ Command at ${file} is missing required properties.`)
      }
    }
  }

  return commands
}

// Register slash commands
async function registerCommands(commands) {
  try {
    console.log("🔄 Started refreshing application commands...")

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN)

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })

    console.log("✅ Successfully registered application commands.")
  } catch (error) {
    console.error("❌ Error registering commands:", error)
  }
}

// Load events
function loadEvents() {
  const eventFiles = fs.readdirSync(path.join(__dirname, "events")).filter((file) => file.endsWith(".js"))

  for (const file of eventFiles) {
    const event = require(path.join(__dirname, "events", file))
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client))
    } else {
      client.on(event.name, (...args) => event.execute(...args, client))
    }
    console.log(`📡 Loaded event: ${event.name}`)
  }
}

// Initialize bot
async function init() {
  try {
    // Load commands and events
    const commands = await loadCommands()
    loadEvents()

    // Register slash commands
    await registerCommands(commands)

    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN)
  } catch (error) {
    console.error("❌ Initialization error:", error)
  }
}

init()
