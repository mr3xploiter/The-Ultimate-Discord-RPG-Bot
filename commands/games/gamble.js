const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamble")
    .setDescription("Gamble your coins")
    .addIntegerOption((option) =>
      option.setName("amount").setDescription("Amount of coins to gamble").setRequired(true).setMinValue(10),
    ),
  cooldown: 5,

  async execute(interaction, client, user) {
    // Check if cooldown has passed (10 minutes)
    if (!user.cooldownPassed("lastGamble", 10 / 60)) {
      // 10/60 hours = 10 minutes
      const nextGamble = new Date(user.lastGamble.getTime() + 10 * 60 * 1000)
      const timeLeft = nextGamble - Date.now()

      const minutes = Math.floor(timeLeft / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      return interaction.reply({
        content: `You need to wait before gambling again! Try again in **${minutes}m ${seconds}s**.`,
        ephemeral: true,
      })
    }

    // Get amount to gamble
    const amount = interaction.options.getInteger("amount")

    // Check if user has enough coins
    if (user.coins < amount) {
      return interaction.reply({
        content: `You don't have enough coins! You have ${user.coins} 🪙`,
        ephemeral: true,
      })
    }

    // Calculate win chance (45%)
    const winChance = 0.45
    const userWins = Math.random() < winChance

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle("Gambling Results")
      .setColor("#E74C3C")
      .addFields({ name: "Amount Gambled", value: `${amount} 🪙`, inline: true })
      .setTimestamp()

    // Process result
    if (userWins) {
      // Calculate winnings (50-100% bonus)
      const winMultiplier = Math.random() * 0.5 + 1.5 // 1.5-2.0x
      const winnings = Math.floor(amount * winMultiplier)
      const profit = winnings - amount

      // Update user data
      user.coins += profit

      // Small XP reward for winning
      const xpEarned = Math.floor(amount / 20) // 5% of bet as XP
      const leveledUp = await user.addXP(xpEarned)

      // Set description and add fields
      embed
        .setDescription("🎉 **You won!** The odds were in your favor!")
        .setColor("#2ECC71")
        .addFields(
          { name: "Multiplier", value: `${winMultiplier.toFixed(2)}x`, inline: true },
          { name: "Winnings", value: `${winnings} 🪙`, inline: true },
          { name: "Profit", value: `+${profit} 🪙`, inline: true },
          { name: "XP Earned", value: `${xpEarned} ✨`, inline: true },
          { name: "New Balance", value: `${user.coins} 🪙`, inline: true },
        )

      // Add level up message if user leveled up
      if (leveledUp) {
        embed.addFields({
          name: "🎉 LEVEL UP!",
          value: `Congratulations! You are now level **${user.level}**!`,
        })
      }
    } else {
      // User loses their bet
      user.coins -= amount

      // Consolation XP (very small)
      const xpEarned = Math.max(1, Math.floor(amount / 50)) // 2% of bet as XP, minimum 1
      await user.addXP(xpEarned)

      // Set description and add fields
      embed
        .setDescription("❌ **You lost!** Better luck next time!")
        .addFields(
          { name: "Loss", value: `-${amount} 🪙`, inline: true },
          { name: "XP Earned", value: `${xpEarned} ✨ (consolation)`, inline: true },
          { name: "New Balance", value: `${user.coins} 🪙`, inline: true },
        )
    }

    // Update last gamble time
    user.lastGamble = new Date()
    await user.save()

    embed.setFooter({ text: "You can gamble again in 10 minutes" })

    await interaction.reply({ embeds: [embed] })
  },
}
