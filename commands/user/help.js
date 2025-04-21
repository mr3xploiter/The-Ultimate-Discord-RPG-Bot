const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows all available commands")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Command category")
        .setRequired(false)
        .addChoices(
          { name: "Economy", value: "economy" },
          { name: "Battle", value: "battle" },
          { name: "Games", value: "games" },
          { name: "Shop", value: "shop" },
          { name: "User", value: "user" },
          { name: "Leaderboard", value: "leaderboard" },
        ),
    ),
  cooldown: 3,

  async execute(interaction, client, user) {
    const category = interaction.options.getString("category")

    // Command categories
    const categories = {
      economy: {
        title: "💰 Economy Commands",
        description: "Commands to earn and manage your coins",
        commands: [
          { name: "/daily", description: "Claim your daily coins and XP (24h cooldown)" },
          { name: "/balance", description: "Check your balance and level" },
          { name: "/work", description: "Work to earn coins (1h cooldown)" },
        ],
      },
      battle: {
        title: "⚔️ Battle Commands",
        description: "Commands for battling other users",
        commands: [{ name: "/battle", description: "Battle another user (10m cooldown)" }],
      },
      games: {
        title: "🎮 Game Commands",
        description: "Mini-games to earn rewards",
        commands: [
          { name: "/hunt", description: "Hunt for items (30m cooldown)" },
          { name: "/guess", description: "Guess a number between 1-10 (5m cooldown)" },
          { name: "/gamble", description: "Gamble your coins (10m cooldown)" },
        ],
      },
      shop: {
        title: "🛒 Shop Commands",
        description: "Commands for buying and selling items",
        commands: [
          { name: "/shop", description: "View the shop" },
          { name: "/buy", description: "Buy an item from the shop" },
        ],
      },
      user: {
        title: "👤 User Commands",
        description: "Commands to manage your profile",
        commands: [
          { name: "/inventory", description: "View your inventory" },
          { name: "/profile", description: "View your profile or another user's profile" },
          { name: "/profileset", description: "Customize your profile (bio, title, etc.)" },
        ],
      },
      leaderboard: {
        title: "🏆 Leaderboard Commands",
        description: "Commands to view top players",
        commands: [{ name: "/leaderboard", description: "View the leaderboard (coins, xp, wins, level)" }],
      },
    }

    // If category is specified, show commands for that category
    if (category) {
      const categoryData = categories[category]

      const embed = new EmbedBuilder()
        .setTitle(categoryData.title)
        .setDescription(categoryData.description)
        .setColor("#00BFFF")
        .setFooter({ text: "PixelMon Game Bot" })
        .setTimestamp()

      // Add commands to embed
      categoryData.commands.forEach((cmd) => {
        embed.addFields({ name: cmd.name, value: cmd.description })
      })

      return interaction.reply({ embeds: [embed] })
    }

    // If no category specified, show all categories
    const embed = new EmbedBuilder()
      .setTitle("PixelMon Game Bot - Help")
      .setDescription("Here are all the command categories. Use `/help [category]` to see specific commands.")
      .setColor("#00BFFF")
      .addFields(
        { name: "💰 Economy", value: "Commands to earn and manage coins", inline: true },
        { name: "⚔️ Battle", value: "Commands for battling users", inline: true },
        { name: "🎮 Games", value: "Mini-games to earn rewards", inline: true },
        { name: "🛒 Shop", value: "Buy and sell items", inline: true },
        { name: "👤 User", value: "Manage your profile", inline: true },
        { name: "🏆 Leaderboard", value: "View top players", inline: true },
      )
      .setFooter({ text: "PixelMon Game Bot" })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  },
}
