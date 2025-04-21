const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
  data: new SlashCommandBuilder().setName("inventory").setDescription("View your inventory"),
  cooldown: 3,

  async execute(interaction, client, user) {
    // Check if inventory is empty
    if (user.inventory.length === 0) {
      return interaction.reply({
        content: "Your inventory is empty! Use the `/shop` command to buy items or `/hunt` to find items.",
        ephemeral: true,
      })
    }

    // Count occurrences of each item
    const itemCounts = {}
    user.inventory.forEach((item) => {
      itemCounts[item] = (itemCounts[item] || 0) + 1
    })

    // Create inventory list
    const inventoryList = Object.entries(itemCounts)
      .map(([item, count]) => `${item} x${count}`)
      .join("\n")

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Inventory`)
      .setColor("#9B59B6")
      .setDescription(inventoryList)
      .setFooter({ text: `Total Items: ${user.inventory.length}` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  },
}
