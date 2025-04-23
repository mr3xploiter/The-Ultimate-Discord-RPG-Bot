const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { checkAchievements } = require("../../utils/achievementUtils")
const { generateRandomAnimal } = require("../../utils/animalUtils")

// Mining resources with their chances and amounts
const resources = [
  { name: "stone", emoji: "🪨", chance: 0.8, minAmount: 3, maxAmount: 8 },
  { name: "iron", emoji: "⚙️", chance: 0.4, minAmount: 1, maxAmount: 4 },
  { name: "gold", emoji: "🥇", chance: 0.2, minAmount: 1, maxAmount: 3 },
  { name: "diamond", emoji: "💎", chance: 0.05, minAmount: 1, maxAmount: 2 },
  { name: "emerald", emoji: "💚", chance: 0.03, minAmount: 1, maxAmount: 1 },
  { name: "obsidian", emoji: "🟣", chance: 0.02, minAmount: 1, maxAmount: 1 },
  { name: "crystal", emoji: "✨", chance: 0.01, minAmount: 1, maxAmount: 1 },
]

// Jackpot finds (rare)
const jackpots = [
  { name: "Diamond Vein", description: "You found a rich vein of diamonds!", rewards: { diamond: { min: 3, max: 5 } } },
  { name: "Gold Rush", description: "You struck gold!", rewards: { gold: { min: 5, max: 10 } } },
  {
    name: "Crystal Cave",
    description: "You discovered a hidden crystal cave!",
    rewards: { crystal: { min: 2, max: 3 } },
  },
  {
    name: "Ancient Treasure",
    description: "You uncovered an ancient treasure!",
    rewards: { gold: { min: 8, max: 12 }, diamond: { min: 1, max: 3 } },
  },
]

module.exports = {
  data: new SlashCommandBuilder().setName("mine").setDescription("Mine for resources and animals (10 minute cooldown)"),
  cooldown: 5,

  async execute(interaction, client, user) {
    // Check if cooldown has passed (10 minutes)
    if (!user.cooldownPassed("lastMine", 10 / 60)) {
      // 10/60 hours = 10 minutes
      const nextMine = new Date(user.lastMine.getTime() + 10 * 60 * 1000)
      const timeLeft = nextMine - Date.now()

      const minutes = Math.floor(timeLeft / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      return interaction.reply({
        content: `You're still tired from your last mining session! You can mine again in **${minutes}m ${seconds}s**.`,
        ephemeral: true,
      })
    }

    // Update last mine time
    user.lastMine = new Date()

    // Check for lucky charm effect
    const luckyCharm = user.activeEffects.find(
      (effect) => effect.type === "luckyCharm" && effect.expiresAt > new Date(),
    )
    const luckMultiplier = luckyCharm ? luckyCharm.multiplier : 1.0

    // Determine if jackpot (1% chance, increased with lucky charm)
    const jackpotChance = 0.01 * luckMultiplier
    const isJackpot = Math.random() < jackpotChance

    // Create embed
    const embed = new EmbedBuilder().setTitle("⛏️ Mining Results").setColor("#8B4513").setTimestamp()

    if (isJackpot) {
      // Handle jackpot find
      const jackpot = jackpots[Math.floor(Math.random() * jackpots.length)]

      embed.setDescription(`**JACKPOT!** ${jackpot.description}`)

      // Add jackpot rewards
      let rewardsText = ""

      for (const [resourceName, amounts] of Object.entries(jackpot.rewards)) {
        const amount = Math.floor(Math.random() * (amounts.max - amounts.min + 1)) + amounts.min
        const resource = resources.find((r) => r.name === resourceName)

        if (resource) {
          user.resources[resourceName] += amount
          rewardsText += `${resource.emoji} ${amount} ${resourceName}\n`
        }
      }

      embed.addFields({ name: "Resources Found", value: rewardsText })

      // Add XP reward for jackpot
      const xpEarned = Math.floor(Math.random() * 30) + 20 // 20-49 XP
      const leveledUp = await user.addXP(xpEarned)

      embed.addFields({ name: "XP Earned", value: `${xpEarned} ✨`, inline: true })

      // Add level up message if user leveled up
      if (leveledUp) {
        embed.addFields({
          name: "🎉 LEVEL UP!",
          value: `Congratulations! You are now level **${user.level}**!`,
        })
      }

      // Higher chance to find an animal during jackpot (50% chance)
      if (Math.random() < 0.5) {
        // Generate random animal
        const animal = generateRandomAnimal("mine", user.farm.level)

        if (animal) {
          // Add animal to inventory (not directly to farm)
          user.inventory.push(animal.type)

          embed.addFields({
            name: "🐾 Animal Found!",
            value: `You found a ${animal.emoji} **${animal.type}**! Use \`/addanimal\` to add it to your farm.`,
          })
        }
      }
    } else {
      // Regular mining
      embed.setDescription("You swing your pickaxe and mine some resources!")

      // Determine which resources the user finds
      let resourcesFound = false
      let resourcesText = ""

      for (const resource of resources) {
        // Apply luck multiplier to chance
        const adjustedChance = Math.min(resource.chance * luckMultiplier, 1.0)

        if (Math.random() < adjustedChance) {
          const amount = Math.floor(Math.random() * (resource.maxAmount - resource.minAmount + 1)) + resource.minAmount
          user.resources[resource.name] += amount
          resourcesFound = true
          resourcesText += `${resource.emoji} ${amount} ${resource.name}\n`
        }
      }

      if (resourcesFound) {
        embed.addFields({ name: "Resources Found", value: resourcesText })
      } else {
        embed.addFields({ name: "Resources Found", value: "You didn't find any resources this time." })
      }

      // Add XP reward
      const xpEarned = Math.floor(Math.random() * 10) + 5 // 5-14 XP
      const leveledUp = await user.addXP(xpEarned)

      embed.addFields({ name: "XP Earned", value: `${xpEarned} ✨`, inline: true })

      // Add level up message if user leveled up
      if (leveledUp) {
        embed.addFields({
          name: "🎉 LEVEL UP!",
          value: `Congratulations! You are now level **${user.level}**!`,
        })
      }

      // Chance to find an animal (15% chance)
      if (Math.random() < 0.15) {
        // Generate random animal
        const animal = generateRandomAnimal("mine", user.farm.level)

        if (animal) {
          // Add animal to inventory (not directly to farm)
          user.inventory.push(animal.type)

          embed.addFields({
            name: "🐾 Animal Found!",
            value: `You found a ${animal.emoji} **${animal.type}**! Use \`/addanimal\` to add it to your farm.`,
          })
        }
      }
    }

    // Update quest progress
    user.updateQuestProgress("mine", "any", 1)

    // For each resource type found, update specific resource quests
    for (const [resourceName, amount] of Object.entries(user.resources)) {
      if (amount > 0) {
        user.updateQuestProgress("mine", resourceName, amount)
      }
    }

    // Check for achievements
    const newAchievements = await checkAchievements(user)

    if (newAchievements.length > 0) {
      const achievementsList = newAchievements.map((a) => `${a.emoji} **${a.name}** - ${a.description}`).join("\n")
      embed.addFields({ name: "🏆 Achievements Unlocked!", value: achievementsList })
    }

    await user.save()

    embed.setFooter({ text: "You can mine again in 10 minutes" })

    await interaction.reply({ embeds: [embed] })
  },
}
