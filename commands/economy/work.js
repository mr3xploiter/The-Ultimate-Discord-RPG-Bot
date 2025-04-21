const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

// Array of work scenarios
const workScenarios = [
  { task: "helped a trainer catch a wild Pokémon", min: 20, max: 50 },
  { task: "worked at the PokéMart", min: 30, max: 60 },
  { task: "delivered packages for Professor Oak", min: 25, max: 55 },
  { task: "cleaned the Pokémon Center", min: 15, max: 45 },
  { task: "assisted at the Battle Arena", min: 35, max: 70 },
  { task: "guided new trainers around town", min: 20, max: 50 },
  { task: "helped heal injured Pokémon", min: 30, max: 65 },
  { task: "organized a small Pokémon tournament", min: 40, max: 80 },
]

module.exports = {
  data: new SlashCommandBuilder().setName("work").setDescription("Work to earn coins (1 hour cooldown)"),
  cooldown: 5,

  async execute(interaction, client, user) {
    // Check if cooldown has passed (1 hour)
    if (!user.cooldownPassed("lastWork", 1)) {
      const nextWork = new Date(user.lastWork.getTime() + 1 * 60 * 60 * 1000)
      const timeLeft = nextWork - Date.now()

      const minutes = Math.floor(timeLeft / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      return interaction.reply({
        content: `You're still tired from your last job! You can work again in **${minutes}m ${seconds}s**.`,
        ephemeral: true,
      })
    }

    // Select random work scenario
    const scenario = workScenarios[Math.floor(Math.random() * workScenarios.length)]

    // Calculate rewards
    const coinsEarned = Math.floor(Math.random() * (scenario.max - scenario.min + 1)) + scenario.min
    const xpEarned = Math.floor(coinsEarned / 3) // XP is roughly 1/3 of coins earned

    // Update user data
    user.coins += coinsEarned
    user.lastWork = new Date()
    const leveledUp = await user.addXP(xpEarned)
    await user.save()

    // Create embed response
    const embed = new EmbedBuilder()
      .setTitle("Work Completed!")
      .setColor("#32CD32")
      .setDescription(`You ${scenario.task} and earned some rewards!`)
      .addFields(
        { name: "Coins Earned", value: `${coinsEarned} 🪙`, inline: true },
        { name: "XP Earned", value: `${xpEarned} ✨`, inline: true },
        { name: "Current Balance", value: `${user.coins} 🪙`, inline: true },
      )
      .setFooter({ text: "You can work again in 1 hour" })
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
