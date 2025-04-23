const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { calculateFarmUpgradeCost, farmStructures, calculateStructureUpgradeCost } = require("../../utils/animalUtils")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("farm")
    .setDescription("View and manage your farm")
    .addSubcommand((subcommand) => subcommand.setName("view").setDescription("View your farm"))
    .addSubcommand((subcommand) => subcommand.setName("upgrade").setDescription("Upgrade your farm to the next level"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("build")
        .setDescription("Build or upgrade a structure on your farm")
        .addStringOption((option) =>
          option
            .setName("structure")
            .setDescription("The structure to build or upgrade")
            .setRequired(true)
            .addChoices(
              { name: "Animal House", value: "animalHouse" },
              { name: "Feeding Station", value: "feedingStation" },
              { name: "Training Ground", value: "trainingGround" },
            ),
        ),
    ),
  cooldown: 5,

  async execute(interaction, client, user) {
    const subcommand = interaction.options.getSubcommand()

    if (subcommand === "view") {
      // Get farm details
      const farmLevel = user.farm.level
      const animalCount = user.farm.animals.length
      const maxAnimals = user.getMaxAnimals()

      // Get structures
      const structures = user.farm.structures.map((structure) => {
        const structureInfo = Object.values(farmStructures).find((s) => s.type === structure.type)
        return {
          name: structureInfo ? structureInfo.name : structure.type,
          level: structure.level,
          description: structureInfo ? structureInfo.description : "No description available",
        }
      })

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Farm`)
        .setColor("#8B4513")
        .setDescription(`A level ${farmLevel} farm with ${animalCount}/${maxAnimals} animals.`)
        .addFields(
          { name: "Farm Level", value: `Level ${farmLevel}`, inline: true },
          { name: "Animals", value: `${animalCount}/${maxAnimals}`, inline: true },
          { name: "Upgrade Cost", value: `${calculateFarmUpgradeCost(farmLevel)} 🪙`, inline: true },
        )
        .setFooter({ text: "Use /farm upgrade to upgrade your farm" })
        .setTimestamp()

      // Add structures
      if (structures.length > 0) {
        let structuresText = ""
        structures.forEach((structure) => {
          structuresText += `**${structure.name}** (Level ${structure.level})\n└ ${structure.description}\n\n`
        })

        embed.addFields({ name: "Structures", value: structuresText })
      }

      // Add animals preview (just count by type)
      if (animalCount > 0) {
        const animalTypes = {}
        user.farm.animals.forEach((animal) => {
          animalTypes[animal.type] = (animalTypes[animal.type] || 0) + 1
        })

        let animalsText = ""
        for (const [type, count] of Object.entries(animalTypes)) {
          const animal = user.farm.animals.find((a) => a.type === type)
          animalsText += `${animal.emoji} **${type}**: ${count}\n`
        }

        embed.addFields({ name: "Animals", value: animalsText })
      }

      return interaction.reply({ embeds: [embed] })
    } else if (subcommand === "upgrade") {
      // Calculate upgrade cost
      const currentLevel = user.farm.level
      const upgradeCost = calculateFarmUpgradeCost(currentLevel)

      // Check if user has enough coins
      if (user.coins < upgradeCost) {
        return interaction.reply({
          content: `You don't have enough coins to upgrade your farm! You need ${upgradeCost} 🪙 but you only have ${user.coins} 🪙.`,
          ephemeral: true,
        })
      }

      // Upgrade farm
      user.coins -= upgradeCost
      user.farm.level += 1
      user.farm.lastUpgrade = new Date()
      await user.save()

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle("Farm Upgraded!")
        .setColor("#32CD32")
        .setDescription(`You've upgraded your farm to level ${user.farm.level}!`)
        .addFields(
          { name: "New Level", value: `Level ${user.farm.level}`, inline: true },
          { name: "Cost", value: `${upgradeCost} 🪙`, inline: true },
          { name: "New Capacity", value: `${user.getMaxAnimals()} animals`, inline: true },
          {
            name: "Benefits",
            value:
              "• Increased animal capacity\n• Higher chance for rare animals\n• Faster animal XP gain\n• Access to new structures",
          },
        )
        .setFooter({ text: "Use /farm view to see your farm" })
        .setTimestamp()

      return interaction.reply({ embeds: [embed] })
    } else if (subcommand === "build") {
      const structureType = interaction.options.getString("structure")

      // Get structure info
      const structureInfo = Object.values(farmStructures).find((s) => s.type === structureType)
      if (!structureInfo) {
        return interaction.reply({
          content: "Invalid structure type!",
          ephemeral: true,
        })
      }

      // Check if user meets farm level requirement
      if (user.farm.level < structureInfo.requirements.farmLevel) {
        return interaction.reply({
          content: `Your farm level is too low to build this structure! You need a level ${structureInfo.requirements.farmLevel} farm.`,
          ephemeral: true,
        })
      }

      // Check if user already has this structure
      const existingStructure = user.farm.structures.find((s) => s.type === structureType)

      if (existingStructure) {
        // Upgrading existing structure
        if (existingStructure.level >= structureInfo.maxLevel) {
          return interaction.reply({
            content: `This structure is already at its maximum level (${existingStructure.level})!`,
            ephemeral: true,
          })
        }

        // Calculate upgrade cost
        const upgradeCost = calculateStructureUpgradeCost(structureType, existingStructure.level)

        // Check if user has enough coins
        if (user.coins < upgradeCost) {
          return interaction.reply({
            content: `You don't have enough coins to upgrade this structure! You need ${upgradeCost} 🪙 but you only have ${user.coins} 🪙.`,
            ephemeral: true,
          })
        }

        // Upgrade structure
        user.coins -= upgradeCost
        existingStructure.level += 1
        await user.save()

        // Create embed
        const embed = new EmbedBuilder()
          .setTitle("Structure Upgraded!")
          .setColor("#32CD32")
          .setDescription(`You've upgraded your ${structureInfo.name} to level ${existingStructure.level}!`)
          .addFields(
            { name: "Structure", value: structureInfo.name, inline: true },
            { name: "New Level", value: `Level ${existingStructure.level}`, inline: true },
            { name: "Cost", value: `${upgradeCost} 🪙`, inline: true },
            { name: "Effect", value: structureInfo.description },
          )
          .setFooter({ text: "Use /farm view to see your farm" })
          .setTimestamp()

        return interaction.reply({ embeds: [embed] })
      } else {
        // Building new structure
        // Calculate build cost
        const buildCost = structureInfo.baseCost

        // Check if user has enough coins
        if (user.coins < buildCost) {
          return interaction.reply({
            content: `You don't have enough coins to build this structure! You need ${buildCost} 🪙 but you only have ${user.coins} 🪙.`,
            ephemeral: true,
          })
        }

        // Check if user has required resources
        const missingResources = []
        for (const [resource, amount] of Object.entries(structureInfo.requirements.resources)) {
          if (!user.resources[resource] || user.resources[resource] < amount) {
            missingResources.push(`${amount} ${resource}`)
          }
        }

        if (missingResources.length > 0) {
          return interaction.reply({
            content: `You don't have the required resources to build this structure! You need: ${missingResources.join(", ")}.`,
            ephemeral: true,
          })
        }

        // Deduct resources
        for (const [resource, amount] of Object.entries(structureInfo.requirements.resources)) {
          user.resources[resource] -= amount
        }

        // Build structure
        user.coins -= buildCost
        user.farm.structures.push({
          type: structureType,
          level: 1,
          built: true,
        })
        await user.save()

        // Create embed
        const embed = new EmbedBuilder()
          .setTitle("Structure Built!")
          .setColor("#32CD32")
          .setDescription(`You've built a ${structureInfo.name} on your farm!`)
          .addFields(
            { name: "Structure", value: structureInfo.name, inline: true },
            { name: "Level", value: "Level 1", inline: true },
            { name: "Cost", value: `${buildCost} 🪙`, inline: true },
            { name: "Effect", value: structureInfo.description },
          )
          .setFooter({ text: "Use /farm view to see your farm" })
          .setTimestamp()

        return interaction.reply({ embeds: [embed] })
      }
    }
  },
}
