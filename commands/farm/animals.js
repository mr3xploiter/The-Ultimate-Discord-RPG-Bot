const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { calculateAnimalBattlePower, animalTraits } = require("../../utils/animalUtils")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("animals")
    .setDescription("View and manage your animals")
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List all your animals"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("View detailed information about an animal")
        .addStringOption((option) => option.setName("name").setDescription("The name of the animal").setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("select")
        .setDescription("Select an animal as your active animal")
        .addStringOption((option) => option.setName("name").setDescription("The name of the animal").setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rename")
        .setDescription("Rename one of your animals")
        .addStringOption((option) =>
          option.setName("current").setDescription("The current name of the animal").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("new").setDescription("The new name for the animal").setRequired(true),
        ),
    ),
  cooldown: 3,

  async execute(interaction, client, user) {
    const subcommand = interaction.options.getSubcommand()

    // Check if user has any animals
    if (user.farm.animals.length === 0) {
      return interaction.reply({
        content:
          "You don't have any animals yet! Use `/hunt` or `/mine` to find animals, or visit the shop to buy one.",
        ephemeral: true,
      })
    }

    if (subcommand === "list") {
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Animals`)
        .setColor("#8B4513")
        .setDescription(`You have ${user.farm.animals.length}/${user.getMaxAnimals()} animals.`)
        .setFooter({ text: "Use /animals info [name] to view details about an animal" })
        .setTimestamp()

      // Group animals by type
      const animalsByType = {}
      user.farm.animals.forEach((animal) => {
        if (!animalsByType[animal.type]) {
          animalsByType[animal.type] = []
        }
        animalsByType[animal.type].push(animal)
      })

      // Add each type as a field
      for (const [type, animals] of Object.entries(animalsByType)) {
        let animalsList = ""
        animals.forEach((animal) => {
          const selected = animal.isSelected ? "✅ " : ""
          animalsList += `${selected}${animal.emoji} **${animal.name}** (Lvl ${animal.level}) - ${animal.health}/${animal.maxHealth} HP\n`
        })

        embed.addFields({ name: `${type} (${animals.length})`, value: animalsList })
      }

      return interaction.reply({ embeds: [embed] })
    } else if (subcommand === "info") {
      const animalName = interaction.options.getString("name")

      // Find animal
      const animal = user.farm.animals.find((a) => a.name.toLowerCase() === animalName.toLowerCase())
      if (!animal) {
        return interaction.reply({
          content: `You don't have an animal named "${animalName}"!`,
          ephemeral: true,
        })
      }

      // Get trait description
      const traitInfo = animalTraits.find((t) => t.name === animal.trait)
      const traitDescription = traitInfo ? traitInfo.description : "No special abilities"

      // Calculate battle power
      const battlePower = calculateAnimalBattlePower(animal)

      // Calculate XP progress
      const currentXP = animal.xp
      const requiredXP = user.getAnimalNextLevelXP(animal)
      const progressPercentage = Math.round((currentXP / requiredXP) * 100)

      // Create progress bar
      const progressBarLength = 10
      const filledBlocks = Math.round((progressPercentage / 100) * progressBarLength)
      const progressBar = "█".repeat(filledBlocks) + "░".repeat(progressBarLength - filledBlocks)

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${animal.emoji} ${animal.name} (${animal.type})`)
        .setColor("#8B4513")
        .setDescription(`Level ${animal.level} ${animal.type} with ${animal.trait} trait`)
        .addFields(
          { name: "Health", value: `${animal.health}/${animal.maxHealth} ❤️`, inline: true },
          { name: "Strength", value: `${animal.strength} 💪`, inline: true },
          { name: "Battle Power", value: `${battlePower} ⚔️`, inline: true },
          { name: "Trait", value: `${animal.trait} - ${traitDescription}`, inline: false },
          { name: "Battle Record", value: `${animal.wins}W / ${animal.losses}L`, inline: true },
          { name: "Status", value: animal.isSelected ? "Selected ✅" : "Not Selected", inline: true },
          {
            name: `Level Progress (${progressPercentage}%)`,
            value: `${currentXP}/${requiredXP} XP\n${progressBar}`,
          },
        )
        .setFooter({
          text: animal.isSelected ? "This is your selected animal" : "Use /animals select to select this animal",
        })
        .setTimestamp()

      // Add task info if on a task
      if (animal.taskType && animal.taskEndTime) {
        const now = new Date()
        if (animal.taskEndTime > now) {
          const timeLeft = Math.floor((animal.taskEndTime - now) / 1000) // seconds
          const minutes = Math.floor(timeLeft / 60)
          const seconds = timeLeft % 60

          embed.addFields({
            name: "Current Task",
            value: `${animal.taskType} (${minutes}m ${seconds}s remaining)`,
          })
        } else {
          embed.addFields({
            name: "Task Completed",
            value: `${animal.taskType} task is complete! Use /collect to collect rewards.`,
          })
        }
      }

      return interaction.reply({ embeds: [embed] })
    } else if (subcommand === "select") {
      const animalName = interaction.options.getString("name")

      // Select animal
      const success = user.selectAnimal(animalName)

      if (!success) {
        return interaction.reply({
          content: `You don't have an animal named "${animalName}"!`,
          ephemeral: true,
        })
      }

      // Save user
      await user.save()

      // Find the selected animal
      const animal = user.getSelectedAnimal()

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`Selected Animal: ${animal.emoji} ${animal.name}`)
        .setColor("#32CD32")
        .setDescription(`You've selected ${animal.name} as your active animal!`)
        .addFields(
          { name: "Type", value: animal.type, inline: true },
          { name: "Level", value: `${animal.level}`, inline: true },
          { name: "Health", value: `${animal.health}/${animal.maxHealth} ❤️`, inline: true },
          { name: "Strength", value: `${animal.strength} 💪`, inline: true },
          { name: "Trait", value: animal.trait, inline: true },
          { name: "Battle Power", value: `${calculateAnimalBattlePower(animal)} ⚔️`, inline: true },
        )
        .setFooter({ text: "This animal will now be used for battles and tasks" })
        .setTimestamp()

      return interaction.reply({ embeds: [embed] })
    } else if (subcommand === "rename") {
      const currentName = interaction.options.getString("current")
      const newName = interaction.options.getString("new")

      // Validate new name
      if (newName.length < 3 || newName.length > 20) {
        return interaction.reply({
          content: "Animal names must be between 3 and 20 characters!",
          ephemeral: true,
        })
      }

      // Check if name is already taken
      if (user.farm.animals.some((a) => a.name.toLowerCase() === newName.toLowerCase())) {
        return interaction.reply({
          content: `You already have an animal named "${newName}"!`,
          ephemeral: true,
        })
      }

      // Find animal
      const animalIndex = user.farm.animals.findIndex((a) => a.name.toLowerCase() === currentName.toLowerCase())
      if (animalIndex === -1) {
        return interaction.reply({
          content: `You don't have an animal named "${currentName}"!`,
          ephemeral: true,
        })
      }

      // Rename animal
      const animal = user.farm.animals[animalIndex]
      const oldName = animal.name
      animal.name = newName

      // Save user
      await user.save()

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle("Animal Renamed")
        .setColor("#32CD32")
        .setDescription(`You've renamed your ${animal.type} from "${oldName}" to "${newName}"!`)
        .setFooter({ text: "Use /animals info to view your animal's details" })
        .setTimestamp()

      return interaction.reply({ embeds: [embed] })
    }
  },
}
