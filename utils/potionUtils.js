// Potion definitions
const potions = {
    XP_BOOST_SMALL: {
      id: "XP_BOOST_SMALL",
      name: "Small XP Boost",
      description: "Increases XP gain by 25% for 1 hour",
      effect: {
        type: "xpBoost",
        multiplier: 1.25,
        duration: 60 * 60 * 1000, // 1 hour in milliseconds
      },
      price: 150,
    },
    XP_BOOST_MEDIUM: {
      id: "XP_BOOST_MEDIUM",
      name: "Medium XP Boost",
      description: "Increases XP gain by 50% for 1 hour",
      effect: {
        type: "xpBoost",
        multiplier: 1.5,
        duration: 60 * 60 * 1000, // 1 hour in milliseconds
      },
      price: 300,
    },
    XP_BOOST_LARGE: {
      id: "XP_BOOST_LARGE",
      name: "Large XP Boost",
      description: "Doubles XP gain for 1 hour",
      effect: {
        type: "xpBoost",
        multiplier: 2.0,
        duration: 60 * 60 * 1000, // 1 hour in milliseconds
      },
      price: 500,
    },
    COIN_BOOST_SMALL: {
      id: "COIN_BOOST_SMALL",
      name: "Small Coin Boost",
      description: "Increases coin gain by 25% for 1 hour",
      effect: {
        type: "coinBoost",
        multiplier: 1.25,
        duration: 60 * 60 * 1000, // 1 hour in milliseconds
      },
      price: 150,
    },
    COIN_BOOST_MEDIUM: {
      id: "COIN_BOOST_MEDIUM",
      name: "Medium Coin Boost",
      description: "Increases coin gain by 50% for 1 hour",
      effect: {
        type: "coinBoost",
        multiplier: 1.5,
        duration: 60 * 60 * 1000, // 1 hour in milliseconds
      },
      price: 300,
    },
    COIN_BOOST_LARGE: {
      id: "COIN_BOOST_LARGE",
      name: "Large Coin Boost",
      description: "Doubles coin gain for 1 hour",
      effect: {
        type: "coinBoost",
        multiplier: 2.0,
        duration: 60 * 60 * 1000, // 1 hour in milliseconds
      },
      price: 500,
    },
    BATTLE_SHIELD: {
      id: "BATTLE_SHIELD",
      name: "Battle Shield",
      description: "Prevents loss of coins when losing battles for 2 hours",
      effect: {
        type: "battleShield",
        multiplier: 1.0,
        duration: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
      },
      price: 400,
    },
    LUCKY_CHARM: {
      id: "LUCKY_CHARM",
      name: "Lucky Charm",
      description: "Increases chance of rare finds when mining for 30 minutes",
      effect: {
        type: "luckyCharm",
        multiplier: 1.5,
        duration: 30 * 60 * 1000, // 30 minutes in milliseconds
      },
      price: 350,
    },
  }
  
  /**
   * Apply a potion effect to a user
   * @param {Object} user - User document from MongoDB
   * @param {string} potionId - ID of the potion to apply
   * @returns {Object|null} - Applied effect or null if potion not found
   */
  function applyPotion(user, potionId) {
    const potion = potions[potionId]
    if (!potion) return null
  
    // Check if user has the potion in inventory
    const potionIndex = user.inventory.indexOf(potion.name)
    if (potionIndex === -1) return null
  
    // Remove potion from inventory
    user.inventory.splice(potionIndex, 1)
  
    // Calculate expiry time
    const expiresAt = new Date(Date.now() + potion.effect.duration)
  
    // Check if user already has this effect
    const existingEffectIndex = user.activeEffects.findIndex((effect) => effect.type === potion.effect.type)
  
    if (existingEffectIndex !== -1) {
      // Replace existing effect
      user.activeEffects[existingEffectIndex] = {
        type: potion.effect.type,
        multiplier: potion.effect.multiplier,
        expiresAt,
      }
    } else {
      // Add new effect
      user.activeEffects.push({
        type: potion.effect.type,
        multiplier: potion.effect.multiplier,
        expiresAt,
      })
    }
  
    return {
      type: potion.effect.type,
      multiplier: potion.effect.multiplier,
      expiresAt,
    }
  }
  
  /**
   * Clean up expired effects
   * @param {Object} user - User document from MongoDB
   * @returns {number} - Number of effects removed
   */
  function cleanupExpiredEffects(user) {
    const now = new Date()
    const initialLength = user.activeEffects.length
  
    user.activeEffects = user.activeEffects.filter((effect) => effect.expiresAt > now)
  
    return initialLength - user.activeEffects.length
  }
  
  /**
   * Get all potions with availability status for a user
   * @param {Object} user - User document from MongoDB
   * @returns {Array} - Array of potions with availability status
   */
  function getUserPotions(user) {
    return Object.values(potions).map((potion) => ({
      ...potion,
      owned: user.inventory.filter((item) => item === potion.name).length,
    }))
  }
  
  module.exports = {
    potions,
    applyPotion,
    cleanupExpiredEffects,
    getUserPotions,
  }
  