const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("collect")
    .setDescription("Collect rewards from an animal's completed task")
    .addStringOption((option) =>
      option.setName("animal").setDescription("The name of the animal to collect rewards from").setRequired(true),
    ),
  cooldown: 3,

  async execute(interaction, client, user) {
    const animalName = interaction.options.getString("animal")

    // Find animal
    const animal = user.farm.animals.find((a) => a.name.toLowerCase() === animalName.toLowerCase())
    if (!animal) {
      return interaction.reply({
        content: `You don't have an animal named "${animalName}"!`,
        ephemeral: true,
      })
    }

    // Check if animal is on a task
    if (!animal.taskType || !animal.taskEndTime) {
      return interaction.reply({
        content: `${animal.emoji} ${animal.name} is not on a task! Use \`/send\` to send it on a task.`,
        ephemeral: true,
      })
    }

    // Check if task is completed
    if (animal.taskEndTime > new Date()) {
      const timeLeft = Math.floor((animal.taskEndTime - new Date()) / 1000) // seconds
      const minutes = Math.floor(timeLeft / 60)
      const seconds = timeLeft % 60

      return interaction.reply({
        content: `${animal.emoji} ${animal.name} is still on its ${animal.taskType} task! It will return in **${minutes}m ${seconds}s**.`,
        ephemeral: true,
      })
    }

    // Complete task and get rewards
    const rewards = user.completeAnimalTask(animalName)

    if (!rewards) {
      return interaction.reply({
        content: "Failed to collect rewards!",
        ephemeral: true,
      })
    }

    // Add coins to user
    user.coins += rewards.coins

    // Add items to inventory
    rewards.items.forEach((item) => {
      if (!item.includes(" ")) {
        // If not a resource count (like "5 stone")
        user.inventory.push(item)
      }
    })

    // Save user
    await user.save()

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${animal.emoji} ${animal.name} Returned from ${animal.taskType}`)
      .setColor("#FFD700")
      .setDescription(`${animal.name} has returned from its ${animal.taskType} task with rewards!`)
      .addFields(
        { name: "Coins Earned", value: `${rewards.coins} 🪙`, inline: true },
        { name: "XP Gained", value: `${rewards.xp} ✨`, inline: true },
      )
      .setFooter({ text: "Send your animal on another task with /send" })
      .setTimestamp()

    // Add items if any
    if (rewards.items.length > 0) {
      embed.addFields({ name: "Items Found", value: rewards.items.join("\n") })
    }

    // Add level up message if animal leveled up
    if (rewards.leveledUp) {
      embed.addFields({
        name: "🎉 LEVEL UP!",
        value: `${animal.emoji} ${animal.name} is now level **${animal.level}**!`,
      })
    }

    return interaction.reply({ embeds: [embed] })
  },
}
