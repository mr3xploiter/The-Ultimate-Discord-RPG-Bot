// Rank definitions with their XP thresholds, names, and emojis
const ranks = [
    { tier: 1, emoji: "🪨", name: "Stoneborn", xpNeeded: 0 },
    { tier: 2, emoji: "🌱", name: "Leafwalker", xpNeeded: 150 },
    { tier: 3, emoji: "🐾", name: "Beastling", xpNeeded: 400 },
    { tier: 4, emoji: "🔥", name: "Flareheart", xpNeeded: 700 },
    { tier: 5, emoji: "⚡", name: "Stormcaller", xpNeeded: 1100 },
    { tier: 6, emoji: "❄️", name: "Frostshade", xpNeeded: 1600 },
    { tier: 7, emoji: "🌌", name: "Voidstriker", xpNeeded: 2300 },
    { tier: 8, emoji: "💀", name: "Phantomblade", xpNeeded: 3200 },
    { tier: 9, emoji: "🦄", name: "Mythic Soul", xpNeeded: 4500 },
    { tier: 10, emoji: "🧿", name: "Immortal Flame", xpNeeded: 6000 },
    { tier: 11, emoji: "🪐", name: "Celestian Warden", xpNeeded: 8000 },
    { tier: 12, emoji: "🐉", name: "Draconian Deity", xpNeeded: 11000 },
    { tier: 13, emoji: "🕊️", name: "Astralborn", xpNeeded: 15000 },
    { tier: 14, emoji: "🧙", name: "Ethereal Sage", xpNeeded: 20000 },
    { tier: 15, emoji: "🌠", name: "Infinity Zenith", xpNeeded: 30000 },
    { tier: 16, emoji: "👑", name: "Omnilord", xpNeeded: 50000 },
  ]
  
  /**
   * Calculate total XP needed to reach a specific level from level 1
   * @param {number} level - Target level
   * @returns {number} - Total XP needed
   */
  function getTotalXPForLevel(level) {
    let totalXP = 0
    for (let i = 1; i < level; i++) {
      totalXP += Math.floor(100 * Math.pow(1.5, i - 1))
    }
    return totalXP
  }
  
  /**
   * Get user's rank based on their total XP
   * @param {Object} user - User document from MongoDB
   * @returns {Object} - Rank object with tier, emoji, name
   */
  function getUserRank(user) {
    // Calculate total XP (current XP + XP from previous levels)
    const totalXP = user.xp + getTotalXPForLevel(user.level)
  
    // Find the highest rank the user qualifies for
    let userRank = ranks[0] // Default to first rank
  
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (totalXP >= ranks[i].xpNeeded) {
        userRank = ranks[i]
        break
      }
    }
  
    return userRank
  }
  
  /**
   * Get the next rank for a user
   * @param {Object} user - User document from MongoDB
   * @returns {Object|null} - Next rank object or null if at max rank
   */
  function getNextRank(user) {
    const currentRank = getUserRank(user)
    const nextRankIndex = ranks.findIndex((rank) => rank.tier === currentRank.tier) + 1
  
    if (nextRankIndex < ranks.length) {
      return ranks[nextRankIndex]
    }
  
    return null // No next rank (at max rank)
  }
  
  /**
   * Calculate XP needed for next rank
   * @param {Object} user - User document from MongoDB
   * @returns {Object} - Object with current XP, XP needed, and percentage
   */
  function getXPProgressToNextRank(user) {
    const totalXP = user.xp + getTotalXPForLevel(user.level)
    const currentRank = getUserRank(user)
    const nextRank = getNextRank(user)
  
    if (!nextRank) {
      // At max rank
      return {
        currentXP: totalXP,
        neededXP: totalXP,
        percentage: 100,
      }
    }
  
    const xpForCurrentRank = currentRank.xpNeeded
    const xpForNextRank = nextRank.xpNeeded
    const xpNeeded = xpForNextRank - xpForCurrentRank
    const currentProgress = totalXP - xpForCurrentRank
    const percentage = Math.min(100, Math.floor((currentProgress / xpNeeded) * 100))
  
    return {
      currentXP: totalXP,
      currentProgress,
      xpNeeded,
      percentage,
    }
  }
  
  /**
   * Generate a progress bar for rank progress
   * @param {number} percentage - Percentage complete
   * @param {number} size - Size of the progress bar
   * @returns {string} - Progress bar string
   */
  function getRankProgressBar(percentage, size = 10) {
    const progress = Math.round((percentage / 100) * size)
    const emptyProgress = size - progress
  
    const progressText = "█".repeat(progress)
    const emptyProgressText = "░".repeat(emptyProgress)
  
    return `${progressText}${emptyProgressText}`
  }
  
  /**
   * Apply rank decay for inactive users
   * @param {Object} user - User document from MongoDB
   * @param {Date} currentDate - Current date
   * @returns {Object} - Object with decay applied flag and amount
   */
  function applyRankDecay(user, currentDate = new Date()) {
    // Check if lastActivity field exists
    if (!user.lastActivity) {
      user.lastActivity = currentDate
      return { applied: false, amount: 0 }
    }
  
    // Calculate days since last activity
    const daysSinceActivity = Math.floor((currentDate - user.lastActivity) / (1000 * 60 * 60 * 24))
  
    // Apply decay if inactive for 60 days or more
    if (daysSinceActivity >= 60) {
      // Calculate total XP
      const totalXP = user.xp + getTotalXPForLevel(user.level)
  
      // Calculate decay amount (10-25% of total XP)
      const decayPercentage = 0.1 + (Math.min(daysSinceActivity - 60, 60) / 60) * 0.15
      const decayAmount = Math.floor(totalXP * decayPercentage)
  
      // Apply decay
      const newTotalXP = Math.max(0, totalXP - decayAmount)
  
      // Recalculate level and XP
      let newLevel = 1
      let xpForLevel = 0
      let remainingXP = newTotalXP
  
      while (true) {
        const nextLevelXP = Math.floor(100 * Math.pow(1.5, newLevel - 1))
        if (remainingXP < nextLevelXP) break
  
        remainingXP -= nextLevelXP
        newLevel++
        xpForLevel = nextLevelXP
      }
  
      // Update user
      user.level = newLevel
      user.xp = remainingXP
      user.lastActivity = currentDate
  
      return { applied: true, amount: decayAmount }
    }
  
    // Update last activity date
    user.lastActivity = currentDate
    return { applied: false, amount: 0 }
  }
  
  module.exports = {
    ranks,
    getUserRank,
    getNextRank,
    getXPProgressToNextRank,
    getRankProgressBar,
    applyRankDecay,
  }
  