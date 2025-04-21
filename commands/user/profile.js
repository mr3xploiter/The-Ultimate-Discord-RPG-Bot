const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { getProgressBar, getXPForLevel } = require("../../utils/levelUtils")
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

    // Calculate XP progress
    const currentXP = profileUser.xp
    const requiredXP = profileUser.getNextLevelXP()
    const progressBar = getProgressBar(currentXP, requiredXP, 15)
    const progressPercentage = Math.round((currentXP / requiredXP) * 100)

    // Get background color from theme
    const bgColor = backgroundThemes[profileUser.profile.background] || backgroundThemes.default

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${profileUser.username}'s Profile`)
      .setColor(bgColor)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${profileUser.profile.title}**\n\n${profileUser.profile.bio}`)
      .addFields(
        { name: "💰 Balance", value: `${profileUser.coins} coins`, inline: true },
        { name: "📊 Level", value: `${profileUser.level}`, inline: true },
        { name: "🏆 Battle Record", value: `${profileUser.wins}W / ${profileUser.losses}L`, inline: true },
        { name: "✨ Favorite Item", value: profileUser.profile.favoriteItem, inline: true },
        { name: "🎒 Inventory Size", value: `${profileUser.inventory.length} items`, inline: true },
        {
          name: `📈 Level Progress (${progressPercentage}%)`,
          value: `${currentXP}/${requiredXP} XP\n${progressBar}`,
        },
      )
      .setFooter({ text: "PixelMon Game Bot" })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  },
}
