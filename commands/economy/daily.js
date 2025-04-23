const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
  data: new SlashCommandBuilder().setName("daily").setDescription("Claim your daily coins and XP"),
  cooldown: 5, // Command cooldown in seconds (separate from the daily cooldown)

  async execute(interaction, client, user) {
    // Check if 24 hours have passed since last daily claim
    if (!user.cooldownPassed("lastDaily", 24)) {
      const nextDaily = new Date(user.lastDaily.getTime() + 24 * 60 * 60 * 1000)
      const timeLeft = nextDaily - Date.now()

      const hours = Math.floor(timeLeft / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

      return interaction.reply({
        content: `You've already claimed your daily reward! Come back in **${hours}h ${minutes}m**.`,
        ephemeral: true,
      })
    }

    // Calculate rewards (coins and XP)
    const coinsEarned = Math.floor(Math.random() * 100) + 100 // 100-199 coins
    const xpEarned = Math.floor(Math.random() * 20) + 10 // 10-29 XP

    // Update quest progress for earning coins
    user.updateQuestProgress("earn_coins", "any", coinsEarned)

    // Update user data
    user.coins += coinsEarned
    user.lastDaily = new Date()
    const leveledUp = await user.addXP(xpEarned)
    await user.save()

    // Create embed response
    const embed = new EmbedBuilder()
      .setTitle("Daily Reward Claimed!")
      .setColor("#FFD700")
      .setDescription(`You've claimed your daily reward!`)
      .addFields(
        { name: "Coins Earned", value: `${coinsEarned} 🪙`, inline: true },
        { name: "XP Earned", value: `${xpEarned} ✨`, inline: true },
        { name: "Current Balance", value: `${user.coins} 🪙`, inline: true },
      )
      .setFooter({ text: "Come back tomorrow for more rewards!" })
      .setTimestamp()

    // Add level up message if user leveled up
    if (leveledUp) {
      embed.addFields({
        name: "🎉 LEVEL UP!",
        value: `Congratulations! You are now level **${user.level}**!`,
      })
    }

    await interaction.reply({ embeds: [embed] })
  },
}
