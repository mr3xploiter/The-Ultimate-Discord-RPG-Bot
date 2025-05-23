module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`✅ Bot is online! Logged in as ${client.user.tag}`)

    // Set the bot's status to "Streaming" with a message about commands
    client.user.setActivity("Use /help or pixel help", {
      type: "STREAMING",
      url: "https://www.twitch.tv/pixelmon",
    })

    // Set the bot's custom status message
    client.user.setPresence({
      activities: [
        {
          name: "Use pixel commands or /commands",
          type: "PLAYING",
        },
      ],
      status: "online",
    })

    // Log all available commands
    const commandCount = client.commands.size
    console.log(`📋 Loaded ${commandCount} commands:`)
    client.commands.forEach((command) => {
      console.log(`  - /${command.data.name} or pixel ${command.data.name}`)
    })
  },
}
