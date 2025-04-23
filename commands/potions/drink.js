const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { potions, applyPotion, cleanupExpiredEffects } = require("../../utils/potionUtils")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("drink")
    .setDescription("Drink a potion to gain temporary effects")
    .addStringOption((option) =>
      option
        .setName("potion")
        .setDescription("The potion to drink")
        .setRequired(true)
        .addChoices(
          { name: "Small XP Boost", value: "XP_BOOST_SMALL" },
          { name: "Medium XP Boost", value: "XP_BOOST_MEDIUM" },
          { name: "Large XP Boost", value: "XP_BOOST_LARGE" },
          { name: "Small Coin Boost", value: "COIN_BOOST_SMALL" },
          { name: "Medium Coin Boost", value: "COIN_BOOST_MEDIUM" },
          { name: "Large Coin Boost", value: "COIN_BOOST_LARGE" },
          { name: "Battle Shield", value: "BATTLE_SHIELD" },
          { name: "Lucky Charm", value: "LUCKY_CHARM" },
        ),
    ),
  cooldown: 5,

  async execute(interaction, client, user) {
    // Clean up expired effects
    cleanupExpiredEffects(user)

    // Get potion ID from options
    const potionId = interaction.options.getString("potion")
    const potion = potions[potionId]

    if (!potion) {
      return interaction.reply({
        content: "Invalid potion selected!",
        ephemeral: true,
      })
    }

    // Check if user has the potion
    if (!user.inventory.includes(potion.name)) {
      return interaction.reply({
        content: `You don't have any ${potion.name} potions! You can buy them from the shop.`,
        ephemeral: true,
      })
    }

    // Apply the potion effect
    const effect = applyPotion(user, potionId)

    if (!effect) {
      return interaction.reply({
        content: "Failed to apply potion effect!",
        ephemeral: true,
      })
    }

    // Save user
    await user.save()

    // Calculate duration in hours and minutes
    const durationMs = effect.expiresAt - new Date()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`Potion Consumed: ${potion.name}`)
      .setColor("#9B59B6")
      .setDescription(`You drank a ${potion.name} and gained its effects!`)
      .addFields(
        { name: "Effect", value: potion.description, inline: false },
        { name: "Duration", value: `${hours}h ${minutes}m`, inline: true },
        { name: "Expires At", value: `<t:${Math.floor(effect.expiresAt.getTime() / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: "Use /effects to view your active effects" })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  },
}
