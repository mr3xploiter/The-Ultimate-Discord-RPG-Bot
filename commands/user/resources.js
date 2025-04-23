const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

// Resource emojis
const resourceEmojis = {
  stone: "🪨",
  iron: "⚙️",
  gold: "🥇",
  diamond: "💎",
  emerald: "💚",
  obsidian: "🟣",
  crystal: "✨",
}

module.exports = {
  data: new SlashCommandBuilder().setName("resources").setDescription("View your resources"),
  cooldown: 3,

  async execute(interaction, client, user) {
    // Create resources list
    let resourcesList = ""
    let totalResources = 0

    for (const [resource, amount] of Object.entries(user.resources)) {
      if (resourceEmojis[resource]) {
        resourcesList += `${resourceEmojis[resource]} **${resource}**: ${amount}\n`
        totalResources += amount
      }
    }

    if (totalResources === 0) {
      resourcesList = "You don't have any resources yet. Use the `/mine` command to gather resources!"
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Resources`)
      .setColor("#8B4513")
      .setDescription(resourcesList)
      .setFooter({ text: `Total Resources: ${totalResources}` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  },
}
