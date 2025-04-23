const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { animalTypes, animalTraits } = require("../../utils/animalUtils")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addanimal")
    .setDescription("Add an animal to your farm")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The type of animal to add")
        .setRequired(true)
        .addChoices(
          { name: "🐇 Rabbit", value: "Rabbit" },
          { name: "🦊 Fox", value: "Fox" },
          { name: "🦌 Deer", value: "Deer" },
          { name: "🐺 Wolf", value: "Wolf" },
          { name: "🐻 Bear", value: "Bear" },
          { name: "🐀 Mole", value: "Mole" },
          { name: "🦔 Hedgehog", value: "Hedgehog" },
          { name: "🦇 Bat", value: "Bat" },
          { name: "🦉 Owl", value: "Owl" },
          { name: "🦅 Eagle", value: "Eagle" },
        ),
    )
    .addStringOption((option) =>
      option.setName("name").setDescription("The name for your new animal").setRequired(true),
    ),
  cooldown: 5,

  async execute(interaction, client, user) {
    const animalType = interaction.options.getString("type")
    const animalName = interaction.options.getString("name")

    // Validate name
    if (animalName.length < 3 || animalName.length > 20) {
      return interaction.reply({
        content: "Animal names must be between 3 and 20 characters!",
        ephemeral: true,
      })
    }

    // Check if name is already taken
    if (user.farm.animals.some((a) => a.name.toLowerCase() === animalName.toLowerCase())) {
      return interaction.reply({
        content: `You already have an animal named "${animalName}"!`,
        ephemeral: true,
      })
    }

    // Check if farm has capacity
    if (user.farm.animals.length >= user.getMaxAnimals()) {
      return interaction.reply({
        content: `Your farm is at maximum capacity (${user.getMaxAnimals()} animals)! Upgrade your farm to increase capacity.`,
        ephemeral: true,
      })
    }

    // Find animal type info
    const animalInfo = Object.values(animalTypes).find((a) => a.type === animalType)
    if (!animalInfo) {
      return interaction.reply({
        content: "Invalid animal type!",
        ephemeral: true,
      })
    }

    // Check if user has the animal in inventory
    const inventoryIndex = user.inventory.findIndex((item) => item === animalType)
    if (inventoryIndex === -1) {
      return interaction.reply({
        content: `You don't have a ${animalType} in your inventory! Find animals by hunting or mining.`,
        ephemeral: true,
      })
    }

    // Remove from inventory
    user.inventory.splice(inventoryIndex, 1)

    // Generate random trait
    const trait = animalTraits[Math.floor(Math.random() * animalTraits.length)].name

    // Generate random stat variations (±10%)
    const healthVariation = 0.9 + Math.random() * 0.2 // 0.9 to 1.1
    const strengthVariation = 0.9 + Math.random() * 0.2 // 0.9 to 1.1

    const health = Math.floor(animalInfo.baseHealth * healthVariation)
    const strength = Math.floor(animalInfo.baseStrength * strengthVariation)

    // Create animal
    const animal = {
      name: animalName,
      type: animalType,
      emoji: animalInfo.emoji,
      level: 1,
      xp: 0,
      health,
      maxHealth: health,
      strength,
      trait,
      wins: 0,
      losses: 0,
      isSelected: false,
    }

    // Add animal to farm
    user.farm.animals.push(animal)

    // If this is the first animal, select it automatically
    if (user.farm.animals.length === 1) {
      animal.isSelected = true
    }

    // Save user
    await user.save()

    // Get trait description
    const traitInfo = animalTraits.find((t) => t.name === trait)
    const traitDescription = traitInfo ? traitInfo.description : "No special abilities"

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`New Animal Added: ${animal.emoji} ${animalName}`)
      .setColor("#32CD32")
      .setDescription(`You've added a ${animalType} to your farm!`)
      .addFields(
        { name: "Name", value: animalName, inline: true },
        { name: "Type", value: animalType, inline: true },
        { name: "Level", value: "1", inline: true },
        { name: "Health", value: `${health}/${health} ❤️`, inline: true },
        { name: "Strength", value: `${strength} 💪`, inline: true },
        { name: "Trait", value: `${trait} - ${traitDescription}`, inline: false },
      )
      .setFooter({
        text:
          user.farm.animals.length === 1
            ? "This animal has been automatically selected as your active animal"
            : "Use /animals select to select this animal",
      })
      .setTimestamp()

    return interaction.reply({ embeds: [embed] })
  },
}
