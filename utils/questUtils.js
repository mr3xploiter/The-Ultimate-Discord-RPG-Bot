const { v4: uuidv4 } = require("uuid")

// Quest types
const QUEST_TYPES = {
  BATTLE: "battle",
  COLLECT: "collect",
  EARN_XP: "earn_xp",
  EARN_COINS: "earn_coins",
  MINE: "mine",
  USE_ITEM: "use_item",
}

// Quest targets
const QUEST_TARGETS = {
  // Battle targets
  WIN: "win",
  PARTICIPATE: "participate",

  // Collect targets
  ANY_ITEM: "any_item",
  POTION: "Potion",
  SUPER_POTION: "Super Potion",
  POKEBALL: "Pokéball",

  // Resource targets
  STONE: "stone",
  IRON: "iron",
  GOLD: "gold",
  DIAMOND: "diamond",

  // Generic targets
  ANY: "any",
}

// Daily quest templates
const dailyQuestTemplates = [
  {
    type: QUEST_TYPES.BATTLE,
    target: QUEST_TARGETS.WIN,
    amount: 3,
    reward: { coins: 100, xp: 50 },
    description: "Win {amount} battles",
  },
  {
    type: QUEST_TYPES.COLLECT,
    target: QUEST_TARGETS.ANY_ITEM,
    amount: 5,
    reward: { coins: 75, xp: 30 },
    description: "Collect {amount} items",
  },
  {
    type: QUEST_TYPES.EARN_XP,
    target: QUEST_TARGETS.ANY,
    amount: 100,
    reward: { coins: 50, xp: 0 },
    description: "Earn {amount} XP",
  },
  {
    type: QUEST_TYPES.EARN_COINS,
    target: QUEST_TARGETS.ANY,
    amount: 200,
    reward: { coins: 0, xp: 50 },
    description: "Earn {amount} coins",
  },
  {
    type: QUEST_TYPES.MINE,
    target: QUEST_TARGETS.ANY,
    amount: 3,
    reward: { coins: 75, xp: 40 },
    description: "Mine {amount} times",
  },
  {
    type: QUEST_TYPES.MINE,
    target: QUEST_TARGETS.STONE,
    amount: 20,
    reward: { coins: 60, xp: 30 },
    description: "Collect {amount} stone",
  },
  {
    type: QUEST_TYPES.MINE,
    target: QUEST_TARGETS.IRON,
    amount: 10,
    reward: { coins: 80, xp: 40 },
    description: "Collect {amount} iron",
  },
]

// Weekly quest templates (more challenging)
const weeklyQuestTemplates = [
  {
    type: QUEST_TYPES.BATTLE,
    target: QUEST_TARGETS.WIN,
    amount: 10,
    reward: { coins: 300, xp: 150 },
    description: "Win {amount} battles",
  },
  {
    type: QUEST_TYPES.COLLECT,
    target: QUEST_TARGETS.ANY_ITEM,
    amount: 20,
    reward: { coins: 250, xp: 100 },
    description: "Collect {amount} items",
  },
  {
    type: QUEST_TYPES.EARN_XP,
    target: QUEST_TARGETS.ANY,
    amount: 500,
    reward: { coins: 200, xp: 0 },
    description: "Earn {amount} XP",
  },
  {
    type: QUEST_TYPES.EARN_COINS,
    target: QUEST_TARGETS.ANY,
    amount: 1000,
    reward: { coins: 0, xp: 200 },
    description: "Earn {amount} coins",
  },
  {
    type: QUEST_TYPES.MINE,
    target: QUEST_TARGETS.GOLD,
    amount: 15,
    reward: { coins: 300, xp: 120 },
    description: "Collect {amount} gold",
  },
  {
    type: QUEST_TYPES.MINE,
    target: QUEST_TARGETS.DIAMOND,
    amount: 5,
    reward: { coins: 400, xp: 150 },
    description: "Collect {amount} diamonds",
  },
]

/**
 * Generate a set of quests for a user
 * @param {string} type - 'daily' or 'weekly'
 * @param {number} count - Number of quests to generate
 * @returns {Array} - Array of quest objects
 */
function generateQuests(type, count = 3) {
  const templates = type === "daily" ? dailyQuestTemplates : weeklyQuestTemplates
  const quests = []

  // Shuffle templates to get random ones
  const shuffled = [...templates].sort(() => 0.5 - Math.random())

  // Take the first 'count' templates
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const template = shuffled[i]

    quests.push({
      id: uuidv4(),
      type: template.type,
      target: template.target,
      amount: template.amount,
      progress: 0,
      reward: { ...template.reward },
      completed: false,
      claimed: false,
      description: template.description.replace("{amount}", template.amount),
    })
  }

  return quests
}

/**
 * Check if quests need to be reset
 * @param {Object} user - User document from MongoDB
 * @returns {Object} - Object with resetDaily and resetWeekly flags
 */
function checkQuestResets(user) {
  const now = new Date()
  const result = { resetDaily: false, resetWeekly: false }

  // Check daily reset (24 hours)
  if (!user.quests.lastDailyReset || now - new Date(user.quests.lastDailyReset) > 24 * 60 * 60 * 1000) {
    result.resetDaily = true
  }

  // Check weekly reset (7 days)
  if (!user.quests.lastWeeklyReset || now - new Date(user.quests.lastWeeklyReset) > 7 * 24 * 60 * 60 * 1000) {
    result.resetWeekly = true
  }

  return result
}

/**
 * Reset quests for a user if needed
 * @param {Object} user - User document from MongoDB
 */
async function resetQuestsIfNeeded(user) {
  const { resetDaily, resetWeekly } = checkQuestResets(user)
  const now = new Date()
  let updated = false

  if (resetDaily) {
    user.quests.daily = generateQuests("daily", 3)
    user.quests.lastDailyReset = now
    updated = true
  }

  if (resetWeekly) {
    user.quests.weekly = generateQuests("weekly", 3)
    user.quests.lastWeeklyReset = now
    updated = true
  }

  if (updated) {
    await user.save()
  }

  return { resetDaily, resetWeekly }
}

/**
 * Get quest description
 * @param {Object} quest - Quest object
 * @returns {string} - Quest description
 */
function getQuestDescription(quest) {
  switch (quest.type) {
    case QUEST_TYPES.BATTLE:
      return quest.target === QUEST_TARGETS.WIN
        ? `Win ${quest.amount} battles`
        : `Participate in ${quest.amount} battles`

    case QUEST_TYPES.COLLECT:
      return quest.target === QUEST_TARGETS.ANY_ITEM
        ? `Collect ${quest.amount} items`
        : `Collect ${quest.amount} ${quest.target}`

    case QUEST_TYPES.EARN_XP:
      return `Earn ${quest.amount} XP`

    case QUEST_TYPES.EARN_COINS:
      return `Earn ${quest.amount} coins`

    case QUEST_TYPES.MINE:
      return quest.target === QUEST_TARGETS.ANY
        ? `Mine ${quest.amount} times`
        : `Collect ${quest.amount} ${quest.target}`

    case QUEST_TYPES.USE_ITEM:
      return `Use ${quest.amount} ${quest.target}`

    default:
      return `Complete quest: ${quest.progress}/${quest.amount}`
  }
}

/**
 * Update quest progress
 * @param {Object} user - User document from MongoDB
 * @param {string} type - Quest type
 * @param {string} target - Quest target
 * @param {number} amount - Amount to add to progress
 * @returns {boolean} - Whether any quests were updated
 */
function updateQuestProgress(user, type, target, amount = 1) {
  let updated = false

  // Helper function to update a single quest
  const updateQuest = (quest) => {
    if (quest.type === type && (quest.target === target || quest.target === "ANY") && !quest.completed) {
      quest.progress += amount
      if (quest.progress >= quest.amount) {
        quest.completed = true
      }
      return true
    }
    return false
  }

  // Update daily quests
  user.quests.daily.forEach((quest) => {
    if (updateQuest(quest)) {
      updated = true
    }
  })

  // Update weekly quests
  user.quests.weekly.forEach((quest) => {
    if (updateQuest(quest)) {
      updated = true
    }
  })

  return updated
}

module.exports = {
  QUEST_TYPES,
  QUEST_TARGETS,
  generateQuests,
  checkQuestResets,
  resetQuestsIfNeeded,
  getQuestDescription,
  updateQuestProgress,
}
