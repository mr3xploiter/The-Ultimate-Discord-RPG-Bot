const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { getProgressBar, getXPForLevel } = require("../../utils/levelUtils")

module.exports = {
  data: new SlashCommandBuilder().setName("balance").setDescription("Check your balance and level"),
  cooldown: 3,

  async execute(interaction, client, user) {
    // Calculate XP progress
    const currentXP = user.xp
    const requiredXP = user.getNextLevelXP()
    const progressBar = getProgressBar(currentXP, requiredXP, 10)
    const progressPercentage = Math.round((currentXP / requiredXP) * 100)

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Profile`)
      .setColor("#4169E1")
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Balance", value: `${user.coins} 🪙`, inline: true },
        { name: "Level", value: `${user.level} 📊`, inline: true },
        { name: "Battle Record", value: `${user.wins}W / ${user.losses}L`, inline: true },
        {
          name: `Level Progress (${progressPercentage}%)`,
          value: `${currentXP}/${requiredXP} XP\n${progressBar}`,
        },
      )
      .setFooter({ text: "PixelMon Game Bot" })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  },
}
