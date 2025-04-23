const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const User = require("../../models/userModel")
const { getUserRank } = require("../../utils/rankUtils")
const { getTotalXPForLevel } = require("../../utils/levelUtils")

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
          { name: "Rank", value: "rank" },
        ),
    )
    .addIntegerOption((option) =>
      option.setName("page").setDescription("Page number to view").setRequired(false).setMinValue(1),
    ),
  cooldown: 10,

  async execute(interaction, client, user) {
    // Get leaderboard type and page from options
    const type = interaction.options.getString("type")
    let page = interaction.options.getInteger("page") || 1
    page = Math.max(1, page) // Ensure page is at least 1
    const pageSize = 15 // Show 15 users per page

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
      case "rank":
        sortField = "xp" // Rank is based on total XP
        title = "Rank Leaderboard"
        emoji = "🏅"
        break
      default:
        sortField = "coins"
        title = "Coins Leaderboard"
        emoji = "🪙"
    }

    // Calculate total users for pagination
    const totalUsers = await User.countDocuments()
    const totalPages = Math.ceil(totalUsers / pageSize)

    // Ensure page is within valid range
    page = Math.min(page, totalPages)

    // Fetch users for current page
    const skip = (page - 1) * pageSize
    const topUsers = await User.find()
      .sort({ [sortField]: -1 })
      .skip(skip)
      .limit(pageSize)

    // Create leaderboard list
    let description = ""

    if (type === "rank") {
      // For rank leaderboard, calculate total XP and show rank information
      const usersWithTotalXP = topUsers.map((topUser) => {
        const totalXP = topUser.xp + getTotalXPForLevel(topUser.level)
        const rank = getUserRank(topUser)
        const likesCount = topUser.profile.likes ? topUser.profile.likes.length : 0
        const dislikesCount = topUser.profile.dislikes ? topUser.profile.dislikes.length : 0
        const totalVotes = likesCount + dislikesCount
        const likeRatio = totalVotes > 0 ? (likesCount / totalVotes) * 100 : 0
        const likeRatioDisplay = totalVotes > 0 ? ` | 👍 ${likeRatio.toFixed(0)}%` : ""

        return {
          ...topUser.toObject(),
          totalXP,
          rank,
          likeRatioDisplay,
        }
      })

      // Sort by total XP
      usersWithTotalXP.sort((a, b) => b.totalXP - a.totalXP)

      usersWithTotalXP.forEach((topUser, index) => {
        // Add medal for top 3
        let medal = ""
        if (skip + index === 0) medal = "🥇 "
        else if (skip + index === 1) medal = "🥈 "
        else if (skip + index === 2) medal = "🥉 "

        description += `${medal}**${skip + index + 1}.** ${topUser.rank.emoji} <@${topUser.userId}> — **${topUser.rank.name}** — ${topUser.totalXP} XP${topUser.likeRatioDisplay}\n`
      })
    } else {
      // For other leaderboard types
      topUsers.forEach((topUser, index) => {
        // Add medal for top 3
        let medal = ""
        if (skip + index === 0) medal = "🥇 "
        else if (skip + index === 1) medal = "🥈 "
        else if (skip + index === 2) medal = "🥉 "

        // Add like ratio if available
        const likesCount = topUser.profile?.likes ? topUser.profile.likes.length : 0
        const dislikesCount = topUser.profile?.dislikes ? topUser.profile.dislikes.length : 0
        const totalVotes = likesCount + dislikesCount
        const likeRatio = totalVotes > 0 ? (likesCount / totalVotes) * 100 : 0
        const likeRatioDisplay = totalVotes > 0 ? ` | 👍 ${likeRatio.toFixed(0)}%` : ""

        description += `${medal}**${skip + index + 1}.** <@${topUser.userId}> - ${topUser[sortField]} ${emoji}${likeRatioDisplay}\n`
      })
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${title} - Page ${page}/${totalPages}`)
      .setColor("#FFD700")
      .setDescription(description || "No users found.")
      .setFooter({ text: "PixelMon Game Bot" })
      .setTimestamp()

    // Create pagination buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`leaderboard_prev_${type}_${page}`)
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`leaderboard_next_${type}_${page}`)
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= totalPages),
      new ButtonBuilder()
        .setCustomId(`leaderboard_self_${type}`)
        .setLabel("View Your Rank")
        .setStyle(ButtonStyle.Success),
    )

    // Send the embed with buttons
    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true })

    // Create button collector
    const collector = message.createMessageComponentCollector({ time: 60000 }) // 1 minute timeout

    collector.on("collect", async (i) => {
      // Only allow the original user to interact with buttons
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: "These buttons are not for you!", ephemeral: true })
      }

      const [action, direction, buttonType, currentPage] = i.customId.split("_")
      let newPage = Number.parseInt(currentPage)

      if (direction === "prev") {
        newPage = Math.max(1, newPage - 1)
      } else if (direction === "next") {
        newPage = Math.min(totalPages, newPage + 1)
      } else if (direction === "self") {
        // Find user's rank
        let userRank = 0
        if (buttonType === "rank") {
          // For rank leaderboard, need to calculate total XP for all users
          const allUsers = await User.find()
          const usersWithTotalXP = allUsers.map((u) => {
            const totalXP = u.xp + getTotalXPForLevel(u.level)
            return { userId: u.userId, totalXP }
          })

          // Sort by total XP
          usersWithTotalXP.sort((a, b) => b.totalXP - a.totalXP)

          // Find user's position
          userRank = usersWithTotalXP.findIndex((u) => u.userId === user.userId) + 1
        } else {
          // For other leaderboard types
          const count = await User.countDocuments({ [sortField]: { $gt: user[sortField] } })
          userRank = count + 1
        }

        // Calculate which page the user is on
        const userPage = Math.ceil(userRank / pageSize)

        // Update to show that page
        newPage = userPage
      }

      // Fetch users for new page
      const newSkip = (newPage - 1) * pageSize
      const newTopUsers = await User.find()
        .sort({ [sortField]: -1 })
        .skip(newSkip)
        .limit(pageSize)

      // Create new leaderboard list
      let newDescription = ""

      if (buttonType === "rank") {
        // For rank leaderboard
        const usersWithTotalXP = newTopUsers.map((topUser) => {
          const totalXP = topUser.xp + getTotalXPForLevel(topUser.level)
          const rank = getUserRank(topUser)
          return { ...topUser.toObject(), totalXP, rank }
        })

        // Sort by total XP
        usersWithTotalXP.sort((a, b) => b.totalXP - a.totalXP)

        usersWithTotalXP.forEach((topUser, index) => {
          // Add medal for top 3
          let medal = ""
          if (newSkip + index === 0) medal = "🥇 "
          else if (newSkip + index === 1) medal = "🥈 "
          else if (newSkip + index === 2) medal = "🥉 "

          newDescription += `${medal}**${newSkip + index + 1}.** ${topUser.rank.emoji} <@${topUser.userId}> — **${topUser.rank.name}** — ${topUser.totalXP} XP\n`
        })
      } else {
        // For other leaderboard types
        newTopUsers.forEach((topUser, index) => {
          // Add medal for top 3
          let medal = ""
          if (newSkip + index === 0) medal = "🥇 "
          else if (newSkip + index === 1) medal = "🥈 "
          else if (newSkip + index === 2) medal = "🥉 "

          newDescription += `${medal}**${newSkip + index + 1}.** <@${topUser.userId}> - ${topUser[sortField]} ${emoji}\n`
        })
      }

      // Create new embed
      const newEmbed = new EmbedBuilder()
        .setTitle(`${title} - Page ${newPage}/${totalPages}`)
        .setColor("#FFD700")
        .setDescription(newDescription || "No users found.")
        .setFooter({ text: "PixelMon Game Bot" })
        .setTimestamp()

      // Create new pagination buttons
      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`leaderboard_prev_${buttonType}_${newPage}`)
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(newPage <= 1),
        new ButtonBuilder()
          .setCustomId(`leaderboard_next_${buttonType}_${newPage}`)
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(newPage >= totalPages),
        new ButtonBuilder()
          .setCustomId(`leaderboard_self_${buttonType}`)
          .setLabel("View Your Rank")
          .setStyle(ButtonStyle.Success),
      )

      // Update the message
      await i.update({ embeds: [newEmbed], components: [newRow] })
    })

    collector.on("end", () => {
      // Remove buttons when collector expires
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("leaderboard_prev_disabled")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("leaderboard_next_disabled")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("leaderboard_self_disabled")
          .setLabel("View Your Rank")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
      )

      message.edit({ components: [disabledRow] }).catch(() => {})
    })
  },
}
