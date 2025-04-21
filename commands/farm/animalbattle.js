const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { simulateAnimalBattle, calculateAnimalBattlePower } = require("../../utils/animalUtils")
const User = require("../../models/userModel")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("animalbattle")
    .setDescription("Battle your animal against another user's animal")
    .addUserOption((option) =>
      option.setName("opponent").setDescription("The user you want to battle").setRequired(true),
    ),
  cooldown: 10,

  async execute(interaction, client, user) {
    // Get opponent from options
    const opponent = interaction.options.getUser("opponent")

    // Check if user is trying to battle themselves
    if (opponent.id === interaction.user.id) {
      return interaction.reply({
        content: "You can't battle your own animals!",
        ephemeral: true,
      })
    }

    // Check if opponent is a bot
    if (opponent.bot) {
      return interaction.reply({
        content: "You can't battle a bot's animals!",
        ephemeral: true,
      })
    }

    // Check if user has a selected animal
    const userAnimal = user.getSelectedAnimal()
    if (!userAnimal) {
      return interaction.reply({
        content: "You don't have a selected animal! Use `/animals select` to choose an animal for battle.",
        ephemeral: true,
      })
    }

    // Check if animal has enough health
    if (userAnimal.health < userAnimal.maxHealth * 0.2) {
      return interaction.reply({
        content: `Your ${userAnimal.name} is too weak to battle! It needs to have at least 20% health. Use \`/heal\` to restore its health.`,
        ephemeral: true,
      })
    }

    // Check if user is on cooldown (10 minutes)
    if (!user.cooldownPassed("lastBattle", 1 / 6)) {
      // 1/6 of an hour = 10 minutes
      const nextBattle = new Date(user.lastBattle.getTime() + 10 * 60 * 1000)
      const timeLeft = nextBattle - Date.now()

      const minutes = Math.floor(timeLeft / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      return interaction.reply({
        content: `Your animal needs to rest after the last battle! You can battle again in **${minutes}m ${seconds}s**.`,
        ephemeral: true,
      })
    }

    // Find or create opponent in database
    const opponentUser = await User.findOrCreate(opponent.id, opponent.username)

    // Check if opponent has a selected animal
    const opponentAnimal = opponentUser.getSelectedAnimal()
    if (!opponentAnimal) {
      return interaction.reply({
        content: `${opponent.username} doesn't have a selected animal for battle!`,
        ephemeral: true,
      })
    }

    // Check if opponent's animal has enough health
    if (opponentAnimal.health < opponentAnimal.maxHealth * 0.2) {
      return interaction.reply({
        content: `${opponent.username}'s ${opponentAnimal.name} is too weak to battle! It needs to have at least 20% health.`,
        ephemeral: true,
      })
    }

    // Simulate battle
    const battleResult = simulateAnimalBattle(userAnimal, opponentAnimal)

    // If battle was avoided due to friendly trait
    if (battleResult.avoided) {
      // Add small XP for trying
      user.addAnimalXP(userAnimal, battleResult.xpGained)
      await user.save()

      return interaction.reply({
        content: `${userAnimal.emoji} ${userAnimal.name} is too friendly and avoided the battle with ${opponentAnimal.emoji} ${opponentAnimal.name}! It gained ${battleResult.xpGained} XP for trying.`,
        ephemeral: false,
      })
    }

    // Apply damage
    userAnimal.health = Math.max(1, userAnimal.health - battleResult.attackerDamage)
    opponentAnimal.health = Math.max(1, opponentAnimal.health - battleResult.defenderDamage)

    // Update battle records
    if (battleResult.winner === userAnimal) {
      userAnimal.wins += 1
      opponentAnimal.losses += 1
    } else {
      userAnimal.losses += 1
      opponentAnimal.wins += 1
    }

    // Add XP to winner
    const winnerUser = battleResult.winner === userAnimal ? user : opponentUser
    const winnerAnimal = battleResult.winner === userAnimal ? userAnimal : opponentAnimal
    const xpResult = winnerUser.addAnimalXP(winnerAnimal, battleResult.xpGained)

    // Update last battle time
    user.lastBattle = new Date()
    await user.save()
    await opponentUser.save()

    // Create battle result embed
    const embed = new EmbedBuilder()
      .setTitle("🐾 Animal Battle Results 🐾")
      .setColor(battleResult.winner === userAnimal ? "#00FF00" : "#FF0000")
      .setDescription(
        `**${userAnimal.emoji} ${userAnimal.name}** battled **${opponentAnimal.emoji} ${opponentAnimal.name}** and ${battleResult.winner === userAnimal ? "won" : "lost"}!`,
      )
      .addFields(
        {
          name: `${userAnimal.emoji} ${userAnimal.name} (${user.username})`,
          value: `Level ${userAnimal.level} ${userAnimal.type}\nHealth: ${userAnimal.health}/${userAnimal.maxHealth} ❤️ (-${battleResult.attackerDamage})\nStrength: ${userAnimal.strength} 💪\nTrait: ${userAnimal.trait}`,
          inline: true,
        },
        {
          name: `${opponentAnimal.emoji} ${opponentAnimal.name} (${opponentUser.username})`,
          value: `Level ${opponentAnimal.level} ${opponentAnimal.type}\nHealth: ${opponentAnimal.health}/${opponentAnimal.maxHealth} ❤️ (-${battleResult.defenderDamage})\nStrength: ${opponentAnimal.strength} 💪\nTrait: ${opponentAnimal.trait}`,
          inline: true,
        },
        {
          name: "Battle Result",
          value: `Winner: **${battleResult.winner.emoji} ${battleResult.winner.name}**\nXP Gained: ${battleResult.xpGained} ✨`,
          inline: false,
        },
      )
      .setFooter({ text: "Use /heal to restore your animal's health" })
      .setTimestamp()

    // Add level up message if animal leveled up
    if (xpResult.leveledUp) {
      embed.addFields({
        name: "🎉 LEVEL UP!",
        value: `${winnerAnimal.emoji} ${winnerAnimal.name} is now level **${winnerAnimal.level}**!`,
      })
    }

    return interaction.reply({ embeds: [embed] })
  },
}
