const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { breedAnimals } = require("../../utils/animalUtils")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("breed")
    .setDescription("Breed two of your animals to create a new one")
    .addStringOption((option) =>
      option.setName("parent1").setDescription("The name of the first parent animal").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("parent2").setDescription("The name of the second parent animal").setRequired(true),
    )
    .addStringOption((option) => option.setName("name").setDescription("The name for the offspring").setRequired(true)),
  cooldown: 60, // 1 hour cooldown

  async execute(interaction, client, user) {
    const parent1Name = interaction.options.getString("parent1")
    const parent2Name = interaction.options.getString("parent2")
    const offspringName = interaction.options.getString("name")

    // Validate name
    if (offspringName.length < 3 || offspringName.length > 20) {
      return interaction.reply({
        content: "Animal names must be between 3 and 20 characters!",
        ephemeral: true,
      })
    }

    // Check if name is already taken
    if (user.farm.animals.some((a) => a.name.toLowerCase() === offspringName.toLowerCase())) {
      return interaction.reply({
        content: `You already have an animal named "${offspringName}"!`,
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

    // Check if cooldown has passed
    if (!user.cooldownPassed("lastBreed", 1)) {
      const nextBreed = new Date(user.lastBreed.getTime() + 60 * 60 * 1000)
      const timeLeft = nextBreed - Date.now()

      const hours = Math.floor(timeLeft / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

      return interaction.reply({
        content: `You need to wait before breeding again! Try again in **${hours}h ${minutes}m**.`,
        ephemeral: true,
      })
    }

    // Find parent animals
    const parent1 = user.farm.animals.find((a) => a.name.toLowerCase() === parent1Name.toLowerCase())
    if (!parent1) {
      return interaction.reply({
        content: `You don't have an animal named "${parent1Name}"!`,
        ephemeral: true,
      })
    }

    const parent2 = user.farm.animals.find((a) => a.name.toLowerCase() === parent2Name.toLowerCase())
    if (!parent2) {
      return interaction.reply({
        content: `You don't have an animal named "${parent2Name}"!`,
        ephemeral: true,
      })
    }

    // Check if parents are the same animal
    if (parent1 === parent2) {
      return interaction.reply({
        content: "You can't breed an animal with itself!",
        ephemeral: true,
      })
    }

    // Check if parents are at least level 3
    if (parent1.level < 3 || parent2.level < 3) {
      return interaction.reply({
        content: "Both parent animals must be at least level 3 to breed!",
        ephemeral: true,
      })
    }

    // Check if parents have enough health
    if (parent1.health < parent1.maxHealth * 0.5 || parent2.health < parent2.maxHealth * 0.5) {
      return interaction.reply({
        content: "Both parent animals must have at least 50% health to breed!",
        ephemeral: true,
      })
    }

    // Breed animals
    const offspring = breedAnimals(parent1, parent2)
    offspring.name = offspringName

    // Add offspring to farm
    user.farm.animals.push(offspring)

    // Update parent health (breeding takes energy)
    parent1.health = Math.max(1, parent1.health - Math.floor(parent1.maxHealth * 0.2))
    parent2.health = Math.max(1, parent2.health - Math.floor(parent2.maxHealth * 0.2))

    // Update last breed time
    user.lastBreed = new Date()

    // Save user
    await user.save()

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`New Animal Born: ${offspring.emoji} ${offspringName}`)
      .setColor("#FF69B4")
      .setDescription(
        `${parent1.emoji} ${parent1.name} and ${parent2.emoji} ${parent2.name} have bred and produced a baby ${offspring.type}!`,
      )
      .addFields(
        { name: "Name", value: offspringName, inline: true },
        { name: "Type", value: offspring.type, inline: true },
        { name: "Level", value: "1", inline: true },
        { name: "Health", value: `${offspring.health}/${offspring.maxHealth} ❤️`, inline: true },
        { name: "Strength", value: `${offspring.strength} 💪`, inline: true },
        { name: "Trait", value: offspring.trait, inline: true },
        {
          name: "Parents",
          value: `${parent1.emoji} ${parent1.name} (${parent1.type}) - Level ${parent1.level}\n${parent2.emoji} ${parent2.name} (${parent2.type}) - Level ${parent2.level}`,
        },
      )
      .setFooter({ text: "Use /animals select to select this animal" })
      .setTimestamp()

    return interaction.reply({ embeds: [embed] })
  },
}
