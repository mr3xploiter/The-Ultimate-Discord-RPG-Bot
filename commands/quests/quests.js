const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { resetQuestsIfNeeded, getQuestDescription } = require("../../utils/questUtils")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quests")
    .setDescription("View and manage your quests")
    .addSubcommand((subcommand) => subcommand.setName("view").setDescription("View your active quests"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("claim")
        .setDescription("Claim rewards for completed quests")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Type of quests to claim")
            .setRequired(true)
            .addChoices(
              { name: "Daily", value: "daily" },
              { name: "Weekly", value: "weekly" },
              { name: "All", value: "all" },
            ),
        ),
    ),
  cooldown: 3,

  async execute(interaction, client, user) {
    // Reset quests if needed
    const { resetDaily, resetWeekly } = await resetQuestsIfNeeded(user)

    const subcommand = interaction.options.getSubcommand()

    if (subcommand === "view") {
      // Create embed for viewing quests
      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Quests`)
        .setColor("#4169E1")
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Complete quests to earn rewards!" })
        .setTimestamp()

      // Add daily quests
      let dailyQuestsText = ""
      if (user.quests.daily.length === 0) {
        dailyQuestsText = "No daily quests available. Use `/quests view` to refresh."
      } else {
        for (const quest of user.quests.daily) {
          const status = quest.completed ? (quest.claimed ? "✅" : "🔶") : "⬜"
          const progress = `${quest.progress}/${quest.amount}`
          const rewards = `🪙 ${quest.reward.coins} | ✨ ${quest.reward.xp}`

          dailyQuestsText += `${status} **${getQuestDescription(quest)}** (${progress})\n└ Rewards: ${rewards}\n\n`
        }
      }

      // Add weekly quests
      let weeklyQuestsText = ""
      if (user.quests.weekly.length === 0) {
        weeklyQuestsText = "No weekly quests available. Use `/quests view` to refresh."
      } else {
        for (const quest of user.quests.weekly) {
          const status = quest.completed ? (quest.claimed ? "✅" : "🔶") : "⬜"
          const progress = `${quest.progress}/${quest.amount}`
          const rewards = `🪙 ${quest.reward.coins} | ✨ ${quest.reward.xp}`

          weeklyQuestsText += `${status} **${getQuestDescription(quest)}** (${progress})\n└ Rewards: ${rewards}\n\n`
        }
      }

      embed.addFields(
        { name: "📅 Daily Quests", value: dailyQuestsText },
        { name: "📆 Weekly Quests", value: weeklyQuestsText },
      )

      // Add legend
      embed.addFields({
        name: "Legend",
        value: "⬜ In Progress | 🔶 Completed (Unclaimed) | ✅ Claimed",
      })

      // Add reset notification if quests were reset
      if (resetDaily || resetWeekly) {
        let resetText = ""
        if (resetDaily) resetText += "Daily quests have been reset!\n"
        if (resetWeekly) resetText += "Weekly quests have been reset!"

        embed.setDescription(resetText)
      }

      return interaction.reply({ embeds: [embed] })
    } else if (subcommand === "claim") {
      const claimType = interaction.options.getString("type")

      // Track rewards
      let totalCoins = 0
      let totalXP = 0
      let claimedCount = 0

      // Function to claim quests
      const claimQuests = (questType) => {
        for (const quest of user.quests[questType]) {
          if (quest.completed && !quest.claimed) {
            totalCoins += quest.reward.coins
            totalXP += quest.reward.xp
            quest.claimed = true
            claimedCount++
          }
        }
      }

      // Claim based on type
      if (claimType === "daily" || claimType === "all") {
        claimQuests("daily")
      }

      if (claimType === "weekly" || claimType === "all") {
        claimQuests("weekly")
      }

      // If no quests to claim
      if (claimedCount === 0) {
        return interaction.reply({
          content: "You don't have any completed quests to claim!",
          ephemeral: true,
        })
      }

      // Add rewards to user
      user.coins += totalCoins
      const leveledUp = await user.addXP(totalXP)

      // Save user
      await user.save()

      // Create embed for claiming rewards
      const embed = new EmbedBuilder()
        .setTitle("Quest Rewards Claimed!")
        .setColor("#32CD32")
        .setDescription(`You've claimed rewards for ${claimedCount} completed quests!`)
        .addFields(
          { name: "Coins Earned", value: `${totalCoins} 🪙`, inline: true },
          { name: "XP Earned", value: `${totalXP} ✨`, inline: true },
          { name: "New Balance", value: `${user.coins} 🪙`, inline: true },
        )
        .setFooter({ text: "Complete more quests for additional rewards!" })
        .setTimestamp()

      // Add level up message if user leveled up
      if (leveledUp) {
        embed.addFields({
          name: "🎉 LEVEL UP!",
          value: `Congratulations! You are now level **${user.level}**!`,
        })
      }

      return interaction.reply({ embeds: [embed] })
    }
  },
}
