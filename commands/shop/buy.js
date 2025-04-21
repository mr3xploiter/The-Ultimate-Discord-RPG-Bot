const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

// Shop items (same as in shop.js)
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
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy an item from the shop")
    .addIntegerOption((option) =>
      option
        .setName("item")
        .setDescription("Item number from the shop")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(shopItems.length),
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("How many to buy (default: 1)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10),
    ),
  cooldown: 3,

  async execute(interaction, client, user) {
    // Get item number and quantity
    const itemNumber = interaction.options.getInteger("item")
    const quantity = interaction.options.getInteger("quantity") || 1

    // Get item from shop
    const item = shopItems[itemNumber - 1]

    // Calculate total cost
    const totalCost = item.price * quantity

    // Check if user has enough coins
    if (user.coins < totalCost) {
      return interaction.reply({
        content: `You don't have enough coins to buy ${quantity}x ${item.name}! You need ${totalCost} 🪙 but you only have ${user.coins} 🪙.`,
        ephemeral: true,
      })
    }

    // Update user data
    user.coins -= totalCost
    for (let i = 0; i < quantity; i++) {
      user.inventory.push(item.name)
    }
    await user.save()

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle("Purchase Successful!")
      .setColor("#2ECC71")
      .setDescription(`You bought ${quantity}x **${item.name}** for ${totalCost} 🪙!`)
      .addFields(
        { name: "Item", value: item.name, inline: true },
        { name: "Quantity", value: `${quantity}`, inline: true },
        { name: "Cost", value: `${totalCost} 🪙`, inline: true },
        { name: "Remaining Balance", value: `${user.coins} 🪙`, inline: true },
      )
      .setFooter({ text: "Check your inventory with /inventory" })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  },
}
