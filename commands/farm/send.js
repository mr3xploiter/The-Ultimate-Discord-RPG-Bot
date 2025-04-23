const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("send")
    .setDescription("Send an animal on a task")
    .addStringOption((option) =>
      option.setName("animal").setDescription("The name of the animal to send").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("task")
        .setDescription("The task to send the animal on")
        .setRequired(true)
        .addChoices(
          { name: "Hunt (10 minutes)", value: "hunt" },
          { name: "Mine (15 minutes)", value: "mine" },
          { name: "Explore (20 minutes)", value: "explore" },
        ),
    ),
  cooldown: 5,

  async execute(interaction, client, user) {
    const animalName = interaction.options.getString("animal")
    const taskType = interaction.options.getString("task")

    // Find animal
    const animal = user.farm.animals.find((a) => a.name.toLowerCase() === animalName.toLowerCase())
    if (!animal) {
      return interaction.reply({
        content: `You don't have an animal named "${animalName}"!`,
        ephemeral: true,
      })
    }

    // Check if animal is already on a task
    if (user.isAnimalOnTask(animalName)) {
      const timeLeft = Math.floor((animal.taskEndTime - new Date()) / 1000) // seconds
      const minutes = Math.floor(timeLeft / 60)
      const seconds = timeLeft % 60

      return interaction.reply({
        content: `${animal.emoji} ${animal.name} is already on a ${animal.taskType} task! It will return in **${minutes}m ${seconds}s**.`,
        ephemeral: true,
      })
    }

    // Check if animal has enough health
    if (animal.health < animal.maxHealth * 0.3) {
      return interaction.reply({
        content: `${animal.emoji} ${animal.name} is too weak to go on a task! It needs to have at least 30% health. Use \`/heal\` to restore its health.`,
        ephemeral: true,
      })
    }

    // Determine task duration
    let durationMinutes = 10 // Default for hunt
    if (taskType === "mine") durationMinutes = 15
    if (taskType === "explore") durationMinutes = 20

    // Apply trait modifiers
    if (animal.trait === "lazy") {
      durationMinutes = Math.floor(durationMinutes * 1.2) // Lazy animals take longer
    } else if (animal.trait === "curious" && taskType === "explore") {
      durationMinutes = Math.floor(durationMinutes * 0.8) // Curious animals explore faster
    }

    // Send animal on task
    user.sendAnimalOnTask(animalName, taskType, durationMinutes)

    // Save user
    await user.save()

    // Calculate return time
    const returnTime = new Date(Date.now() + durationMinutes * 60 * 1000)

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${animal.emoji} ${animal.name} Sent on Task`)
      .setColor("#4169E1")
      .setDescription(`You've sent ${animal.name} on a ${taskType} task!`)
      .addFields(
        { name: "Task", value: taskType, inline: true },
        { name: "Duration", value: `${durationMinutes} minutes`, inline: true },
        { name: "Returns At", value: `<t:${Math.floor(returnTime.getTime() / 1000)}:R>`, inline: true },
        {
          name: "Possible Rewards",
          value:
            taskType === "hunt"
              ? "Coins, XP, and items"
              : taskType === "mine"
                ? "Coins, XP, and resources"
                : "Coins, XP, and rare items",
        },
      )
      .setFooter({ text: "Use /collect to collect rewards when the task is complete" })
      .setTimestamp()

    return interaction.reply({ embeds: [embed] })
  },
}
