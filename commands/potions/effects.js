const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { cleanupExpiredEffects } = require("../../utils/potionUtils")

// Effect descriptions
const effectDescriptions = {
  xpBoost: "Increases XP gain",
  coinBoost: "Increases coin gain",
  battleShield: "Prevents coin loss in battles",
  luckyCharm: "Increases chance of rare finds when mining",
}

// Effect emojis
const effectEmojis = {
  xpBoost: "✨",
  coinBoost: "🪙",
  battleShield: "🛡️",
  luckyCharm: "🍀",
}

module.exports = {
  data: new SlashCommandBuilder().setName("effects").setDescription("View your active potion effects"),
  cooldown: 3,

  async execute(interaction, client, user) {
    // Clean up expired effects
    const removedCount = cleanupExpiredEffects(user)
    await user.save()

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Active Effects`)
      .setColor("#9B59B6")
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Use /drink to consume potions" })
      .setTimestamp()

    // Check if user has any active effects
    if (user.activeEffects.length === 0) {
      embed.setDescription("You don't have any active effects. Use `/drink` to consume potions!")
      return interaction.reply({ embeds: [embed] })
    }

    // Add each active effect to the embed
    let effectsText = ""

    for (const effect of user.activeEffects) {
      const emoji = effectEmojis[effect.type] || "🧪"
      const description = effectDescriptions[effect.type] || "Unknown effect"
      const multiplierText = effect.multiplier !== 1.0 ? ` (${effect.multiplier.toFixed(2)}x)` : ""
      const timeLeft = `<t:${Math.floor(effect.expiresAt.getTime() / 1000)}:R>`

      effectsText += `${emoji} **${description}${multiplierText}**\n└ Expires: ${timeLeft}\n\n`
    }

    embed.setDescription(effectsText)

    // Add notification if effects were removed
    if (removedCount > 0) {
      embed.addFields({
        name: "Notice",
        value: `${removedCount} expired effect${removedCount !== 1 ? "s were" : " was"} removed.`,
      })
    }

    await interaction.reply({ embeds: [embed] })
  },
}
