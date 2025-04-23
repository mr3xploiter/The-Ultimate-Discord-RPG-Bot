const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { getUserRank, getNextRank, getXPProgressToNextRank, getRankProgressBar } = require("../../utils/rankUtils")
const { getTotalXPForLevel } = require("../../utils/levelUtils")
const User = require("../../models/userModel")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("View your rank or another user's rank")
    .addUserOption((option) => option.setName("user").setDescription("The user whose rank to view").setRequired(false)),
  cooldown: 3,

  async execute(interaction, client, user) {
    // Check if viewing another user's rank
    const targetUser = interaction.options.getUser("user") || interaction.user

    // If viewing another user, fetch their data
    let profileUser = user
    if (targetUser.id !== interaction.user.id) {
      profileUser = await User.findOne({ userId: targetUser.id })
      if (!profileUser) {
        return interaction.reply({
          content: "That user hasn't started their PixelMon journey yet!",
          ephemeral: true,
        })
      }
    }

    // Get rank information
    const rank = getUserRank(profileUser)
    const nextRank = getNextRank(profileUser)
    const progress = getXPProgressToNextRank(profileUser)

    // Calculate total XP
    const totalXP = profileUser.xp + getTotalXPForLevel(profileUser.level)

    // Create progress bar
    const progressBar = getRankProgressBar(progress.percentage, 15)

    // Calculate user's global rank position
    const allUsers = await User.find()
    const usersWithTotalXP = allUsers.map((u) => {
      const userTotalXP = u.xp + getTotalXPForLevel(u.level)
      return { userId: u.userId, totalXP: userTotalXP }
    })

    // Sort by total XP
    usersWithTotalXP.sort((a, b) => b.totalXP - a.totalXP)

    // Find user's position
    const rankPosition = usersWithTotalXP.findIndex((u) => u.userId === profileUser.userId) + 1

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${profileUser.username}'s Rank`)
      .setColor("#4169E1")
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "📍 Your Rank", value: `#${rankPosition}`, inline: true },
        { name: "🎖️ Tier", value: `${rank.emoji} **${rank.name}**`, inline: true },
        { name: "⭐ XP", value: `${totalXP}`, inline: true },
        { name: "🧬 Level", value: `${profileUser.level}`, inline: true },
        { name: "🏆 Battle Record", value: `${profileUser.wins}W / ${profileUser.losses}L`, inline: true },
      )
      .setFooter({ text: "PixelMon Game Bot" })
      .setTimestamp()

    // Add next rank information if not at max rank
    if (nextRank) {
      embed.addFields({
        name: `📈 Next Rank: ${nextRank.emoji} ${nextRank.name} (${progress.percentage}%)`,
        value: `${progress.currentProgress}/${progress.xpNeeded} XP (${progress.xpNeeded - progress.currentProgress} XP to go)\n${progressBar}`,
      })
    } else {
      embed.addFields({
        name: "📈 Maximum Rank Achieved!",
        value: `You've reached the highest rank: ${rank.emoji} **${rank.name}**\nTotal XP: ${totalXP} ✨`,
      })
    }

    await interaction.reply({ embeds: [embed] })
  },
}
