const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const User = require("../../models/userModel")
const { getUserRank } = require("../../utils/rankUtils")
const { getTotalXPForLevel } = require("../../utils/levelUtils")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("battle")
    .setDescription("Battle another user")
    .addUserOption((option) =>
      option.setName("opponent").setDescription("The user you want to battle").setRequired(true),
    ),
  cooldown: 10,

  async execute(interaction, client, user) {
    // Get opponent from options
    const opponent = interaction.options.getUser("opponent")

    // Check if user is trying to battle themselves
    if (opponent.id === interaction.user.id) {
      return interaction.reply({
        content: "You can't battle yourself!",
        ephemeral: true,
      })
    }

    // Check if opponent is a bot
    if (opponent.bot) {
      return interaction.reply({
        content: "You can't battle a bot!",
        ephemeral: true,
      })
    }

    // Check if user is on cooldown (10 minutes)
    if (!user.cooldownPassed("lastBattle", 1 / 6)) {
      // 1/6 of an hour = 10 minutes
      const nextBattle = new Date(user.lastBattle.getTime() + 10 * 60 * 1000)
      const timeLeft = nextBattle - Date.now()

      const minutes = Math.floor(timeLeft / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      return interaction.reply({
        content: `You need to rest after your last battle! You can battle again in **${minutes}m ${seconds}s**.`,
        ephemeral: true,
      })
    }

    // Find or create opponent in database
    const opponentUser = await User.findOrCreate(opponent.id, opponent.username)

    // Get rank information for both users
    const userRank = getUserRank(user)
    const opponentRank = getUserRank(opponentUser)

    // Calculate total XP for both users
    const userTotalXP = user.xp + getTotalXPForLevel(user.level)
    const opponentTotalXP = opponentUser.xp + getTotalXPForLevel(opponentUser.level)

    // Create battle initiation embed
    const initiationEmbed = new EmbedBuilder()
      .setTitle("⚔️ Battle Request!")
      .setColor("#FF9900")
      .setDescription(
        `${userRank.emoji} **${user.username}** (${userRank.name} | Level ${user.level} | ${userTotalXP} XP)\nvs\n${opponentRank.emoji} **${opponentUser.username}** (${opponentRank.name} | Level ${opponentUser.level} | ${opponentTotalXP} XP)`,
      )
      .setFooter({ text: "The battle is about to begin..." })
      .setTimestamp()

    await interaction.reply({ embeds: [initiationEmbed] })

    // Add a small delay for dramatic effect
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Calculate battle power for both users (based on level and XP)
    const userPower = user.level * 10 + Math.floor(user.xp / 10)
    const opponentPower = opponentUser.level * 10 + Math.floor(opponentUser.xp / 10)

    // Calculate win chance (higher level/XP gives advantage but doesn't guarantee win)
    const userWinChance = 0.5 + (userPower - opponentPower) * 0.01
    const adjustedWinChance = Math.max(0.3, Math.min(0.7, userWinChance)) // Cap between 30% and 70%

    // Determine winner
    const userWins = Math.random() < adjustedWinChance

    // Calculate rewards
    const baseCoins = Math.floor(Math.random() * 30) + 20 // 20-49 coins
    const baseXP = Math.floor(Math.random() * 15) + 10 // 10-24 XP

    // Apply rewards and penalties
    if (userWins) {
      // User wins
      user.wins += 1
      user.coins += baseCoins
      opponentUser.losses += 1

      // XP gain (winner gets more)
      const leveledUp = await user.addXP(baseXP)
      await opponentUser.addXP(Math.floor(baseXP / 3)) // Loser gets 1/3 XP

      // Update quest progress for winning battles
      user.updateQuestProgress("battle", "win", 1)
      // Update quest progress for participating in battles
      user.updateQuestProgress("battle", "participate", 1)
      opponentUser.updateQuestProgress("battle", "participate", 1)

      // Update last battle time
      user.lastActivity = new Date() // Update for rank decay system
      user.lastBattle = new Date()
      await user.save()

      opponentUser.lastActivity = new Date() // Update for rank decay system
      await opponentUser.save()

      // Create battle result embed
      const embed = new EmbedBuilder()
        .setTitle("⚔️ Battle Results ⚔️")
        .setColor("#00FF00")
        .setDescription(
          `${userRank.emoji} **${user.username}** battled ${opponentRank.emoji} **${opponentUser.username}** and won!`,
        )
        .addFields(
          { name: "Winner", value: `${userRank.emoji} <@${user.userId}>`, inline: true },
          { name: "Loser", value: `${opponentRank.emoji} <@${opponentUser.userId}>`, inline: true },
          { name: "\u200B", value: "\u200B", inline: true },
          { name: "Coins Won", value: `${baseCoins} 🪙`, inline: true },
          { name: "XP Gained", value: `${baseXP} ✨`, inline: true },
          { name: "New Balance", value: `${user.coins} 🪙`, inline: true },
        )
        .setFooter({ text: "PixelMon Battle System" })
        .setTimestamp()

      // Add level up message if user leveled up
      if (leveledUp) {
        embed.addFields({
          name: "🎉 LEVEL UP!",
          value: `Congratulations! ${user.username} is now level **${user.level}**!`,
        })
      }

      await interaction.followUp({ embeds: [embed] })
    } else {
      // Opponent wins
      opponentUser.wins += 1
      opponentUser.coins += baseCoins
      user.losses += 1

      // XP gain (winner gets more)
      const opponentLeveledUp = await opponentUser.addXP(baseXP)
      await user.addXP(Math.floor(baseXP / 3)) // Loser gets 1/3 XP

      // Update quest progress for participating in battles
      user.updateQuestProgress("battle", "participate", 1)
      opponentUser.updateQuestProgress("battle", "participate", 1)
      // Update quest progress for winning battles for opponent
      opponentUser.updateQuestProgress("battle", "win", 1)

      // Update last battle time
      user.lastActivity = new Date() // Update for rank decay system
      user.lastBattle = new Date()
      await user.save()

      opponentUser.lastActivity = new Date() // Update for rank decay system
      await opponentUser.save()

      // Create battle result embed
      const embed = new EmbedBuilder()
        .setTitle("⚔️ Battle Results ⚔️")
        .setColor("#FF0000")
        .setDescription(
          `${userRank.emoji} **${user.username}** battled ${opponentRank.emoji} **${opponentUser.username}** and lost!`,
        )
        .addFields(
          { name: "Winner", value: `${opponentRank.emoji} <@${opponentUser.userId}>`, inline: true },
          { name: "Loser", value: `${userRank.emoji} <@${user.userId}>`, inline: true },
          { name: "\u200B", value: "\u200B", inline: true },
          { name: "Coins Won", value: `${baseCoins} 🪙 (to ${opponentUser.username})`, inline: true },
          { name: "XP Gained", value: `${Math.floor(baseXP / 3)} ✨ (consolation)`, inline: true },
        )
        .setFooter({ text: "PixelMon Battle System" })
        .setTimestamp()

      // Add level up message if opponent leveled up
      if (opponentLeveledUp) {
        embed.addFields({
          name: "🎉 LEVEL UP!",
          value: `${opponentUser.username} is now level **${opponentUser.level}**!`,
        })
      }

      await interaction.followUp({ embeds: [embed] })
    }
  },
}
