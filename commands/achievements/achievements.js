const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { getUserAchievements } = require("../../utils/achievementUtils")

module.exports = {
  data: new SlashCommandBuilder().setName("achievements").setDescription("View your achievements"),
  cooldown: 3,

  async execute(interaction, client, user) {
    // Get user achievements with completion status
    const achievements = getUserAchievements(user)

    // Count completed achievements
    const completedCount = achievements.filter((a) => a.completed).length
    const totalCount = achievements.length
    const completionPercentage = Math.round((completedCount / totalCount) * 100)

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Achievements`)
      .setColor("#FFD700")
      .setDescription(`You have completed **${completedCount}/${totalCount}** achievements (${completionPercentage}%)`)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Complete achievements to earn rewards!" })
      .setTimestamp()

    // Group achievements by category
    const economyAchievements = achievements.filter((a) => a.id.includes("COIN"))
    const levelAchievements = achievements.filter((a) => a.id.includes("LEVEL"))
    const battleAchievements = achievements.filter((a) => a.id.includes("BATTLE") || a.id.includes("WIN"))
    const collectionAchievements = achievements.filter((a) => a.id.includes("COLLECTOR") || a.id.includes("HOARDER"))
    const miningAchievements = achievements.filter((a) => a.id.includes("MINE"))
    const clanAchievements = achievements.filter((a) => a.id.includes("CLAN"))

    // Format achievement lists
    function formatAchievementList(achievementList) {
      return achievementList
        .map((a) => {
          const status = a.completed ? "✅" : "❌"
          return `${status} ${a.emoji} **${a.name}** - ${a.description}`
        })
        .join("\n")
    }

    // Add achievement fields by category
    if (economyAchievements.length > 0) {
      embed.addFields({ name: "💰 Economy Achievements", value: formatAchievementList(economyAchievements) })
    }

    if (levelAchievements.length > 0) {
      embed.addFields({ name: "📊 Level Achievements", value: formatAchievementList(levelAchievements) })
    }

    if (battleAchievements.length > 0) {
      embed.addFields({ name: "⚔️ Battle Achievements", value: formatAchievementList(battleAchievements) })
    }

    if (collectionAchievements.length > 0) {
      embed.addFields({ name: "🎒 Collection Achievements", value: formatAchievementList(collectionAchievements) })
    }

    if (miningAchievements.length > 0) {
      embed.addFields({ name: "⛏️ Mining Achievements", value: formatAchievementList(miningAchievements) })
    }

    if (clanAchievements.length > 0) {
      embed.addFields({ name: "🏰 Clan Achievements", value: formatAchievementList(clanAchievements) })
    }

    await interaction.reply({ embeds: [embed] })
  },
}
