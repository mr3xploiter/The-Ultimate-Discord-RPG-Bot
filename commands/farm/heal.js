const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("heal")
    .setDescription("Heal one of your animals")
    .addStringOption((option) =>
      option.setName("animal").setDescription("The name of the animal to heal").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The item to use for healing")
        .setRequired(true)
        .addChoices(
          { name: "Potion (Heals 30 HP)", value: "Potion" },
          { name: "Super Potion (Heals 70 HP)", value: "Super Potion" },
          { name: "Max Potion (Heals to full)", value: "Max Potion" },
        ),
    ),
  cooldown: 5,

  async execute(interaction, client, user) {
    const animalName = interaction.options.getString("animal")
    const itemName = interaction.options.getString("item")

    // Find animal
    const animal = user.farm.animals.find((a) => a.name.toLowerCase() === animalName.toLowerCase())
    if (!animal) {
      return interaction.reply({
        content: `You don't have an animal named "${animalName}"!`,
        ephemeral: true,
      })
    }

    // Check if animal is already at full health
    if (animal.health >= animal.maxHealth) {
      return interaction.reply({
        content: `${animal.emoji} ${animal.name} is already at full health!`,
        ephemeral: true,
      })
    }

    // Check if user has the item
    const itemIndex = user.inventory.findIndex((item) => item === itemName)
    if (itemIndex === -1) {
      return interaction.reply({
        content: `You don't have any ${itemName}s in your inventory! You can buy them from the shop.`,
        ephemeral: true,
      })
    }

    // Remove item from inventory
    user.inventory.splice(itemIndex, 1)

    // Calculate healing amount
    let healAmount = 0
    switch (itemName) {
      case "Potion":
        healAmount = 30
        break
      case "Super Potion":
        healAmount = 70
        break
      case "Max Potion":
        healAmount = animal.maxHealth
        break
      default:
        healAmount = 20
    }

    // Apply healing
    const oldHealth = animal.health
    user.healAnimal(animalName, healAmount)
    const healthGained = animal.health - oldHealth

    // Save user
    await user.save()

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${animal.emoji} ${animal.name} Healed!`)
      .setColor("#32CD32")
      .setDescription(`You used a ${itemName} to heal ${animal.name}!`)
      .addFields(
        { name: "Health Before", value: `${oldHealth}/${animal.maxHealth} ❤️`, inline: true },
        { name: "Health After", value: `${animal.health}/${animal.maxHealth} ❤️`, inline: true },
        { name: "Health Gained", value: `+${healthGained} ❤️`, inline: true },
      )
      .setFooter({
        text:
          animal.health >= animal.maxHealth
            ? "Your animal is now at full health!"
            : `Your animal still needs ${animal.maxHealth - animal.health} more HP to be fully healed`,
      })
      .setTimestamp()

    return interaction.reply({ embeds: [embed] })
  },
}
