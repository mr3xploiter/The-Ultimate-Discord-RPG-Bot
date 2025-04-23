const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const Clan = require("../../models/clanModel")
const User = require("../../models/userModel")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clan")
    .setDescription("Manage your clan")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new clan")
        .addStringOption((option) => option.setName("name").setDescription("The name of your clan").setRequired(true))
        .addStringOption((option) =>
          option.setName("tag").setDescription("The tag of your clan (2-5 characters)").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("description").setDescription("A description for your clan").setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("join")
        .setDescription("Join an existing clan")
        .addStringOption((option) =>
          option.setName("name").setDescription("The name of the clan to join").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("leave").setDescription("Leave your current clan"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("View information about a clan")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the clan (leave empty for your own clan)")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("members").setDescription("View the members of your clan"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("kick")
        .setDescription("Kick a member from your clan (leader only)")
        .addUserOption((option) => option.setName("user").setDescription("The user to kick").setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName("leaderboard").setDescription("View the clan leaderboard")),
  cooldown: 5,

  async execute(interaction, client, user) {
    const subcommand = interaction.options.getSubcommand()

    // Handle different subcommands
    switch (subcommand) {
      case "create": {
        // Check if user is already in a clan
        if (user.clanId) {
          return interaction.reply({
            content: "You are already in a clan! Leave your current clan first with `/clan leave`.",
            ephemeral: true,
          })
        }

        const name = interaction.options.getString("name")
        const tag = interaction.options.getString("tag")
        const description = interaction.options.getString("description") || "No description set."

        // Validate clan name and tag
        if (name.length < 3 || name.length > 20) {
          return interaction.reply({
            content: "Clan name must be between 3 and 20 characters!",
            ephemeral: true,
          })
        }

        if (tag.length < 2 || tag.length > 5) {
          return interaction.reply({
            content: "Clan tag must be between 2 and 5 characters!",
            ephemeral: true,
          })
        }

        // Check if clan name or tag already exists
        const existingClan = await Clan.findOne({ $or: [{ name }, { tag }] })
        if (existingClan) {
          return interaction.reply({
            content: "A clan with that name or tag already exists!",
            ephemeral: true,
          })
        }

        // Create new clan
        const newClan = new Clan({
          name,
          tag,
          description,
          leaderId: user.userId,
          members: [], // Leader is not in members array, tracked separately
        })

        await newClan.save()

        // Update user's clan
        user.clanId = newClan._id
        await user.save()

        // Create embed
        const embed = new EmbedBuilder()
          .setTitle("Clan Created!")
          .setColor("#32CD32")
          .setDescription(`You have successfully created the clan **${name}** [${tag}]!`)
          .addFields(
            { name: "Description", value: description, inline: false },
            { name: "Leader", value: `<@${user.userId}>`, inline: true },
            { name: "Members", value: "1 (just you)", inline: true },
          )
          .setFooter({ text: "Use /clan info to view your clan details" })
          .setTimestamp()

        return interaction.reply({ embeds: [embed] })
      }

      case "join": {
        // Check if user is already in a clan
        if (user.clanId) {
          return interaction.reply({
            content: "You are already in a clan! Leave your current clan first with `/clan leave`.",
            ephemeral: true,
          })
        }

        const clanName = interaction.options.getString("name")

        // Find clan
        const clan = await Clan.findOne({ name: clanName })
        if (!clan) {
          return interaction.reply({
            content: `Clan "${clanName}" not found!`,
            ephemeral: true,
          })
        }

        // Add user to clan
        clan.addMember(user.userId)
        await clan.save()

        // Update user's clan
        user.clanId = clan._id
        await user.save()

        // Create embed
        const embed = new EmbedBuilder()
          .setTitle("Joined Clan!")
          .setColor("#32CD32")
          .setDescription(`You have successfully joined the clan **${clan.name}** [${clan.tag}]!`)
          .addFields(
            { name: "Description", value: clan.description, inline: false },
            { name: "Leader", value: `<@${clan.leaderId}>`, inline: true },
            { name: "Members", value: `${clan.getMemberCount()}`, inline: true },
          )
          .setFooter({ text: "Use /clan info to view your clan details" })
          .setTimestamp()

        return interaction.reply({ embeds: [embed] })
      }

      case "leave": {
        // Check if user is in a clan
        if (!user.clanId) {
          return interaction.reply({
            content: "You are not in a clan!",
            ephemeral: true,
          })
        }

        // Find clan
        const clan = await Clan.findById(user.clanId)
        if (!clan) {
          // Clan not found, just clear user's clan ID
          user.clanId = null
          await user.save()
          return interaction.reply({
            content: "You have left your clan!",
            ephemeral: true,
          })
        }

        // Check if user is the leader
        if (clan.isLeader(user.userId)) {
          // If there are other members, promote the oldest member to leader
          if (clan.members.length > 0) {
            const newLeaderId = clan.members[0]
            clan.leaderId = newLeaderId
            clan.members.shift() // Remove new leader from members array
            await clan.save()

            // Update user's clan
            user.clanId = null
            await user.save()

            return interaction.reply({
              content: `You have left your clan! <@${newLeaderId}> is now the leader.`,
              ephemeral: false,
            })
          } else {
            // No other members, delete the clan
            await Clan.findByIdAndDelete(clan._id)

            // Update user's clan
            user.clanId = null
            await user.save()

            return interaction.reply({
              content: "You have left your clan and it has been disbanded since there are no other members.",
              ephemeral: false,
            })
          }
        } else {
          // User is not the leader, just remove from members
          clan.removeMember(user.userId)
          await clan.save()

          // Update user's clan
          user.clanId = null
          await user.save()

          return interaction.reply({
            content: `You have left the clan **${clan.name}**!`,
            ephemeral: false,
          })
        }
      }

      case "info": {
        const clanName = interaction.options.getString("name")
        let clan

        // If no clan name provided, show user's clan
        if (!clanName) {
          if (!user.clanId) {
            return interaction.reply({
              content: "You are not in a clan! Specify a clan name or join a clan first.",
              ephemeral: true,
            })
          }

          clan = await Clan.findById(user.clanId)
          if (!clan) {
            // Clan not found, clear user's clan ID
            user.clanId = null
            await user.save()
            return interaction.reply({
              content: "Your clan could not be found! It may have been disbanded.",
              ephemeral: true,
            })
          }
        } else {
          // Find clan by name
          clan = await Clan.findOne({ name: clanName })
          if (!clan) {
            return interaction.reply({
              content: `Clan "${clanName}" not found!`,
              ephemeral: true,
            })
          }
        }

        // Get leader and members
        const leader = await User.findOne({ userId: clan.leaderId })
        const memberUsers = await User.find({ userId: { $in: clan.members } })

        // Create member list
        let memberList = `👑 **${leader ? leader.username : "Unknown"}** (Leader)\n`
        memberUsers.forEach((member) => {
          memberList += `👤 ${member.username} (Level ${member.level})\n`
        })

        // Create embed
        const embed = new EmbedBuilder()
          .setTitle(`Clan: ${clan.name} [${clan.tag}]`)
          .setColor("#4169E1")
          .setDescription(clan.description)
          .addFields(
            { name: "Level", value: `${clan.level}`, inline: true },
            { name: "XP", value: `${clan.xp}`, inline: true },
            { name: "Members", value: `${clan.getMemberCount()}/${10}`, inline: true }, // Assuming max 10 members
            { name: "Battles", value: `${clan.battlesWon}W / ${clan.battlesLost}L`, inline: true },
            { name: "Created", value: `<t:${Math.floor(clan.createdAt.getTime() / 1000)}:R>`, inline: true },
            { name: "Member List", value: memberList },
          )
          .setFooter({ text: "PixelMon Clan System" })
          .setTimestamp()

        return interaction.reply({ embeds: [embed] })
      }

      case "members": {
        // Check if user is in a clan
        if (!user.clanId) {
          return interaction.reply({
            content: "You are not in a clan!",
            ephemeral: true,
          })
        }

        // Find clan
        const clan = await Clan.findById(user.clanId)
        if (!clan) {
          // Clan not found, clear user's clan ID
          user.clanId = null
          await user.save()
          return interaction.reply({
            content: "Your clan could not be found! It may have been disbanded.",
            ephemeral: true,
          })
        }

        // Get leader and members
        const leader = await User.findOne({ userId: clan.leaderId })
        const memberUsers = await User.find({ userId: { $in: clan.members } })

        // Create member list with more details
        let memberList = `👑 **${leader ? leader.username : "Unknown"}** (Level ${leader ? leader.level : "?"})\n`
        memberUsers.forEach((member) => {
          memberList += `👤 **${member.username}** (Level ${member.level})\n└ Battles: ${member.wins}W / ${member.losses}L\n`
        })

        // Create embed
        const embed = new EmbedBuilder()
          .setTitle(`${clan.name} [${clan.tag}] Members`)
          .setColor("#4169E1")
          .setDescription(`Total Members: ${clan.getMemberCount()}/${10}`) // Assuming max 10 members
          .addFields({ name: "Member List", value: memberList })
          .setFooter({ text: "PixelMon Clan System" })
          .setTimestamp()

        return interaction.reply({ embeds: [embed] })
      }

      case "kick": {
        // Check if user is in a clan
        if (!user.clanId) {
          return interaction.reply({
            content: "You are not in a clan!",
            ephemeral: true,
          })
        }

        // Find clan
        const clan = await Clan.findById(user.clanId)
        if (!clan) {
          // Clan not found, clear user's clan ID
          user.clanId = null
          await user.save()
          return interaction.reply({
            content: "Your clan could not be found! It may have been disbanded.",
            ephemeral: true,
          })
        }

        // Check if user is the leader
        if (!clan.isLeader(user.userId)) {
          return interaction.reply({
            content: "Only the clan leader can kick members!",
            ephemeral: true,
          })
        }

        // Get target user
        const targetUser = interaction.options.getUser("user")
        if (!targetUser) {
          return interaction.reply({
            content: "Invalid user!",
            ephemeral: true,
          })
        }

        // Check if target is in the clan
        if (!clan.isMember(targetUser.id)) {
          return interaction.reply({
            content: "That user is not in your clan!",
            ephemeral: true,
          })
        }

        // Check if target is the leader
        if (clan.isLeader(targetUser.id)) {
          return interaction.reply({
            content: "You cannot kick yourself as the leader!",
            ephemeral: true,
          })
        }

        // Remove target from clan
        clan.removeMember(targetUser.id)
        await clan.save()

        // Update target's clan
        const targetUserDoc = await User.findOne({ userId: targetUser.id })
        if (targetUserDoc) {
          targetUserDoc.clanId = null
          await targetUserDoc.save()
        }

        return interaction.reply({
          content: `You have kicked <@${targetUser.id}> from the clan!`,
          ephemeral: false,
        })
      }

      case "leaderboard": {
        // Find top 10 clans by level and XP
        const topClans = await Clan.find().sort({ level: -1, xp: -1 }).limit(10)

        if (topClans.length === 0) {
          return interaction.reply({
            content: "There are no clans yet!",
            ephemeral: true,
          })
        }

        // Create leaderboard list
        let leaderboardText = ""
        topClans.forEach((clan, index) => {
          // Add medal for top 3
          let medal = ""
          if (index === 0) medal = "🥇 "
          else if (index === 1) medal = "🥈 "
          else if (index === 2) medal = "🥉 "

          leaderboardText += `${medal}**${index + 1}.** ${clan.name} [${clan.tag}] - Level ${clan.level} (${clan.xp} XP)\n`
        })

        // Create embed
        const embed = new EmbedBuilder()
          .setTitle("Clan Leaderboard")
          .setColor("#FFD700")
          .setDescription(leaderboardText)
          .setFooter({ text: "PixelMon Clan System" })
          .setTimestamp()

        return interaction.reply({ embeds: [embed] })
      }

      default:
        return interaction.reply({
          content: "Invalid subcommand!",
          ephemeral: true,
        })
    }
  },
}
