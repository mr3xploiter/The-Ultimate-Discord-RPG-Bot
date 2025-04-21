const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

// Background color themes
const backgroundThemes = {
  default: "Royal Blue",
  fire: "Orange Red",
  water: "Dodger Blue",
  grass: "Lime Green",
  electric: "Gold",
  psychic: "Hot Pink",
  dark: "Discord Dark",
  ghost: "Medium Purple",
  dragon: "Medium Slate Blue",
  fairy: "Light Pink",
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profileset")
    .setDescription("Customize your profile")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("bio")
        .setDescription("Set your profile bio")
        .addStringOption((option) =>
          option.setName("text").setDescription("Your bio (max 200 characters)").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("favoriteitem")
        .setDescription("Set your favorite item")
        .addStringOption((option) => option.setName("item").setDescription("Your favorite item").setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("background")
        .setDescription("Set your profile background theme")
        .addStringOption((option) =>
          option
            .setName("theme")
            .setDescription("Choose a background theme")
            .setRequired(true)
            .addChoices(
              { name: "Default (Blue)", value: "default" },
              { name: "Fire (Red)", value: "fire" },
              { name: "Water (Blue)", value: "water" },
              { name: "Grass (Green)", value: "grass" },
              { name: "Electric (Yellow)", value: "electric" },
              { name: "Psychic (Pink)", value: "psychic" },
              { name: "Dark (Gray)", value: "dark" },
              { name: "Ghost (Purple)", value: "ghost" },
              { name: "Dragon (Blue-Purple)", value: "dragon" },
              { name: "Fairy (Light Pink)", value: "fairy" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("title")
        .setDescription("Set your profile title")
        .addStringOption((option) =>
          option.setName("text").setDescription("Your title (max 30 characters)").setRequired(true),
        ),
    ),
  cooldown: 5,

  async execute(interaction, client, user) {
    const subcommand = interaction.options.getSubcommand()

    // Handle different subcommands
    switch (subcommand) {
      case "bio": {
        const bio = interaction.options.getString("text")

        // Validate bio length
        if (bio.length > 200) {
          return interaction.reply({
            content: "Your bio must be 200 characters or less!",
            ephemeral: true,
          })
        }

        // Update user bio
        user.profile.bio = bio
        await user.save()

        return interaction.reply({
          content: `✅ Your bio has been updated!`,
          ephemeral: true,
        })
      }

      case "favoriteitem": {
        const item = interaction.options.getString("item")

        // Update favorite item
        user.profile.favoriteItem = item
        await user.save()

        return interaction.reply({
          content: `✅ Your favorite item has been set to: ${item}`,
          ephemeral: true,
        })
      }

      case "background": {
        const theme = interaction.options.getString("theme")

        // Update background theme
        user.profile.background = theme
        await user.save()

        return interaction.reply({
          content: `✅ Your profile background has been set to: ${backgroundThemes[theme]}`,
          ephemeral: true,
        })
      }

      case "title": {
        const title = interaction.options.getString("text")

        // Validate title length
        if (title.length > 30) {
          return interaction.reply({
            content: "Your title must be 30 characters or less!",
            ephemeral: true,
          })
        }

        // Update user title
        user.profile.title = title
        await user.save()

        return interaction.reply({
          content: `✅ Your title has been updated to: ${title}`,
          ephemeral: true,
        })
      }

      default:
        return interaction.reply({
          content: "Invalid subcommand!",
          ephemeral: true,
        })
    }
  },
}
