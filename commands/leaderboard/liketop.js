const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const User = require("../../models/userModel")
const { getUserRank } = require("../../utils/rankUtils")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("liketop")
    .setDescription("View the most liked trainers")
    .addIntegerOption((option) =>
      option.setName("page").setDescription("Page number to view").setRequired(false).setMinValue(1),
    ),
  cooldown: 10,

  async execute(interaction, client, user) {
    // Get page from options
    let page = interaction.options.getInteger("page") || 1
    page = Math.max(1, page) // Ensure page is at least 1
    const pageSize = 10 // Show 10 users per page

    // Fetch all users
    const allUsers = await User.find()

    // Calculate like ratio and add rank information
    const rankedUsers = allUsers.map((u) => {
      const likesCount = u.profile.likes ? u.profile.likes.length : 0
      const dislikesCount = u.profile.dislikes ? u.profile.dislikes.length : 0
      const totalVotes = likesCount + dislikesCount
      const likeRatio = totalVotes > 0 ? (likesCount / totalVotes) * 100 : 0
      const rank = getUserRank(u)

      return {
        userId: u.userId,
        username: u.username,
        likesCount,
        dislikesCount,
        totalVotes,
        likeRatio,
        rank,
      }
    })

    // Sort by likes count (primary) and like ratio (secondary)
    rankedUsers.sort((a, b) => {
      if (b.likesCount !== a.likesCount) {
        return b.likesCount - a.likesCount
      }
      return b.likeRatio - a.likeRatio
    })

    // Calculate total pages
    const totalPages = Math.ceil(rankedUsers.length / pageSize)

    // Ensure page is within valid range
    page = Math.min(page, totalPages || 1)

    // Get users for current page
    const skip = (page - 1) * pageSize
    const topUsers = rankedUsers.slice(skip, skip + pageSize)

    // Create leaderboard list
    let description = ""
    topUsers.forEach((topUser, index) => {
      // Add medal for top 3
      let medal = ""
      if (skip + index === 0) medal = "🥇 "
      else if (skip + index === 1) medal = "🥈 "
      else if (skip + index === 2) medal = "🥉 "

      const likeRatioFormatted = topUser.likeRatio.toFixed(1)

      description += `${medal}**${skip + index + 1}.** ${topUser.rank.emoji} **${topUser.username}** — 👍 ${topUser.likesCount} | 👎 ${topUser.dislikesCount} | Rating: ${likeRatioFormatted}%\n`
    })

    if (description === "") {
      description = "No trainers with likes found yet. Be the first to get liked!"
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`👍 Most Liked Trainers - Page ${page}/${totalPages || 1}`)
      .setColor("#FFD700")
      .setDescription(description)
      .setFooter({ text: "PixelMon Game Bot" })
      .setTimestamp()

    // Create pagination buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`liketop_prev_${page}`)
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`liketop_next_${page}`)
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= totalPages || totalPages === 0),
      new ButtonBuilder().setCustomId(`liketop_self`).setLabel("View Your Rank").setStyle(ButtonStyle.Success),
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

      const [action, direction, currentPage] = i.customId.split("_")
      let newPage = Number.parseInt(currentPage) || page

      if (direction === "prev") {
        newPage = Math.max(1, newPage - 1)
      } else if (direction === "next") {
        newPage = Math.min(totalPages, newPage + 1)
      } else if (direction === "self") {
        // Find user's rank position
        const userRankIndex = rankedUsers.findIndex((u) => u.userId === user.userId)
        const userRankPosition = userRankIndex + 1

        // Calculate which page the user is on
        const userPage = Math.ceil(userRankPosition / pageSize)

        // Update to show that page
        newPage = userPage > 0 ? userPage : 1
      }

      // Get users for new page
      const newSkip = (newPage - 1) * pageSize
      const newTopUsers = rankedUsers.slice(newSkip, newSkip + pageSize)

      // Create new leaderboard list
      let newDescription = ""
      newTopUsers.forEach((topUser, index) => {
        // Add medal for top 3
        let medal = ""
        if (newSkip + index === 0) medal = "🥇 "
        else if (newSkip + index === 1) medal = "🥈 "
        else if (newSkip + index === 2) medal = "🥉 "

        const likeRatioFormatted = topUser.likeRatio.toFixed(1)

        newDescription += `${medal}**${newSkip + index + 1}.** ${topUser.rank.emoji} **${topUser.username}** — 👍 ${topUser.likesCount} | 👎 ${topUser.dislikesCount} | Rating: ${likeRatioFormatted}%\n`
      })

      if (newDescription === "") {
        newDescription = "No trainers with likes found yet. Be the first to get liked!"
      }

      // Create new embed
      const newEmbed = new EmbedBuilder()
        .setTitle(`👍 Most Liked Trainers - Page ${newPage}/${totalPages || 1}`)
        .setColor("#FFD700")
        .setDescription(newDescription)
        .setFooter({ text: "PixelMon Game Bot" })
        .setTimestamp()

      // Create new pagination buttons
      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`liketop_prev_${newPage}`)
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(newPage <= 1),
        new ButtonBuilder()
          .setCustomId(`liketop_next_${newPage}`)
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(newPage >= totalPages || totalPages === 0),
        new ButtonBuilder().setCustomId(`liketop_self`).setLabel("View Your Rank").setStyle(ButtonStyle.Success),
      )

      // Update the message
      await i.update({ embeds: [newEmbed], components: [newRow] })
    })

    collector.on("end", () => {
      // Remove buttons when collector expires
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("liketop_prev_disabled")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("liketop_next_disabled")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("liketop_self_disabled")
          .setLabel("View Your Rank")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
      )

      message.edit({ components: [disabledRow] }).catch(() => {})
    })
  },
}
