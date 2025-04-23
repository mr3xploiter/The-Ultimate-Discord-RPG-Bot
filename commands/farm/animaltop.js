const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const User = require("../../models/userModel")
const { calculateAnimalBattlePower } = require("../../utils/animalUtils")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("animaltop")
    .setDescription("View the top animals globally")
    .addStringOption((option) =>
      option
        .setName("sort")
        .setDescription("How to sort the leaderboard")
        .setRequired(true)
        .addChoices(
          { name: "Strength", value: "strength" },
          { name: "Level", value: "level" },
          { name: "Wins", value: "wins" },
          { name: "Battle Power", value: "power" },
        ),
    ),
  cooldown: 10,

  async execute(interaction, client, user) {
    const sortType = interaction.options.getString("sort")

    // Fetch all users with animals
    const users = await User.find({ "farm.animals.0": { $exists: true } })

    if (users.length === 0) {
      return interaction.reply({
        content: "There are no animals yet!",
        ephemeral: true,
      })
    }

    // Collect all animals with their owners
    const allAnimals = []
    users.forEach((u) => {
      u.farm.animals.forEach((animal) => {
        allAnimals.push({
          ...animal.toObject(),
          ownerName: u.username,
          ownerId: u.userId,
        })
      })
    })

    // Sort animals based on selected criteria
    if (sortType === "strength") {
      allAnimals.sort((a, b) => b.strength - a.strength)
    } else if (sortType === "level") {
      allAnimals.sort((a, b) => b.level - a.level)
    } else if (sortType === "wins") {
      allAnimals.sort((a, b) => b.wins - a.wins)
    } else if (sortType === "power") {
      allAnimals.sort((a, b) => calculateAnimalBattlePower(b) - calculateAnimalBattlePower(a))
    }

    // Take top 10
    const topAnimals = allAnimals.slice(0, 10)

    // Create leaderboard list
    let leaderboardText = ""
    topAnimals.forEach((animal, index) => {
      // Add medal for top 3
      let medal = ""
      if (index === 0) medal = "🥇 "
      else if (index === 1) medal = "🥈 "
      else if (index === 2) medal = "🥉 "

      const value =
        sortType === "strength"
          ? animal.strength
          : sortType === "level"
            ? animal.level
            : sortType === "wins"
              ? animal.wins
              : calculateAnimalBattlePower(animal)

      const valueLabel = sortType === "strength" ? "💪" : sortType === "level" ? "📊" : sortType === "wins" ? "🏆" : "⚔️"

      leaderboardText += `${medal}**${index + 1}.** ${animal.emoji} ${animal.name} (${animal.type}) - ${value} ${valueLabel}\n└ Owner: <@${animal.ownerId}> | Level: ${animal.level} | Wins: ${animal.wins}\n\n`
    })

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`Top Animals - Sorted by ${sortType.charAt(0).toUpperCase() + sortType.slice(1)}`)
      .setColor("#FFD700")
      .setDescription(leaderboardText)
      .setFooter({ text: "Train your animals to reach the top!" })
      .setTimestamp()

    return interaction.reply({ embeds: [embed] })
  },
}
