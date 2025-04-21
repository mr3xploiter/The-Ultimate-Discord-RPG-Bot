const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const User = require("../../models/userModel")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the leaderboard")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type of leaderboard to view")
        .setRequired(true)
        .addChoices(
          { name: "Coins", value: "coins" },
          { name: "XP", value: "xp" },
          { name: "Wins", value: "wins" },
          { name: "Level", value: "level" },
        ),
    ),
  cooldown: 10,

  async execute(interaction, client, user) {
    // Get leaderboard type from options
    const type = interaction.options.getString("type")

    // Define sort field and title based on type
    let sortField, title, emoji
    switch (type) {
      case "coins":
        sortField = "coins"
        title = "Coins Leaderboard"
        emoji = "🪙"
        break
      case "xp":
        sortField = "xp"
        title = "XP Leaderboard"
        emoji = "✨"
        break
      case "wins":
        sortField = "wins"
        title = "Wins Leaderboard"
        emoji = "🏆"
        break
      case "level":
        sortField = "level"
        title = "Level Leaderboard"
        emoji = "📊"
        break
      default:
        sortField = "coins"
        title = "Coins Leaderboard"
        emoji = "🪙"
    }

    // Fetch top 10 users
    const topUsers = await User.find()
      .sort({ [sortField]: -1 })
      .limit(10)

    // Create leaderboard list
    let description = ""
    topUsers.forEach((topUser, index) => {
      // Add medal for top 3
      let medal = ""
      if (index === 0) medal = "🥇 "
      else if (index === 1) medal = "🥈 "
      else if (index === 2) medal = "🥉 "

      description += `${medal}**${index + 1}.** <@${topUser.userId}> - ${topUser[sortField]} ${emoji}\n`
    })

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${title}`)
      .setColor("#FFD700")
      .setDescription(description || "No users found.")
      .setFooter({ text: "PixelMon Game Bot" })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  },
}
