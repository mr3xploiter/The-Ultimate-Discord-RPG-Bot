/**
 * Calculate XP needed for a specific level
 * @param {number} level - Current level
 * @returns {number} - XP needed for next level
 */
function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

/**
 * Calculate total XP needed to reach a specific level from level 1
 * @param {number} level - Target level
 * @returns {number} - Total XP needed
 */
function getTotalXPForLevel(level) {
  let totalXP = 0
  for (let i = 1; i < level; i++) {
    totalXP += getXPForLevel(i)
  }
  return totalXP
}

/**
 * Generate a progress bar for XP
 * @param {number} currentXP - Current XP
 * @param {number} requiredXP - XP required for next level
 * @param {number} size - Size of the progress bar
 * @returns {string} - Progress bar string
 */
function getProgressBar(currentXP, requiredXP, size = 10) {
  const progress = Math.round((currentXP / requiredXP) * size)
  const emptyProgress = size - progress

  const progressText = "█".repeat(progress)
  const emptyProgressText = "░".repeat(emptyProgress)

  return `${progressText}${emptyProgressText}`
}

module.exports = {
  getXPForLevel,
  getTotalXPForLevel,
  getProgressBar,
}
