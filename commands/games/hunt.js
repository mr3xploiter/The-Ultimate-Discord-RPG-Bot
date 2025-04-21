const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { generateRandomAnimal } = require("../../utils/animalUtils")
// Array of possible items to find
const huntItems = [
  { name: "Potion", chance: 0.3 },
  { name: "Super Potion", chance: 0.15 },
  { name: "Rare Candy", chance: 0.1 },
  { name: "Pokéball", chance: 0.25 },
  { name: "Great Ball", chance: 0.1 },
  { name: "Ultra Ball", chance: 0.05 },
  { name: "Revive", chance: 0.05 },
]

// Array of hunt scenarios
const huntScenarios = [
  { text: "You ventured into the tall grass and found", reward: true },
  { text: "You explored a cave and discovered", reward: true },
  { text: "You searched through an abandoned building and found", reward: true },
  { text: "You looked around the forest and found", reward: true },
  { text: "You got lost in the mountains but stumbled upon", reward: true },
  { text: "You searched everywhere but found nothing of value.", reward: false },
  { text: "A wild Pokémon scared you away before you could find anything.", reward: false },
  { text: "It started raining heavily, forcing you to return empty-handed.", reward: false },
]

module.exports = {
  data: new SlashCommandBuilder().setName("hunt").setDescription("Hunt for items and animals (30 minute cooldown)"),
  cooldown: 5,

  async execute(interaction, client, user) {
    // Check if cooldown has passed (30 minutes)
    if (!user.cooldownPassed("lastHunt", 0.5)) {
      // 0.5 hours = 30 minutes
      const nextHunt = new Date(user.lastHunt.getTime() + 30 * 60 * 1000)
      const timeLeft = nextHunt - Date.now()

      const minutes = Math.floor(timeLeft / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      return interaction.reply({
        content: `You're still tired from your last hunt! You can hunt again in **${minutes}m ${seconds}s**.`,
        ephemeral: true,
      })
    }

    // Select random scenario
    const scenario = huntScenarios[Math.floor(Math.random() * huntScenarios.length)]

    // Create embed
    const embed = new EmbedBuilder().setTitle("Hunt Results").setColor("#8B4513").setTimestamp()

    // If scenario has a reward, give an item
    if (scenario.reward) {
      // Determine which item the user finds (based on chance)
      const rand = Math.random()
      let cumulativeChance = 0
      let foundItem = null

      for (const item of huntItems) {
        cumulativeChance += item.chance
        if (rand <= cumulativeChance) {
          foundItem = item.name
          break
        }
      }

      // If no item was selected (shouldn't happen but just in case), pick the first one
      if (!foundItem) {
        foundItem = huntItems[0].name
      }

      // Add item to inventory
      user.inventory.push(foundItem)

      // Add XP
      const xpEarned = Math.floor(Math.random() * 10) + 5 // 5-14 XP
      const leveledUp = await user.addXP(xpEarned)

      // Set description and fields
      embed
        .setDescription(`${scenario.text} **${foundItem}**!`)
        .addFields(
          { name: "Item Found", value: foundItem, inline: true },
          { name: "XP Earned", value: `${xpEarned} ✨`, inline: true },
        )

      // Add level up message if user leveled up
      if (leveledUp) {
        embed.addFields({
          name: "🎉 LEVEL UP!",
          value: `Congratulations! You are now level **${user.level}**!`,
        })
      }

      // Chance to find an animal (20% chance)
      if (Math.random() < 0.2) {
        // Generate random animal
        const animal = generateRandomAnimal("hunt", user.farm.level)

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
      // No reward scenario
      embed
        .setDescription(scenario.text)
        .addFields({ name: "Result", value: "You found nothing this time.", inline: true })

      // Still give a small amount of XP for trying
      const xpEarned = Math.floor(Math.random() * 3) + 1 // 1-3 XP
      await user.addXP(xpEarned)

      embed.addFields({ name: "XP Earned", value: `${xpEarned} ✨`, inline: true })
    }

    // Update last hunt time
    user.lastHunt = new Date()
    await user.save()

    embed.setFooter({ text: "You can hunt again in 30 minutes" })

    await interaction.reply({ embeds: [embed] })
  },
}
