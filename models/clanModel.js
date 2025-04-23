const mongoose = require("mongoose")

const clanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  tag: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 5,
  },
  description: {
    type: String,
    default: "No description set.",
    maxlength: 200,
  },
  leaderId: {
    type: String,
    required: true,
  },
  members: {
    type: [String], // Array of userIds
    default: [],
  },
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  battlesWon: {
    type: Number,
    default: 0,
  },
  battlesLost: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Method to add a member
clanSchema.methods.addMember = function (userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId)
    return true
  }
  return false
}

// Method to remove a member
clanSchema.methods.removeMember = function (userId) {
  const index = this.members.indexOf(userId)
  if (index !== -1) {
    this.members.splice(index, 1)
    return true
  }
  return false
}

// Method to check if user is a member
clanSchema.methods.isMember = function (userId) {
  return this.members.includes(userId) || this.leaderId === userId
}

// Method to check if user is the leader
clanSchema.methods.isLeader = function (userId) {
  return this.leaderId === userId
}

// Method to get member count
clanSchema.methods.getMemberCount = function () {
  return this.members.length + 1 // +1 for the leader
}

// Method to add XP and check for level up
clanSchema.methods.addXP = async function (amount) {
  this.xp += amount

  // Check for level up (simplified formula)
  const xpNeeded = this.level * 1000
  if (this.xp >= xpNeeded) {
    this.level += 1
    this.xp -= xpNeeded
    return true // Leveled up
  }

  return false // No level up
}

module.exports = mongoose.model("Clan", clanSchema)
