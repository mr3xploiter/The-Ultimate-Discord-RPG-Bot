const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guess")
    .setDescription("Guess a number between 1 and 10")
    .addIntegerOption((option) =>
      option.setName("number").setDescription("Your guess (1-10)").setRequired(true).setMinValue(1).setMaxValue(10),
    ),
  cooldown: 5,

  async execute(interaction, client, user) {
    // Check if cooldown has passed (5 minutes)
    if (!user.cooldownPassed("lastGuess", 5 / 60)) {
      // 5/60 hours = 5 minutes
      const nextGuess = new Date(user.lastGuess.getTime() + 5 * 60 * 1000)
      const timeLeft = nextGuess - Date.now()

      const minutes = Math.floor(timeLeft / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      return interaction.reply({
        content: `You need to wait before guessing again! Try again in **${minutes}m ${seconds}s**.`,
        ephemeral: true,
      })
    }

    // Get user's guess
    const userGuess = interaction.options.getInteger("number")

    // Generate random number
    const correctNumber = Math.floor(Math.random() * 10) + 1 // 1-10

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle("Number Guessing Game")
      .setColor("#3498DB")
      .addFields(
        { name: "Your Guess", value: `${userGuess}`, inline: true },
        { name: "Correct Number", value: `${correctNumber}`, inline: true },
      )
      .setTimestamp()

    // Check if guess is correct
    if (userGuess === correctNumber) {
      // Calculate rewards
      const coinsEarned = Math.floor(Math.random() * 20) + 10 // 10-29 coins
      const xpEarned = Math.floor(Math.random() * 8) + 3 // 3-10 XP

      // Update user data
      user.coins += coinsEarned
      const leveledUp = await user.addXP(xpEarned)

      // Set description and add fields
      embed
        .setDescription("🎉 **Correct!** You guessed the right number!")
        .addFields(
          { name: "Coins Earned", value: `${coinsEarned} 🪙`, inline: true },
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
      // Wrong guess
      const xpEarned = 1 // Consolation XP
      await user.addXP(xpEarned)

      // Set description and add fields
      embed
        .setDescription("❌ **Wrong!** Better luck next time!")
        .addFields({ name: "XP Earned", value: `${xpEarned} ✨ (consolation)`, inline: true })

      // Give hint
      if (userGuess < correctNumber) {
        embed.addFields({ name: "Hint", value: "Your guess was too low!", inline: true })
      } else {
        embed.addFields({ name: "Hint", value: "Your guess was too high!", inline: true })
      }
    }

    // Update last guess time
    user.lastGuess = new Date()
    await user.save()

    embed.setFooter({ text: "You can guess again in 5 minutes" })

    await interaction.reply({ embeds: [embed] })
  },
}
