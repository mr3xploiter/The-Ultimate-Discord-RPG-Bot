// Animal types with their base stats
const animalTypes = {
    // Common animals (from hunting)
    RABBIT: {
      type: "Rabbit",
      emoji: "🐇",
      baseHealth: 80,
      baseStrength: 8,
      chance: 0.3,
      source: "hunt",
    },
    FOX: {
      type: "Fox",
      emoji: "🦊",
      baseHealth: 90,
      baseStrength: 12,
      chance: 0.2,
      source: "hunt",
    },
    DEER: {
      type: "Deer",
      emoji: "🦌",
      baseHealth: 100,
      baseStrength: 10,
      chance: 0.15,
      source: "hunt",
    },
    WOLF: {
      type: "Wolf",
      emoji: "🐺",
      baseHealth: 110,
      baseStrength: 15,
      chance: 0.1,
      source: "hunt",
    },
    BEAR: {
      type: "Bear",
      emoji: "🐻",
      baseHealth: 130,
      baseStrength: 18,
      chance: 0.05,
      source: "hunt",
    },
  
    // Common animals (from mining)
    MOLE: {
      type: "Mole",
      emoji: "🐀",
      baseHealth: 70,
      baseStrength: 9,
      chance: 0.25,
      source: "mine",
    },
    HEDGEHOG: {
      type: "Hedgehog",
      emoji: "🦔",
      baseHealth: 85,
      baseStrength: 11,
      chance: 0.15,
      source: "mine",
    },
    BAT: {
      type: "Bat",
      emoji: "🦇",
      baseHealth: 75,
      baseStrength: 10,
      chance: 0.1,
      source: "mine",
    },
  
    // Rare animals (from both)
    OWL: {
      type: "Owl",
      emoji: "🦉",
      baseHealth: 95,
      baseStrength: 14,
      chance: 0.08,
      source: "both",
    },
    EAGLE: {
      type: "Eagle",
      emoji: "🦅",
      baseHealth: 100,
      baseStrength: 16,
      chance: 0.05,
      source: "both",
    },
  
    // Mythical animals (special events or rituals)
    DRAGON: {
      type: "Dragon",
      emoji: "🐉",
      baseHealth: 200,
      baseStrength: 30,
      chance: 0.01,
      source: "special",
    },
    UNICORN: {
      type: "Unicorn",
      emoji: "🦄",
      baseHealth: 180,
      baseStrength: 25,
      chance: 0.01,
      source: "special",
    },
    PHOENIX: {
      type: "Phoenix",
      emoji: "🔥",
      baseHealth: 160,
      baseStrength: 28,
      chance: 0.01,
      source: "special",
    },
  }
  
  // Animal traits with their effects
  const animalTraits = [
    { name: "brave", description: "Increases strength in battles by 10%" },
    { name: "lazy", description: "Recovers health faster when resting" },
    { name: "curious", description: "Finds more items during exploration" },
    { name: "smart", description: "Gains 20% more XP" },
    { name: "loyal", description: "Increases coin rewards by 15%" },
    { name: "aggressive", description: "Deals 15% more damage but takes 10% more damage" },
    { name: "timid", description: "Takes 15% less damage but deals 10% less damage" },
    { name: "friendly", description: "Has a 10% chance to avoid battles entirely" },
  ]
  
  // Farm structures with their effects and costs
  const farmStructures = {
    ANIMAL_HOUSE: {
      type: "animalHouse",
      name: "Animal House",
      description: "Increases animal capacity by 2 per level",
      baseCost: 500,
      costMultiplier: 1.5,
      maxLevel: 5,
      requirements: {
        farmLevel: 1,
        resources: {
          stone: 50,
          wood: 30,
        },
      },
    },
    FEEDING_STATION: {
      type: "feedingStation",
      name: "Feeding Station",
      description: "Increases healing effectiveness by 20% per level",
      baseCost: 300,
      costMultiplier: 1.4,
      maxLevel: 3,
      requirements: {
        farmLevel: 2,
        resources: {
          stone: 30,
          iron: 15,
        },
      },
    },
    TRAINING_GROUND: {
      type: "trainingGround",
      name: "Training Ground",
      description: "Increases XP gain by 10% per level",
      baseCost: 600,
      costMultiplier: 1.6,
      maxLevel: 3,
      requirements: {
        farmLevel: 3,
        resources: {
          stone: 60,
          iron: 25,
          gold: 10,
        },
      },
    },
  }
  
  /**
   * Generate a random animal based on source (hunt or mine)
   * @param {string} source - "hunt" or "mine"
   * @param {number} farmLevel - User's farm level (affects rare animal chance)
   * @returns {Object|null} - Generated animal or null if no animal found
   */
  function generateRandomAnimal(source, farmLevel = 1) {
    // Increase chance based on farm level (5% per level)
    const luckBonus = (farmLevel - 1) * 0.05
  
    // Filter animals by source
    const availableAnimals = Object.values(animalTypes).filter(
      (animal) => animal.source === source || animal.source === "both",
    )
  
    // Add mythical animals if farm level is high enough
    if (farmLevel >= 5) {
      availableAnimals.push(...Object.values(animalTypes).filter((animal) => animal.source === "special"))
    }
  
    // Shuffle animals
    const shuffledAnimals = [...availableAnimals].sort(() => 0.5 - Math.random())
  
    // Try to find an animal based on chance
    for (const animal of shuffledAnimals) {
      if (Math.random() < animal.chance + luckBonus) {
        // Generate random trait
        const trait = animalTraits[Math.floor(Math.random() * animalTraits.length)].name
  
        // Generate random stat variations (±10%)
        const healthVariation = 0.9 + Math.random() * 0.2 // 0.9 to 1.1
        const strengthVariation = 0.9 + Math.random() * 0.2 // 0.9 to 1.1
  
        const health = Math.floor(animal.baseHealth * healthVariation)
        const strength = Math.floor(animal.baseStrength * strengthVariation)
  
        return {
          name: generateAnimalName(animal.type),
          type: animal.type,
          emoji: animal.emoji,
          level: 1,
          xp: 0,
          health,
          maxHealth: health,
          strength,
          trait,
          wins: 0,
          losses: 0,
          isSelected: false,
        }
      }
    }
  
    return null
  }
  
  /**
   * Generate a random name for an animal
   * @param {string} type - Animal type
   * @returns {string} - Generated name
   */
  function generateAnimalName(type) {
    const prefixes = ["Swift", "Brave", "Mighty", "Fluffy", "Shadow", "Thunder", "Mystic", "Wild", "Gentle", "Fierce"]
    const suffixes = ["Runner", "Hunter", "Jumper", "Paw", "Claw", "Fang", "Whisker", "Tail", "Heart", "Spirit"]
  
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  
    return `${prefix}${suffix}`
  }
  
  /**
   * Calculate farm upgrade cost
   * @param {number} currentLevel - Current farm level
   * @returns {number} - Cost to upgrade
   */
  function calculateFarmUpgradeCost(currentLevel) {
    return 500 * Math.pow(1.5, currentLevel - 1)
  }
  
  /**
   * Calculate structure upgrade cost
   * @param {string} structureType - Type of structure
   * @param {number} currentLevel - Current structure level
   * @returns {number} - Cost to upgrade
   */
  function calculateStructureUpgradeCost(structureType, currentLevel) {
    const structure = Object.values(farmStructures).find((s) => s.type === structureType)
    if (!structure) return 0
  
    return Math.floor(structure.baseCost * Math.pow(structure.costMultiplier, currentLevel - 1))
  }
  
  /**
   * Calculate animal battle power
   * @param {Object} animal - Animal object
   * @returns {number} - Battle power
   */
  function calculateAnimalBattlePower(animal) {
    let power = animal.strength * 2 + animal.level * 5 + animal.health / 10
  
    // Apply trait bonuses
    if (animal.trait === "brave") {
      power *= 1.1 // Brave animals are stronger
    } else if (animal.trait === "aggressive") {
      power *= 1.15 // Aggressive animals are stronger but more vulnerable
    } else if (animal.trait === "timid") {
      power *= 0.9 // Timid animals are weaker but more defensive
    }
  
    return Math.floor(power)
  }
  
  /**
   * Simulate animal battle
   * @param {Object} attacker - Attacking animal
   * @param {Object} defender - Defending animal
   * @returns {Object} - Battle result
   */
  function simulateAnimalBattle(attacker, defender) {
    // Calculate battle powers
    const attackerPower = calculateAnimalBattlePower(attacker)
    const defenderPower = calculateAnimalBattlePower(defender)
  
    // Calculate win chance (50% base + power difference influence)
    let winChance = 0.5 + (attackerPower - defenderPower) * 0.01
    winChance = Math.max(0.2, Math.min(0.8, winChance)) // Cap between 20% and 80%
  
    // Check for trait effects
    if (attacker.trait === "friendly" && Math.random() < 0.1) {
      // Friendly animals have a 10% chance to avoid battle
      return {
        avoided: true,
        winner: null,
        loser: null,
        attackerDamage: 0,
        defenderDamage: 0,
        xpGained: 5, // Small XP for trying
      }
    }
  
    // Determine winner
    const attackerWins = Math.random() < winChance
  
    // Calculate damage
    let attackerDamage = 0
    let defenderDamage = 0
  
    if (attackerWins) {
      // Attacker wins
      defenderDamage = Math.floor(attacker.strength * (1 + Math.random() * 0.5)) // 100-150% of strength
  
      // Apply trait modifiers
      if (attacker.trait === "aggressive") {
        defenderDamage = Math.floor(defenderDamage * 1.15) // Aggressive deals more damage
      }
      if (defender.trait === "timid") {
        defenderDamage = Math.floor(defenderDamage * 0.85) // Timid takes less damage
      }
  
      // Ensure minimum damage
      defenderDamage = Math.max(1, defenderDamage)
  
      // Calculate XP gained (based on defender's level and power)
      const xpGained = 10 + defender.level * 3 + Math.floor(defenderPower / 10)
  
      return {
        avoided: false,
        winner: attacker,
        loser: defender,
        attackerDamage,
        defenderDamage,
        xpGained,
      }
    } else {
      // Defender wins
      attackerDamage = Math.floor(defender.strength * (1 + Math.random() * 0.5)) // 100-150% of strength
  
      // Apply trait modifiers
      if (defender.trait === "aggressive") {
        attackerDamage = Math.floor(attackerDamage * 1.15) // Aggressive deals more damage
      }
      if (attacker.trait === "timid") {
        attackerDamage = Math.floor(attackerDamage * 0.85) // Timid takes less damage
      }
  
      // Ensure minimum damage
      attackerDamage = Math.max(1, attackerDamage)
  
      // Calculate XP gained (consolation XP for losing)
      const xpGained = 5 + Math.floor(defender.level / 2)
  
      return {
        avoided: false,
        winner: defender,
        loser: attacker,
        attackerDamage,
        defenderDamage,
        xpGained,
      }
    }
  }
  
  /**
   * Breed two animals to create offspring
   * @param {Object} parent1 - First parent animal
   * @param {Object} parent2 - Second parent animal
   * @returns {Object} - Offspring animal
   */
  function breedAnimals(parent1, parent2) {
    // Determine offspring type (50% chance for each parent's type)
    const offspringType = Math.random() < 0.5 ? parent1.type : parent2.type
  
    // Find base stats for the type
    const baseAnimal = Object.values(animalTypes).find((a) => a.type === offspringType)
  
    // If type not found, use average of parents
    const baseHealth = baseAnimal ? baseAnimal.baseHealth : Math.floor((parent1.maxHealth + parent2.maxHealth) / 2)
    const baseStrength = baseAnimal ? baseAnimal.baseStrength : Math.floor((parent1.strength + parent2.strength) / 2)
  
    // Calculate inherited stats (average of parents with slight variation)
    const healthVariation = 0.9 + Math.random() * 0.3 // 0.9 to 1.2
    const strengthVariation = 0.9 + Math.random() * 0.3 // 0.9 to 1.2
  
    const health = Math.floor(((parent1.maxHealth + parent2.maxHealth) / 2) * healthVariation)
    const strength = Math.floor(((parent1.strength + parent2.strength) / 2) * strengthVariation)
  
    // Determine trait (50% chance to inherit from either parent, 10% chance for random trait)
    let trait
    if (Math.random() < 0.1) {
      // Random trait
      trait = animalTraits[Math.floor(Math.random() * animalTraits.length)].name
    } else {
      // Inherit from parent
      trait = Math.random() < 0.5 ? parent1.trait : parent2.trait
    }
  
    // Determine emoji
    const emoji = baseAnimal ? baseAnimal.emoji : Math.random() < 0.5 ? parent1.emoji : parent2.emoji
  
    // Create offspring
    return {
      name: `Baby${offspringType}`, // Temporary name, user can rename
      type: offspringType,
      emoji,
      level: 1,
      xp: 0,
      health,
      maxHealth: health,
      strength,
      trait,
      wins: 0,
      losses: 0,
      isSelected: false,
    }
  }
  
  module.exports = {
    animalTypes,
    animalTraits,
    farmStructures,
    generateRandomAnimal,
    generateAnimalName,
    calculateFarmUpgradeCost,
    calculateStructureUpgradeCost,
    calculateAnimalBattlePower,
    simulateAnimalBattle,
    breedAnimals,
  }
  