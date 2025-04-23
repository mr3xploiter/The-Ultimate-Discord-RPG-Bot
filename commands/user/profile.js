const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { getProgressBar, getXPForLevel } = require("../../utils/levelUtils")
const { getUserRank, getNextRank, getXPProgressToNextRank, getRankProgressBar } = require("../../utils/rankUtils")
const { getTotalXPForLevel } = require("../../utils/levelUtils")
const User = require("../../models/userModel")

// Background color themes
const backgroundThemes = {
  default: "#4169E1", // Royal Blue
  fire: "#FF4500", // Orange Red
  water: "#1E90FF", // Dodger Blue
  grass: "#32CD32", // Lime Green
  electric: "#FFD700", // Gold
  psychic: "#FF69B4", // Hot Pink
  dark: "#36393F", // Discord Dark
  ghost: "#9370DB", // Medium Purple
  dragon: "#7B68EE", // Medium Slate Blue
  fairy: "#FFB6C1", // Light Pink
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your profile or another user's profile")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user whose profile to view").setRequired(false),
    ),
  cooldown: 3,

  async execute(interaction, client, user) {
    // Check if viewing another user's profile
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
    const progressBar = getRankProgressBar(progress.percentage, 10)

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

    // Calculate win rate
    const totalBattles = profileUser.wins + profileUser.losses
    const winRate = totalBattles > 0 ? ((profileUser.wins / totalBattles) * 100).toFixed(1) : "0.0"

    // Calculate animal stats
    const totalAnimals = profileUser.farm.animals.length
    // Count rare animals (animals with base chance <= 0.1)
    const rareAnimals = profileUser.farm.animals.filter((animal) =>
      ["Dragon", "Unicorn", "Phoenix", "Wolf", "Bear", "Owl", "Eagle"].includes(animal.type),
    ).length

    // Calculate total animal power
    let animalPowerLevel = 0
    profileUser.farm.animals.forEach((animal) => {
      animalPowerLevel += animal.strength * 2 + animal.level * 5 + Math.floor(animal.health / 10)
    })

    // Calculate quests completed
    const questsCompleted =
      profileUser.quests.daily.filter((q) => q.completed).length +
      profileUser.quests.weekly.filter((q) => q.completed).length

    // Calculate time since last active
    const lastActive = profileUser.lastActivity ? new Date(profileUser.lastActivity) : new Date()
    const now = new Date()
    const diffMs = now - lastActive
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    let lastActiveText
    if (diffMins < 1) {
      lastActiveText = "Just now"
    } else if (diffMins < 60) {
      lastActiveText = `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    } else if (diffHours < 24) {
      lastActiveText = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else {
      lastActiveText = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    }

    // Get background color from theme
    const bgColor = backgroundThemes[profileUser.profile.background] || backgroundThemes.default

    // Get likes and dislikes count
    const likesCount = profileUser.profile.likes ? profileUser.profile.likes.length : 0
    const dislikesCount = profileUser.profile.dislikes ? profileUser.profile.dislikes.length : 0

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`🪪 Pixelmon Trainer Profile — ${profileUser.username}`)
      .setColor(bgColor)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${profileUser.profile.title}**\n\n${profileUser.profile.bio}`)
      .addFields(
        {
          name: "👑 Rank Information",
          value: `**Rank Tier:** ${rank.emoji} **${rank.name}** (Tier ${rank.tier})
${
  nextRank
    ? `**Next Rank:** ${nextRank.emoji} ${nextRank.name} @ ${nextRank.xpNeeded} XP
**Progress:** ${progressBar} (${progress.percentage}%)`
    : "**Maximum Rank Achieved!**"
}`,
          inline: false,
        },
        {
          name: "📊 Stats",
          value: `**XP:** ${totalXP}
**Level:** ${profileUser.level}
**Global Rank:** #${rankPosition}
**Coins:** ${profileUser.coins} 🪙`,
          inline: true,
        },
        {
          name: "⚔️ Battle Stats",
          value: `**Wins:** ${profileUser.wins}
**Losses:** ${profileUser.losses}
**Win Rate:** ${winRate}%`,
          inline: true,
        },
        {
          name: "🐾 Animal Stats",
          value: `**Total Animals:** ${totalAnimals}/${profileUser.getMaxAnimals()}
**Rare Animals:** ${rareAnimals}
**Animal Power:** ${animalPowerLevel}`,
          inline: true,
        },
        {
          name: "📈 Progress",
          value: `**Mining XP:** ${profileUser.resources.stone + profileUser.resources.iron * 2 + profileUser.resources.gold * 3 + profileUser.resources.diamond * 5}
**Quests Completed:** ${questsCompleted}
**Achievements:** ${profileUser.achievements.length}`,
          inline: true,
        },
        {
          name: "🕓 Activity",
          value: `**Last Active:** ${lastActiveText}
**Favorite Item:** ${profileUser.profile.favoriteItem}`,
          inline: true,
        },
        {
          name: "👍 Reputation",
          value: `**Likes:** ${likesCount} | **Dislikes:** ${dislikesCount}`,
          inline: true,
        },
      )
      .setFooter({ text: "PixelMon Game Bot" })
      .setTimestamp()

    // Create like/dislike buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`profile_like_${profileUser.userId}`)
        .setLabel(`Like (${likesCount})`)
        .setStyle(ButtonStyle.Success)
        .setEmoji("👍")
        .setDisabled(interaction.user.id === profileUser.userId), // Disable if viewing own profile
      new ButtonBuilder()
        .setCustomId(`profile_dislike_${profileUser.userId}`)
        .setLabel(`Dislike (${dislikesCount})`)
        .setStyle(ButtonStyle.Danger)
        .setEmoji("👎")
        .setDisabled(interaction.user.id === profileUser.userId), // Disable if viewing own profile
    )

    // Send the embed with buttons
    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true })

    // Create button collector
    const collector = message.createMessageComponentCollector({ time: 300000 }) // 5 minute timeout

    collector.on("collect", async (i) => {
      // Handle button interactions
      const [action, voteType, targetUserId] = i.customId.split("_")

      // Fetch the target user
      const targetUserDoc = await User.findOne({ userId: targetUserId })
      if (!targetUserDoc) {
        return i.reply({ content: "User not found!", ephemeral: true })
      }

      // Check if user is trying to vote on their own profile
      if (i.user.id === targetUserId) {
        return i.reply({ content: "You cannot vote on your own profile!", ephemeral: true })
      }

      // Check cooldown (1 minute between votes)
      const lastVoteTime = targetUserDoc.profile.lastVoteTime?.get(i.user.id)
      if (lastVoteTime) {
        const timeSinceLastVote = Date.now() - lastVoteTime
        if (timeSinceLastVote < 60000) {
          // 1 minute in milliseconds
          const timeLeft = Math.ceil((60000 - timeSinceLastVote) / 1000)
          return i.reply({
            content: `You need to wait ${timeLeft} seconds before voting again on this profile.`,
            ephemeral: true,
          })
        }
      }

      // Handle vote
      if (voteType === "like") {
        // Check if user already liked
        const alreadyLiked = targetUserDoc.profile.likes.includes(i.user.id)

        if (alreadyLiked) {
          // Remove like
          targetUserDoc.profile.likes = targetUserDoc.profile.likes.filter((id) => id !== i.user.id)
        } else {
          // Add like and remove dislike if exists
          targetUserDoc.profile.likes.push(i.user.id)
          targetUserDoc.profile.dislikes = targetUserDoc.profile.dislikes.filter((id) => id !== i.user.id)
        }
      } else if (voteType === "dislike") {
        // Check if user already disliked
        const alreadyDisliked = targetUserDoc.profile.dislikes.includes(i.user.id)

        if (alreadyDisliked) {
          // Remove dislike
          targetUserDoc.profile.dislikes = targetUserDoc.profile.dislikes.filter((id) => id !== i.user.id)
        } else {
          // Add dislike and remove like if exists
          targetUserDoc.profile.dislikes.push(i.user.id)
          targetUserDoc.profile.likes = targetUserDoc.profile.likes.filter((id) => id !== i.user.id)
        }
      }

      // Update last vote time
      if (!targetUserDoc.profile.lastVoteTime) {
        targetUserDoc.profile.lastVoteTime = new Map()
      }
      targetUserDoc.profile.lastVoteTime.set(i.user.id, Date.now())

      // Save changes
      await targetUserDoc.save()

      // Update button labels with new counts
      const newLikesCount = targetUserDoc.profile.likes.length
      const newDislikesCount = targetUserDoc.profile.dislikes.length

      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`profile_like_${targetUserDoc.userId}`)
          .setLabel(`Like (${newLikesCount})`)
          .setStyle(ButtonStyle.Success)
          .setEmoji("👍")
          .setDisabled(i.user.id === targetUserDoc.userId),
        new ButtonBuilder()
          .setCustomId(`profile_dislike_${targetUserDoc.userId}`)
          .setLabel(`Dislike (${newDislikesCount})`)
          .setStyle(ButtonStyle.Danger)
          .setEmoji("👎")
          .setDisabled(i.user.id === targetUserDoc.userId),
      )

      // Update the message
      await i.update({ components: [newRow] })
    })

    collector.on("end", () => {
      // Remove buttons when collector expires
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`profile_like_disabled`)
          .setLabel(`Like (${likesCount})`)
          .setStyle(ButtonStyle.Success)
          .setEmoji("👍")
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`profile_dislike_disabled`)
          .setLabel(`Dislike (${dislikesCount})`)
          .setStyle(ButtonStyle.Danger)
          .setEmoji("👎")
          .setDisabled(true),
      )

      message.edit({ components: [disabledRow] }).catch(() => {})
    })
  },
}
