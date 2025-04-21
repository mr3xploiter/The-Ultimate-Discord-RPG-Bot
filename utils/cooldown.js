const { Collection } = require("discord.js")

/**
 * Check if a command is on cooldown for a user
 * @param {Object} client - Discord client
 * @param {Object} interaction - Discord interaction
 * @param {Object} command - Command object
 * @returns {boolean|number} - False if not on cooldown, or time left in seconds
 */
function checkCooldown(client, interaction, command) {
  if (!client.cooldowns.has(command.data.name)) {
    client.cooldowns.set(command.data.name, new Collection())
  }

  const now = Date.now()
  const timestamps = client.cooldowns.get(command.data.name)
  const cooldownAmount = (command.cooldown || 3) * 1000

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000
      return timeLeft
    }
  }

  timestamps.set(interaction.user.id, now)
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount)
  return false
}

module.exports = { checkCooldown }
