const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const User = require("../../models/userModel")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gift")
    .setDescription("Gift coins to another user")
    .addUserOption((option) => option.setName("user").setDescription("The user to gift coins to").setRequired(true))
    .addIntegerOption((option) =>
      option.setName("amount").setDescription("The amount of coins to gift").setRequired(true).setMinValue(10),
    ),
  cooldown: 5,

  async execute(interaction, client, user) {
    // Get target user and amount
    const targetUser = interaction.options.getUser("user")
    const amount = interaction.options.getInteger("amount")

    // Check if user is trying to gift themselves
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: "You can't gift coins to yourself!",
        ephemeral: true,
      })
    }

    // Check if target is a bot
    if (targetUser.bot) {
      return interaction.reply({
        content: "You can't gift coins to a bot!",
        ephemeral: true,
      })
    }

    // Check if user has enough coins
    if (user.coins < amount) {
      return interaction.reply({
        content: `You don't have enough coins! You have ${user.coins} 🪙 but you're trying to gift ${amount} 🪙.`,
        ephemeral: true,
      })
    }

    // Check if cooldown has passed (30 minutes)
    if (!user.cooldownPassed("lastGift", 0.5)) {
      const nextGift = new Date(user.lastGift.getTime() + 30 * 60 * 1000)
      const timeLeft = nextGift - Date.now()

      const minutes = Math.floor(timeLeft / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      return interaction.reply({
        content: `You need to wait before gifting again! Try again in **${minutes}m ${seconds}s**.`,
        ephemeral: true,
      })
    }

    // Find or create target user in database
    const targetUserDoc = await User.findOrCreate(targetUser.id, targetUser.username)

    // Transfer coins
    user.coins -= amount
    targetUserDoc.coins += amount

    // Update last gift time
    user.lastGift = new Date()

    // Save both users
    await user.save()
    await targetUserDoc.save()

    // Create embed for sender
    const embed = new EmbedBuilder()
      .setTitle("Gift Sent!")
      .setColor("#32CD32")
      .setDescription(`You've gifted ${amount} 🪙 to ${targetUser.username}!`)
      .addFields(
        { name: "Amount", value: `${amount} 🪙`, inline: true },
        { name: "Recipient", value: `<@${targetUser.id}>`, inline: true },
        { name: "Your New Balance", value: `${user.coins} 🪙`, inline: true },
      )
      .setFooter({ text: "You can gift again in 30 minutes" })
      .setTimestamp()

    // Create embed for recipient
    const recipientEmbed = new EmbedBuilder()
      .setTitle("Gift Received!")
      .setColor("#4169E1")
      .setDescription(`You've received ${amount} 🪙 from ${interaction.user.username}!`)
      .addFields(
        { name: "Amount", value: `${amount} 🪙`, inline: true },
        { name: "Sender", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Your New Balance", value: `${targetUserDoc.coins} 🪙`, inline: true },
      )
      .setFooter({ text: "Lucky you!" })
      .setTimestamp()

    // Send notification to recipient if they're in the server
    try {
      const recipientMember = await interaction.guild.members.fetch(targetUser.id)
      if (recipientMember) {
        recipientMember.send({ embeds: [recipientEmbed] }).catch(() => {
          // Ignore errors if DM fails (e.g., user has DMs disabled)
        })
      }
    } catch (error) {
      // Ignore errors if member fetch fails
    }

    return interaction.reply({ embeds: [embed] })
  },
}
