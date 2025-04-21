const mongoose = require("mongoose")

// Define the quest schema
const questSchema = new mongoose.Schema({
  id: String,
  type: String,
  target: String,
  amount: Number,
  progress: Number,
  reward: {
    coins: Number,
    xp: Number,
  },
  completed: Boolean,
  claimed: Boolean,
  description: String,
})

// Define the animal schema
const animalSchema = new mongoose.Schema({
  name: String,
  type: String,
  level: {
    type: Number,
    default: 1,
  },
  xp: {
    type: Number,
    default: 0,
  },
  health: {
    type: Number,
    default: 100,
  },
  maxHealth: {
    type: Number,
    default: 100,
  },
  strength: {
    type: Number,
    default: 10,
  },
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  trait: {
    type: String,
    enum: ["brave", "lazy", "curious", "smart", "loyal", "aggressive", "timid", "friendly"],
    default: "friendly",
  },
  lastTask: {
    type: Date,
    default: null,
  },
  taskType: {
    type: String,
    default: null,
  },
  taskEndTime: {
    type: Date,
    default: null,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})

// Define the farm structure schema
const farmStructureSchema = new mongoose.Schema({
  type: String,
  level: {
    type: Number,
    default: 1,
  },
  built: {
    type: Boolean,
    default: true,
  },
})

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  coins: {
    type: Number,
    default: 0,
  },
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  inventory: {
    type: [String],
    default: [],
  },
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  lastDaily: {
    type: Date,
    default: null,
  },
  lastBattle: {
    type: Date,
    default: null,
  },
  lastWork: {
    type: Date,
    default: null,
  },
  lastHunt: {
    type: Date,
    default: null,
  },
  lastGuess: {
    type: Date,
    default: null,
  },
  lastGamble: {
    type: Date,
    default: null,
  },
  lastQuiz: {
    type: Date,
    default: null,
  },
  lastGift: {
    type: Date,
    default: null,
  },
  lastBreed: {
    type: Date,
    default: null,
  },
  // Profile customization fields
  profile: {
    bio: {
      type: String,
      default: "No bio set yet.",
      maxlength: 200,
    },
    favoriteItem: {
      type: String,
      default: "None",
    },
    background: {
      type: String,
      default: "default", // Default background theme
    },
    title: {
      type: String,
      default: "Novice Trainer",
    },
  },
  // Mining system resources
  resources: {
    stone: { type: Number, default: 0 },
    iron: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    diamond: { type: Number, default: 0 },
    emerald: { type: Number, default: 0 },
    obsidian: { type: Number, default: 0 },
    crystal: { type: Number, default: 0 },
  },
  lastMine: {
    type: Date,
    default: null,
  },
  // Achievements system
  achievements: {
    type: [String],
    default: [],
  },
  // Quests system
  quests: {
    daily: {
      type: [questSchema],
      default: [],
    },
    weekly: {
      type: [questSchema],
      default: [],
    },
    lastDailyReset: {
      type: Date,
      default: null,
    },
    lastWeeklyReset: {
      type: Date,
      default: null,
    },
  },
  // Active effects from potions
  activeEffects: {
    type: [
      {
        type: String, // xpBoost, coinBoost, battleShield, etc.
        multiplier: Number, // For boosts
        expiresAt: Date,
      },
    ],
    default: [],
  },
  // Clan membership
  clanId: {
    type: String,
    default: null,
  },
  // Farm system
  farm: {
    level: {
      type: Number,
      default: 1,
    },
    animals: {
      type: [animalSchema],
      default: [],
    },
    structures: {
      type: [farmStructureSchema],
      default: [{ type: "animalHouse", level: 1 }],
    },
    lastUpgrade: {
      type: Date,
      default: null,
    },
  },
})

// Method to calculate XP needed for next level
userSchema.methods.getNextLevelXP = function () {
  return Math.floor(100 * Math.pow(1.5, this.level - 1))
}

// Method to check and update level if needed
userSchema.methods.checkLevelUp = async function () {
  const nextLevelXP = this.getNextLevelXP()
  let leveledUp = false

  while (this.xp >= nextLevelXP) {
    this.level += 1
    this.xp -= nextLevelXP
    leveledUp = true
  }

  if (leveledUp) {
    await this.save()
  }

  return leveledUp
}

// Method to add XP and check for level up
userSchema.methods.addXP = async function (amount) {
  // Check for active XP boost
  const xpBoost = this.activeEffects.find((effect) => effect.type === "xpBoost" && effect.expiresAt > new Date())

  // Apply XP boost if active
  if (xpBoost) {
    amount = Math.floor(amount * xpBoost.multiplier)
  }

  this.xp += amount
  return await this.checkLevelUp()
}

// Method to add coins with potential boost
userSchema.methods.addCoins = async function (amount) {
  // Check for active coin boost
  const coinBoost = this.activeEffects.find((effect) => effect.type === "coinBoost" && effect.expiresAt > new Date())

  // Apply coin boost if active
  if (coinBoost) {
    amount = Math.floor(amount * coinBoost.multiplier)
  }

  this.coins += amount
  return amount
}

// Method to check if cooldown has passed
userSchema.methods.cooldownPassed = function (cooldownField, cooldownHours) {
  if (!this[cooldownField]) return true

  const cooldownTime = new Date(this[cooldownField].getTime() + cooldownHours * 60 * 60 * 1000)
  return Date.now() > cooldownTime
}

// Method to check for active effect
userSchema.methods.hasActiveEffect = function (effectType) {
  return this.activeEffects.some((effect) => effect.type === effectType && effect.expiresAt > new Date())
}

// Method to add a resource
userSchema.methods.addResource = function (resource, amount) {
  if (this.resources[resource] !== undefined) {
    this.resources[resource] += amount
    return true
  }
  return false
}

// Method to check if user has completed an achievement
userSchema.methods.hasAchievement = function (achievementId) {
  return this.achievements.includes(achievementId)
}

// Method to add an achievement
userSchema.methods.addAchievement = function (achievementId) {
  if (!this.hasAchievement(achievementId)) {
    this.achievements.push(achievementId)
    return true
  }
  return false
}

// Method to update quest progress
userSchema.methods.updateQuestProgress = function (type, target, amount = 1) {
  let updated = false

  // Update daily quests
  this.quests.daily.forEach((quest) => {
    if (quest.type === type && quest.target === target && !quest.completed) {
      quest.progress += amount
      if (quest.progress >= quest.amount) {
        quest.completed = true
      }
      updated = true
    }
  })

  // Update weekly quests
  this.quests.weekly.forEach((quest) => {
    if (quest.type === type && quest.target === target && !quest.completed) {
      quest.progress += amount
      if (quest.progress >= quest.amount) {
        quest.completed = true
      }
      updated = true
    }
  })

  return updated
}

// Method to get max animals capacity based on farm level
userSchema.methods.getMaxAnimals = function () {
  // Base capacity is 5, +3 for each farm level
  const baseCapacity = 5
  const bonusCapacity = (this.farm.level - 1) * 3

  // Check for animal house structure
  const animalHouse = this.farm.structures.find((s) => s.type === "animalHouse")
  const houseBonus = animalHouse ? animalHouse.level * 2 : 0

  return baseCapacity + bonusCapacity + houseBonus
}

// Method to add an animal to the farm
userSchema.methods.addAnimal = function (animal) {
  // Check if farm has capacity
  if (this.farm.animals.length >= this.getMaxAnimals()) {
    return false
  }

  // Add animal to farm
  this.farm.animals.push(animal)
  return true
}

// Method to get selected animal
userSchema.methods.getSelectedAnimal = function () {
  return this.farm.animals.find((animal) => animal.isSelected)
}

// Method to select an animal
userSchema.methods.selectAnimal = function (animalName) {
  // Deselect all animals first
  this.farm.animals.forEach((animal) => {
    animal.isSelected = false
  })

  // Find and select the specified animal
  const animal = this.farm.animals.find((a) => a.name.toLowerCase() === animalName.toLowerCase())
  if (animal) {
    animal.isSelected = true
    return true
  }
  return false
}

// Method to calculate XP needed for animal's next level
userSchema.methods.getAnimalNextLevelXP = (animal) => Math.floor(50 * Math.pow(1.4, animal.level - 1))

// Method to add XP to an animal and check for level up
userSchema.methods.addAnimalXP = function (animal, amount) {
  // Apply farm level bonus (5% per level)
  const farmBonus = 1 + (this.farm.level - 1) * 0.05
  amount = Math.floor(amount * farmBonus)

  // Apply trait bonus
  if (animal.trait === "smart") {
    amount = Math.floor(amount * 1.2) // Smart animals learn faster
  }

  // Check for training ground structure
  const trainingGround = this.farm.structures.find((s) => s.type === "trainingGround")
  if (trainingGround) {
    amount = Math.floor(amount * (1 + trainingGround.level * 0.1))
  }

  animal.xp += amount

  // Check for level up
  const xpNeeded = this.getAnimalNextLevelXP(animal)
  let leveledUp = false

  while (animal.xp >= xpNeeded) {
    animal.level += 1
    animal.xp -= xpNeeded

    // Increase stats with level up
    animal.maxHealth += 5 + Math.floor(Math.random() * 6) // +5-10 health
    animal.health = animal.maxHealth // Heal to full on level up
    animal.strength += 2 + Math.floor(Math.random() * 4) // +2-5 strength

    leveledUp = true
  }

  return { leveledUp, amount }
}

// Method to heal an animal
userSchema.methods.healAnimal = function (animalName, amount) {
  const animal = this.farm.animals.find((a) => a.name.toLowerCase() === animalName.toLowerCase())
  if (!animal) return false

  // Check for feeding station structure
  const feedingStation = this.farm.structures.find((s) => s.type === "feedingStation")
  if (feedingStation) {
    amount = Math.floor(amount * (1 + feedingStation.level * 0.2))
  }

  animal.health = Math.min(animal.health + amount, animal.maxHealth)
  return true
}

// Method to check if animal is on a task
userSchema.methods.isAnimalOnTask = function (animalName) {
  const animal = this.farm.animals.find((a) => a.name.toLowerCase() === animalName.toLowerCase())
  if (!animal) return false

  return animal.taskEndTime && animal.taskEndTime > new Date()
}

// Method to send animal on a task
userSchema.methods.sendAnimalOnTask = function (animalName, taskType, durationMinutes) {
  const animal = this.farm.animals.find((a) => a.name.toLowerCase() === animalName.toLowerCase())
  if (!animal) return false

  // Check if animal is already on a task
  if (this.isAnimalOnTask(animalName)) return false

  // Set task details
  animal.lastTask = new Date()
  animal.taskType = taskType
  animal.taskEndTime = new Date(Date.now() + durationMinutes * 60 * 1000)

  return true
}

// Method to complete animal task and get rewards
userSchema.methods.completeAnimalTask = function (animalName) {
  const animal = this.farm.animals.find((a) => a.name.toLowerCase() === animalName.toLowerCase())
  if (!animal) return null

  // Check if task is completed
  if (!animal.taskEndTime || animal.taskEndTime > new Date()) return null

  // Calculate rewards based on task type, animal level, and traits
  const baseXP = 10 + animal.level * 2
  const baseCoins = 5 + animal.level

  let xpReward = baseXP
  let coinReward = baseCoins
  const itemRewards = []

  // Apply trait bonuses
  if (animal.trait === "curious" && animal.taskType === "explore") {
    xpReward = Math.floor(xpReward * 1.3) // Curious animals explore better
  } else if (animal.trait === "brave" && animal.taskType === "hunt") {
    coinReward = Math.floor(coinReward * 1.3) // Brave animals hunt better
  }

  // Task-specific rewards
  if (animal.taskType === "hunt") {
    // Chance to find items
    if (Math.random() < 0.3) {
      itemRewards.push("Potion")
    }
    if (Math.random() < 0.1) {
      itemRewards.push("Rare Candy")
    }
  } else if (animal.taskType === "mine") {
    // Add resources
    const stoneAmount = Math.floor(Math.random() * 5) + 1
    const ironAmount = Math.random() < 0.5 ? Math.floor(Math.random() * 3) + 1 : 0

    this.resources.stone += stoneAmount
    this.resources.iron += ironAmount

    itemRewards.push(`${stoneAmount} stone`)
    if (ironAmount > 0) {
      itemRewards.push(`${ironAmount} iron`)
    }
  } else if (animal.taskType === "explore") {
    // Higher chance for rare items
    if (Math.random() < 0.2) {
      itemRewards.push("Super Potion")
    }
    if (Math.random() < 0.05) {
      itemRewards.push("Ultra Ball")
    }
  }

  // Add XP to animal
  const xpResult = this.addAnimalXP(animal, xpReward)

  // Reset task
  animal.taskType = null
  animal.taskEndTime = null

  // Return rewards
  return {
    xp: xpResult.amount,
    coins: coinReward,
    items: itemRewards,
    leveledUp: xpResult.leveledUp,
  }
}

// Static method to find or create a user
userSchema.statics.findOrCreate = async function (userId, username) {
  let user = await this.findOne({ userId })

  if (!user) {
    user = new this({
      userId,
      username,
    })
    await user.save()
  }

  return user
}

module.exports = mongoose.model("User", userSchema)
