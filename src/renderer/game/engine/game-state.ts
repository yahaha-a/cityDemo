import {
  type GameState,
  type GameMap,
  type Tile,
  type StateListener,
  type Camera,
  type TimeState,
  type EconomyState,
  type EventState,
  type MilestoneState,
  type SynergyState,
  type FacilityCoverageState,
  type PolicyState,
  type ChallengeState,
  type TechState,
  type SpecializationState,
  TileType,
  TerrainType,
  ToolType,
  TimeSpeed,
  DemandLevel,
} from 'shared/game-types'
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  INITIAL_MONEY,
  CAMERA_MIN_ZOOM,
  CAMERA_MAX_ZOOM,
  EVENT_BASE_COOLDOWN,
} from '../constants'
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

function createInitialCamera(): Camera {
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

function createInitialSynergy(): SynergyState {
  return {
    tileEffects: {},
    globalSatisfactionMod: 0,
    incomeMultByType: { residential: 1, commercial: 1, industrial: 1 },
    effMultByType: { residential: 1, commercial: 1, industrial: 1 },
  }
}

function createInitialFacilities(): FacilityCoverageState {
  return {
    coverage: {},
    totalMaintenance: 0,
    totalResearchPoints: 0,
    avgCrisisResistance: 0,
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

function createInitialState(): GameState {
  const mapSeed = Date.now()
  return {
    map: createEmptyMap(mapSeed),
    money: INITIAL_MONEY,
    currentTool: ToolType.Select,
    hoveredTile: null,
    camera: createInitialCamera(),
    time: createInitialTime(),
    economy: createInitialEconomy(),
    populationFloat: 0,
    mapSeed,
    events: createInitialEvents(),
    milestones: createInitialMilestones(),
    synergy: createInitialSynergy(),
    facilities: createInitialFacilities(),
    policies: createInitialPolicies(),
    challenge: createInitialChallenge(),
    tech: createInitialTech(),
    specialization: createInitialSpecialization(),
  }
}

/**
 * 游戏状态管理器 - 使用 pub/sub 模式
 * 兼容 React useSyncExternalStore
 */
export class GameStateManager {
  private state: GameState
  private listeners = new Set<StateListener>()

  constructor() {
    this.state = createInitialState()
  }

  getState(): GameState {
    return this.state
  }

  /** 获取快照 (useSyncExternalStore 兼容) */
  getSnapshot = (): GameState => {
    return this.state
  }

  /** 订阅状态变更 (useSyncExternalStore 兼容) */
  subscribe = (listener: StateListener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    // 创建新引用以触发 React 重渲染
    this.state = { ...this.state }
    for (const listener of this.listeners) {
      listener()
    }
  }

  setTool(tool: ToolType): void {
    if (this.state.currentTool === tool) return
    this.state.currentTool = tool
    this.notify()
  }

  setHoveredTile(tile: { x: number; y: number } | null): void {
    const prev = this.state.hoveredTile
    if (prev?.x === tile?.x && prev?.y === tile?.y) return
    this.state.hoveredTile = tile
    this.notify()
  }

  setTileAt(x: number, y: number, type: TileType, level = 1): void {
    const existing = this.state.map.tiles[y][x]
    this.state.map.tiles[y][x] = {
      type,
      x,
      y,
      level,
      connected: false,
      terrain: existing.terrain,
    }
    this.notify()
  }

  /** 设置瓦片但不触发通知（用于批量操作，调用方自行 notify） */
  setTileAtSilent(x: number, y: number, type: TileType, level = 1): void {
    const existing = this.state.map.tiles[y][x]
    this.state.map.tiles[y][x] = {
      type,
      x,
      y,
      level,
      connected: false,
      terrain: existing.terrain,
    }
  }

  /** 更新瓦片的连接状态 */
  setTileConnected(x: number, y: number, connected: boolean): void {
    const tile = this.state.map.tiles[y]?.[x]
    if (tile && tile.connected !== connected) {
      tile.connected = connected
      this.notify()
    }
  }

  /** 批量更新瓦片连接状态（接受坐标数组，避免字符串解析） */
  updateConnections(
    updates: Array<{ x: number; y: number; connected: boolean }>
  ): void {
    let changed = false
    for (const { x, y, connected } of updates) {
      const tile = this.state.map.tiles[y]?.[x]
      if (tile && tile.connected !== connected) {
        tile.connected = connected
        changed = true
      }
    }
    if (changed) {
      this.notify()
    }
  }

  /** 手动触发通知（用于批量操作后） */
  forceNotify(): void {
    this.notify()
  }

  spendMoney(amount: number): boolean {
    if (this.state.money < amount) return false
    this.state.money -= amount
    this.notify()
    return true
  }

  addMoney(amount: number): void {
    this.state.money = Math.max(0, this.state.money + amount)
    this.notify()
  }

  /** 修改资金但不触发通知（用于批量操作，调用方自行 notify） */
  addMoneySilent(amount: number): void {
    this.state.money = Math.max(0, this.state.money + amount)
  }

  getTileAt(x: number, y: number): Tile | null {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return null
    return this.state.map.tiles[y][x]
  }

  // 相机控制方法（静默更新，不触发 React 重渲染）
  panCamera(dx: number, dy: number): void {
    const cam = this.state.camera
    this.state.camera = {
      x: cam.x + dx,
      y: cam.y + dy,
      zoom: cam.zoom,
    }
  }

  setZoom(zoom: number, pivotX?: number, pivotY?: number): void {
    const { camera } = this.state
    const newZoom = Math.max(CAMERA_MIN_ZOOM, Math.min(CAMERA_MAX_ZOOM, zoom))
    if (newZoom === camera.zoom) return

    if (pivotX !== undefined && pivotY !== undefined) {
      const zoomRatio = newZoom / camera.zoom
      const newX = pivotX - (pivotX - camera.x) * zoomRatio
      const newY = pivotY - (pivotY - camera.y) * zoomRatio
      this.state.camera = { x: newX, y: newY, zoom: newZoom }
    } else {
      this.state.camera = { ...camera, zoom: newZoom }
    }
  }

  getCamera(): Camera {
    return this.state.camera
  }

  resetCamera(): void {
    this.state.camera = createInitialCamera()
  }

  // 时间控制方法
  setTimeSpeed(speed: TimeSpeed): void {
    if (this.state.time.speed === speed) return
    this.state.time = { ...this.state.time, speed }
    this.notify()
  }

  advanceDay(): void {
    this.state.time = {
      ...this.state.time,
      day: this.state.time.day + 1,
      tickAccumulator: 0,
    }
    this.notify()
  }

  setTickAccumulator(value: number): void {
    this.state.time.tickAccumulator = value
  }

  // 经济状态更新
  updateEconomy(economy: Partial<EconomyState>): void {
    this.state.economy = { ...this.state.economy, ...economy }
    this.notify()
  }

  setPopulationFloat(value: number): void {
    this.state.populationFloat = value
  }

  /** 升级瓦片等级 */
  upgradeTileLevel(x: number, y: number): void {
    const tile = this.state.map.tiles[y]?.[x]
    if (tile) {
      tile.level += 1
      this.notify()
    }
  }

  /** 更新事件状态 */
  updateEvents(events: EventState): void {
    this.state.events = events
    this.notify()
  }

  /** 更新事件状态（不触发通知） */
  updateEventsSilent(events: EventState): void {
    this.state.events = events
  }

  /** 更新里程碑状态 */
  updateMilestones(milestones: MilestoneState): void {
    this.state.milestones = milestones
    this.notify()
  }

  /** 从完整状态恢复（用于存档加载） */
  loadState(state: GameState): void {
    this.state = state
    this.notify()
  }

  /** 更新协同状态 */
  updateSynergy(synergy: SynergyState): void {
    this.state.synergy = synergy
  }

  /** 更新设施覆盖状态 */
  updateFacilities(facilities: FacilityCoverageState): void {
    this.state.facilities = facilities
  }

  /** 更新政策状态 */
  updatePolicies(policies: PolicyState): void {
    this.state.policies = policies
    this.notify()
  }

  /** 更新危机/挑战状态 */
  updateChallenge(challenge: ChallengeState): void {
    this.state.challenge = challenge
    this.notify()
  }

  /** 更新危机/挑战状态（不触发通知） */
  updateChallengeSilent(challenge: ChallengeState): void {
    this.state.challenge = challenge
  }

  /** 更新科技状态 */
  updateTech(tech: TechState): void {
    this.state.tech = tech
    this.notify()
  }

  /** 更新科技状态（不触发通知） */
  updateTechSilent(tech: TechState): void {
    this.state.tech = tech
  }

  /** 更新城市特色状态 */
  updateSpecialization(specialization: SpecializationState): void {
    this.state.specialization = specialization
    this.notify()
  }

  /** 重置游戏 */
  resetGame(): void {
    this.state = createInitialState()
    this.notify()
  }
}
