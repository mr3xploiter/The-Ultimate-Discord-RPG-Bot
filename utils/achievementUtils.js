// Achievement definitions
const achievements = {
    // Economy achievements
    FIRST_COINS: {
      id: "FIRST_COINS",
      name: "First Coins",
      description: "Earn your first coins",
      emoji: "💰",
      check: (user) => user.coins > 0,
      reward: { coins: 50, xp: 10 },
    },
    COIN_COLLECTOR: {
      id: "COIN_COLLECTOR",
      name: "Coin Collector",
      description: "Earn 1,000 coins in total",
      emoji: "🏆",
      check: (user) => user.coins >= 1000,
      reward: { coins: 200, xp: 50 },
    },
    COIN_HOARDER: {
      id: "COIN_HOARDER",
      name: "Coin Hoarder",
      description: "Earn 10,000 coins in total",
      emoji: "💎",
      check: (user) => user.coins >= 10000,
      reward: { coins: 500, xp: 100 },
    },
  
    // Level achievements
    LEVEL_5: {
      id: "LEVEL_5",
      name: "Apprentice",
      description: "Reach level 5",
      emoji: "🔥",
      check: (user) => user.level >= 5,
      reward: { coins: 100, xp: 0 },
    },
    LEVEL_10: {
      id: "LEVEL_10",
      name: "Journeyman",
      description: "Reach level 10",
      emoji: "⚡",
      check: (user) => user.level >= 10,
      reward: { coins: 250, xp: 0 },
    },
    LEVEL_25: {
      id: "LEVEL_25",
      name: "Master",
      description: "Reach level 25",
      emoji: "🌟",
      check: (user) => user.level >= 25,
      reward: { coins: 1000, xp: 0 },
    },
  
    // Battle achievements
    FIRST_WIN: {
      id: "FIRST_WIN",
      name: "First Victory",
      description: "Win your first battle",
      emoji: "⚔️",
      check: (user) => user.wins >= 1,
      reward: { coins: 50, xp: 20 },
    },
    BATTLE_VETERAN: {
      id: "BATTLE_VETERAN",
      name: "Battle Veteran",
      description: "Win 10 battles",
      emoji: "🛡️",
      check: (user) => user.wins >= 10,
      reward: { coins: 200, xp: 50 },
    },
    BATTLE_MASTER: {
      id: "BATTLE_MASTER",
      name: "Battle Master",
      description: "Win 50 battles",
      emoji: "👑",
      check: (user) => user.wins >= 50,
      reward: { coins: 500, xp: 100 },
    },
  
    // Collection achievements
    COLLECTOR: {
      id: "COLLECTOR",
      name: "Collector",
      description: "Have 10 items in your inventory",
      emoji: "🎒",
      check: (user) => user.inventory.length >= 10,
      reward: { coins: 100, xp: 30 },
    },
    HOARDER: {
      id: "HOARDER",
      name: "Hoarder",
      description: "Have 50 items in your inventory",
      emoji: "📦",
      check: (user) => user.inventory.length >= 50,
      reward: { coins: 300, xp: 75 },
    },
  
    // Mining achievements
    FIRST_MINE: {
      id: "FIRST_MINE",
      name: "First Mine",
      description: "Mine for the first time",
      emoji: "⛏️",
      check: (user) => user.lastMine !== null,
      reward: { coins: 50, xp: 20 },
    },
    STONE_COLLECTOR: {
      id: "STONE_COLLECTOR",
      name: "Stone Collector",
      description: "Collect 100 stone",
      emoji: "🪨",
      check: (user) => user.resources.stone >= 100,
      reward: { coins: 100, xp: 30 },
    },
    IRON_COLLECTOR: {
      id: "IRON_COLLECTOR",
      name: "Iron Collector",
      description: "Collect 50 iron",
      emoji: "⚙️",
      check: (user) => user.resources.iron >= 50,
      reward: { coins: 150, xp: 40 },
    },
    GOLD_COLLECTOR: {
      id: "GOLD_COLLECTOR",
      name: "Gold Collector",
      description: "Collect 25 gold",
      emoji: "🥇",
      check: (user) => user.resources.gold >= 25,
      reward: { coins: 200, xp: 50 },
    },
    DIAMOND_COLLECTOR: {
      id: "DIAMOND_COLLECTOR",
      name: "Diamond Collector",
      description: "Collect 10 diamonds",
      emoji: "💎",
      check: (user) => user.resources.diamond >= 10,
      reward: { coins: 300, xp: 75 },
    },
  
    // Clan achievements
    CLAN_MEMBER: {
      id: "CLAN_MEMBER",
      name: "Clan Member",
      description: "Join a clan",
      emoji: "🏰",
      check: (user) => user.clanId !== null,
      reward: { coins: 100, xp: 30 },
    },
  }
  
  /**
   * Check if a user has earned any new achievements
   * @param {Object} user - User document from MongoDB
   * @returns {Array} - Array of newly earned achievements
   */
  async function checkAchievements(user) {
    const newAchievements = []
  
    for (const [id, achievement] of Object.entries(achievements)) {
      // Skip if user already has this achievement
      if (user.hasAchievement(id)) continue
  
      // Check if user meets the requirements
      if (achievement.check(user)) {
        // Add achievement to user
        user.addAchievement(id)
  
        // Add rewards
        if (achievement.reward.coins) {
          user.coins += achievement.reward.coins
        }
  
        if (achievement.reward.xp) {
          await user.addXP(achievement.reward.xp)
        }
  
        newAchievements.push(achievement)
      }
    }
  
    if (newAchievements.length > 0) {
      await user.save()
    }
  
    return newAchievements
  }
  
  /**
   * Get all achievements with completion status for a user
   * @param {Object} user - User document from MongoDB
   * @returns {Array} - Array of achievements with completion status
   */
  function getUserAchievements(user) {
    return Object.values(achievements).map((achievement) => ({
      ...achievement,
      completed: user.hasAchievement(achievement.id),
    }))
  }
  
  module.exports = {
    achievements,
    checkAchievements,
    getUserAchievements,
  }
  