import {
  type GameState,
  type GameMap,
  type Tile,
  type Camera,
  type TimeState,
  type EconomyState,
  type EventState,
  type MilestoneState,
  type PolicyState,
  type ChallengeState,
  type TechState,
  type SpecializationState,
  type StructureRegistry,
  type BuildingEffectState,
  TileType,
  TerrainType,
  ToolType,
  TimeSpeed,
  DemandLevel,
} from 'shared/types'
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  INITIAL_MONEY,
  EVENT_BASE_COOLDOWN,
} from '../config'
import { generateTerrainNoise } from '../utils/seeded-random'

function terrainFromNoise(value: number): TerrainType {
  if (value < 0.15) return TerrainType.Water
  if (value < 0.3) return TerrainType.Fertile
  if (value < 0.7) return TerrainType.Plain
  if (value < 0.85) return TerrainType.Rocky
  return TerrainType.Hill
}

function createEmptyMap(seed: number): GameMap {
  const noise = generateTerrainNoise(MAP_WIDTH, MAP_HEIGHT, seed)
  const tiles: Tile[][] = []
  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y] = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      const terrain = terrainFromNoise(noise[y][x])
      tiles[y][x] = {
        type: TileType.Empty,
        buildingId: 'empty',
        x,
        y,
        level: 0,
        connected: false,
        terrain,
      }
    }
  }
  return { width: MAP_WIDTH, height: MAP_HEIGHT, tiles }
}

export function createInitialCamera(): Camera {
  return {
    x: 0,
    y: 0,
    zoom: 1,
  }
}

function createInitialTime(): TimeState {
  return {
    day: 1,
    speed: TimeSpeed.Normal,
    tickAccumulator: 0,
  }
}

function createInitialEconomy(): EconomyState {
  return {
    income: 0,
    expenses: 0,
    population: 0,
    lastDayRevenue: 0,
    satisfaction: 75,
    populationCapacity: 0,
    resources: {
      labor: { supply: 0, demand: 0, ratio: 1 },
      goods: { supply: 0, demand: 0, ratio: 1 },
      services: { supply: 0, demand: 0, ratio: 1 },
    },
    demandIndicators: {
      residential: DemandLevel.Balanced,
      commercial: DemandLevel.Balanced,
      industrial: DemandLevel.Balanced,
    },
    efficiencyByType: {
      residential: 1,
      commercial: 1,
      industrial: 1,
    },
  }
}

function createInitialEvents(): EventState {
  return {
    activeEvents: [],
    eventCooldown: EVENT_BASE_COOLDOWN,
    eventHistory: [],
    unlockedEventIds: [],
  }
}

function createInitialMilestones(): MilestoneState {
  return {
    achieved: [],
    satisfactionStreak: 0,
    cumulativeIncome: 0,
    upgradeLv3Unlocked: false,
    pendingRewards: [],
  }
}

function createInitialPolicies(): PolicyState {
  return {
    activePolicies: [],
    cooldowns: {},
    unlockedPolicies: [],
  }
}

function createInitialChallenge(): ChallengeState {
  return {
    challengeMode: false,
    pendingCrisis: null,
    activeCrises: [],
    deficitDays: 0,
    lowSatisfactionDays: 0,
    gameOver: false,
    gameWon: false,
    winProgress: 0,
    score: 0,
  }
}

function createInitialTech(): TechState {
  return {
    researched: [],
    currentResearch: null,
    researchProgress: 0,
    dailyRP: 0,
    unlockedBuildings: [],
    unlockedPolicies: [],
    unlockedSpecializations: [],
    permanentMultipliers: {},
  }
}

function createInitialSpecialization(): SpecializationState {
  return {
    chosen: null,
    available: [],
  }
}

function createInitialStructures(): StructureRegistry {
  return {
    instances: {},
    tileToStructure: {},
  }
}

function createInitialBuildingEffects(): BuildingEffectState {
  return {
    tileEffects: {},
    globalSatisfactionMod: 0,
    incomeMultByCategory: {
      residential: 1,
      commercial: 1,
      industrial: 1,
      service: 1,
    },
    effMultByCategory: {
      residential: 1,
      commercial: 1,
      industrial: 1,
      service: 1,
    },
    totalMaintenance: 0,
    totalResearchPoints: 0,
    avgCrisisResistance: 0,
    resources: {
      laborSupply: 0,
      laborDemand: 0,
      laborFulfillment: 1,
      goodsSupply: 0,
      goodsDemand: 0,
      goodsFulfillment: 1,
      servicesSupply: 0,
      servicesDemand: 0,
      servicesFulfillment: 1,
    },
  }
}

export function createInitialState(): GameState {
  const mapSeed = Date.now()
  return {
    map: createEmptyMap(mapSeed),
    money: INITIAL_MONEY,
    currentTool: ToolType.Select,
    hoveredTile: null,
    selectedBuildingId: null,
    camera: createInitialCamera(),
    time: createInitialTime(),
    economy: createInitialEconomy(),
    populationFloat: 0,
    mapSeed,
    events: createInitialEvents(),
    milestones: createInitialMilestones(),
    policies: createInitialPolicies(),
    challenge: createInitialChallenge(),
    tech: createInitialTech(),
    specialization: createInitialSpecialization(),
    structures: createInitialStructures(),
    buildingEffects: createInitialBuildingEffects(),
    _derived: { mapStats: null },
  }
}
