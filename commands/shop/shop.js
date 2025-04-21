const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

// Shop items
const shopItems = [
  { name: "Potion", price: 50, description: "A basic healing item" },
  { name: "Super Potion", price: 100, description: "A better healing item" },
  { name: "Rare Candy", price: 200, description: "Gives bonus XP when used" },
  { name: "Pokéball", price: 75, description: "Used to catch Pokémon" },
  { name: "Great Ball", price: 150, description: "Better than a regular Pokéball" },
  { name: "Ultra Ball", price: 300, description: "The best ball available in the shop" },
  { name: "Revive", price: 250, description: "Brings a fainted Pokémon back to battle" },
  { name: "Lucky Egg", price: 500, description: "Increases XP gain for a period of time" },
]

module.exports = {
  data: new SlashCommandBuilder().setName("shop").setDescription("View the shop"),
  cooldown: 3,

  async execute(interaction, client, user) {
    // Create shop list
    const shopList = shopItems
      .map((item, index) => `**${index + 1}.** ${item.name} - ${item.price} 🪙\n*${item.description}*`)
      .join("\n\n")

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle("PixelMon Shop")
      .setColor("#F1C40F")
      .setDescription(shopList)
      .addFields(
        { name: "Your Balance", value: `${user.coins} 🪙`, inline: true },
        { name: "How to Buy", value: "Use `/buy [item number]`", inline: true },
      )
      .setFooter({ text: "PixelMon Game Bot" })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  },
}
