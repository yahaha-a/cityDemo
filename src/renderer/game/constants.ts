import {
  TileType,
  TerrainType,
  type BuildingCosts,
  type Milestone,
  type EventModifierTarget,
  type SynergyRule,
  type FacilityTemplate,
  type PolicyTemplate,
  type CrisisTemplate,
  type TechNode,
  type SpecializationTemplate,
} from 'shared/game-types'

/** 地图尺寸 */
export const MAP_WIDTH = 64
export const MAP_HEIGHT = 64

/** 瓦片尺寸 (等距 2:1 比例) */
export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32

/** 初始资金 */
export const INITIAL_MONEY = 10000

/** 相机配置 */
export const CAMERA_MIN_ZOOM = 0.25
export const CAMERA_MAX_ZOOM = 2.0
export const CAMERA_ZOOM_SPEED = 0.1
export const CAMERA_PAN_SPEED = 10

/** 时间配置 (毫秒) */
export const DAY_DURATION_MS = 3000 // 一天持续 3 秒
export const TIME_SPEED_MULTIPLIERS = [0, 1, 3, 8] // 暂停/正常/快速/超快

/** 经济配置 - 供需系统 */

// 人口容量
export const POP_CAPACITY_PER_RESIDENTIAL = 8

// 资源产出/消耗（每栋建筑每日）
export const LABOR_PER_POP = 1.0
export const SERVICES_DEMAND_PER_POP = 0.5

export const SERVICES_PER_COMMERCIAL = 6.0
export const GOODS_DEMAND_PER_COMMERCIAL = 4.0
export const LABOR_DEMAND_PER_COMMERCIAL = 3.0

export const GOODS_PER_INDUSTRIAL = 6.0
export const LABOR_DEMAND_PER_INDUSTRIAL = 4.0

// 收入（100%效率时）
export const BASE_RESIDENTIAL_TAX = 3
export const BASE_COMMERCIAL_INCOME = 15
export const BASE_INDUSTRIAL_INCOME = 10

// 人口动态
export const NEUTRAL_SATISFACTION = 50
export const MAX_GROWTH_RATE = 0.05
export const MAX_DECLINE_RATE = 0.03
export const SATISFACTION_SMOOTHING = 0.3
export const INITIAL_POP_SEED = 2

// 满意度权重（和为1）
export const SAT_WEIGHT_SERVICES = 0.35
export const SAT_WEIGHT_EMPLOYMENT = 0.3
export const SAT_WEIGHT_GOODS = 0.2
export const SAT_WEIGHT_BALANCE = 0.15

export const ROAD_MAINTENANCE_COST = 1 // 每条道路每日维护费

/** 建筑成本 */
export const BUILDING_COSTS: BuildingCosts = {
  [TileType.Road]: 10,
  [TileType.Residential]: 100,
  [TileType.Commercial]: 150,
  [TileType.Industrial]: 200,
}

/** 建筑高度 (像素) */
export const BUILDING_HEIGHTS: Record<TileType, number> = {
  [TileType.Empty]: 0,
  [TileType.Road]: 0,
  [TileType.Residential]: 32,
  [TileType.Commercial]: 40,
  [TileType.Industrial]: 28,
  [TileType.Park]: 10,
  [TileType.School]: 36,
  [TileType.Hospital]: 44,
  [TileType.FireStation]: 32,
  [TileType.PoliceStation]: 32,
  [TileType.PowerPlant]: 48,
}

/** 瓦片颜色 */
export const TILE_COLORS: Record<
  TileType,
  { top: string; left: string; right: string }
> = {
  [TileType.Empty]: {
    top: '#4ade80',
    left: '#22c55e',
    right: '#16a34a',
  },
  [TileType.Road]: {
    top: '#9ca3af',
    left: '#6b7280',
    right: '#4b5563',
  },
  [TileType.Residential]: {
    top: '#60a5fa',
    left: '#3b82f6',
    right: '#2563eb',
  },
  [TileType.Commercial]: {
    top: '#facc15',
    left: '#eab308',
    right: '#ca8a04',
  },
  [TileType.Industrial]: {
    top: '#f87171',
    left: '#ef4444',
    right: '#dc2626',
  },
  [TileType.Park]: {
    top: '#34d399',
    left: '#10b981',
    right: '#059669',
  },
  [TileType.School]: {
    top: '#a78bfa',
    left: '#8b5cf6',
    right: '#7c3aed',
  },
  [TileType.Hospital]: {
    top: '#f9a8d4',
    left: '#f472b6',
    right: '#ec4899',
  },
  [TileType.FireStation]: {
    top: '#fb923c',
    left: '#f97316',
    right: '#ea580c',
  },
  [TileType.PoliceStation]: {
    top: '#67e8f9',
    left: '#22d3ee',
    right: '#06b6d4',
  },
  [TileType.PowerPlant]: {
    top: '#fbbf24',
    left: '#d97706',
    right: '#b45309',
  },
}

/** 悬停高亮色 */
export const HOVER_COLOR = 'rgba(255, 255, 255, 0.3)'

/** 无效放置高亮色 */
export const INVALID_COLOR = 'rgba(255, 0, 0, 0.3)'

/** 拆除退款比例 */
export const DEMOLISH_REFUND_RATIO = 0.5

/** 工具显示名称 */
export const TOOL_LABELS: Record<string, string> = {
  select: '选择',
  road: '道路',
  residential: '住宅',
  commercial: '商业',
  industrial: '工业',
  park: '公园',
  school: '学校',
  hospital: '医院',
  fire_station: '消防局',
  police_station: '警察局',
  power_plant: '发电厂',
  demolish: '拆除',
  upgrade: '升级',
}

/** 瓦片类型显示名称 */
export const TILE_LABELS: Record<TileType, string> = {
  [TileType.Empty]: '空地',
  [TileType.Road]: '道路',
  [TileType.Residential]: '住宅',
  [TileType.Commercial]: '商业',
  [TileType.Industrial]: '工业',
  [TileType.Park]: '公园',
  [TileType.School]: '学校',
  [TileType.Hospital]: '医院',
  [TileType.FireStation]: '消防局',
  [TileType.PoliceStation]: '警察局',
  [TileType.PowerPlant]: '发电厂',
}

// === 地形系统常量 ===

/** 地形建造成本乘数 */
export const TERRAIN_BUILD_COST_MULTIPLIER: Record<TerrainType, number> = {
  [TerrainType.Plain]: 1,
  [TerrainType.Hill]: 2,
  [TerrainType.Water]: Number.POSITIVE_INFINITY,
  [TerrainType.Fertile]: 1,
  [TerrainType.Rocky]: 1.3,
}

/** 地形工业产出乘数 */
export const TERRAIN_INDUSTRIAL_OUTPUT_MULTIPLIER: Record<TerrainType, number> =
  {
    [TerrainType.Plain]: 1,
    [TerrainType.Hill]: 1,
    [TerrainType.Water]: 1,
    [TerrainType.Fertile]: 1.5,
    [TerrainType.Rocky]: 1,
  }

/** 水域相邻住宅满意度加成 */
export const WATER_ADJACENCY_SATISFACTION_BONUS = 3

/** 地形颜色 */
export const TERRAIN_COLORS: Record<
  TerrainType,
  { top: string; left: string; right: string }
> = {
  [TerrainType.Plain]: {
    top: '#4ade80',
    left: '#22c55e',
    right: '#16a34a',
  },
  [TerrainType.Hill]: {
    top: '#a8a29e',
    left: '#78716c',
    right: '#57534e',
  },
  [TerrainType.Water]: {
    top: '#38bdf8',
    left: '#0ea5e9',
    right: '#0284c7',
  },
  [TerrainType.Fertile]: {
    top: '#a3e635',
    left: '#84cc16',
    right: '#65a30d',
  },
  [TerrainType.Rocky]: {
    top: '#d6d3d1',
    left: '#a8a29e',
    right: '#78716c',
  },
}

/** 地形中文名称 */
export const TERRAIN_LABELS: Record<TerrainType, string> = {
  [TerrainType.Plain]: '平原',
  [TerrainType.Hill]: '丘陵',
  [TerrainType.Water]: '水域',
  [TerrainType.Fertile]: '沃土',
  [TerrainType.Rocky]: '岩地',
}

// === 建筑升级常量 ===

export const MAX_BUILDING_LEVEL = 3
export const LEVEL_CAPACITY_MULTIPLIER = [1, 1.8, 3.0]
export const LEVEL_OUTPUT_MULTIPLIER = [1, 1.8, 3.0]
export const LEVEL_DEMAND_MULTIPLIER = [1, 1.5, 2.2]
export const LEVEL_INCOME_MULTIPLIER = [1, 2.0, 3.5]
/** 升级到 Lv N 的成本 = baseCost × 此值 */
export const UPGRADE_COST_MULTIPLIER = [0, 1.5, 3.0]
export const UPGRADE_MIN_EFFICIENCY = 0.6
export const LEVEL_HEIGHT_MULTIPLIER = [1, 1.5, 2.2]

// === 事件系统常量 ===

export const EVENT_BASE_COOLDOWN = 30
export const EVENT_COOLDOWN_VARIANCE = 10
export const EVENT_HISTORY_SIZE = 3

export interface EventTemplate {
  id: string
  name: string
  description: string
  minDay: number
  durationMin: number
  durationMax: number
  modifiers: Array<{ target: EventModifierTarget; multiplier: number }>
  unlockedByDefault: boolean
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'trade_boom',
    name: '贸易繁荣',
    description: '商品需求暴增，商业利润翻倍',
    minDay: 10,
    durationMin: 8,
    durationMax: 12,
    modifiers: [
      { target: 'goodsDemandMultiplier', multiplier: 1.5 },
      { target: 'incomeMultiplier', multiplier: 1.3 },
    ],
    unlockedByDefault: true,
  },
  {
    id: 'labor_shortage',
    name: '劳动力短缺',
    description: '工人罢工，劳动力供给减少',
    minDay: 15,
    durationMin: 8,
    durationMax: 15,
    modifiers: [{ target: 'laborSupplyMultiplier', multiplier: 0.7 }],
    unlockedByDefault: true,
  },
  {
    id: 'road_decay',
    name: '道路老化',
    description: '基础设施维护费用激增',
    minDay: 20,
    durationMin: 10,
    durationMax: 15,
    modifiers: [{ target: 'roadMaintenanceMultiplier', multiplier: 2.5 }],
    unlockedByDefault: true,
  },
  {
    id: 'industrial_boom',
    name: '工业革命',
    description: '新技术提升工业产出',
    minDay: 25,
    durationMin: 10,
    durationMax: 15,
    modifiers: [{ target: 'goodsSupplyMultiplier', multiplier: 1.5 }],
    unlockedByDefault: true,
  },
  {
    id: 'service_demand',
    name: '服务热潮',
    description: '市民对服务需求大增',
    minDay: 15,
    durationMin: 8,
    durationMax: 12,
    modifiers: [{ target: 'servicesDemandMultiplier', multiplier: 1.5 }],
    unlockedByDefault: true,
  },
  {
    id: 'golden_age',
    name: '黄金时代',
    description: '城市进入繁荣期，收入大幅增长',
    minDay: 50,
    durationMin: 10,
    durationMax: 15,
    modifiers: [
      { target: 'incomeMultiplier', multiplier: 2.0 },
      { target: 'laborSupplyMultiplier', multiplier: 1.2 },
    ],
    unlockedByDefault: false,
  },
  {
    id: 'economic_crisis',
    name: '经济危机',
    description: '全面衰退，所有供给下降',
    minDay: 60,
    durationMin: 10,
    durationMax: 15,
    modifiers: [
      { target: 'goodsSupplyMultiplier', multiplier: 0.6 },
      { target: 'servicesSupplyMultiplier', multiplier: 0.6 },
      { target: 'incomeMultiplier', multiplier: 0.5 },
    ],
    unlockedByDefault: false,
  },
]

// === 里程碑系统常量 ===

export const SATISFACTION_STREAK_THRESHOLD = 70

export const MILESTONES: Milestone[] = [
  {
    id: 'pop_50',
    name: '初具规模',
    description: '人口达到 50',
    condition: { type: 'population', threshold: 50 },
    reward: { type: 'bonus_money', value: 500 },
  },
  {
    id: 'pop_100',
    name: '小镇崛起',
    description: '人口达到 100',
    condition: { type: 'population', threshold: 100 },
    reward: { type: 'bonus_money', value: 1500 },
  },
  {
    id: 'pop_300',
    name: '城市雏形',
    description: '人口达到 300',
    condition: { type: 'population', threshold: 300 },
    reward: { type: 'bonus_money', value: 5000 },
  },
  {
    id: 'happy_7',
    name: '安居乐业',
    description: '满意度连续 7 天 >=70',
    condition: { type: 'satisfaction_streak', threshold: 70, streakDays: 7 },
    reward: { type: 'unlock_upgrade_lv3' },
  },
  {
    id: 'happy_14',
    name: '幸福之城',
    description: '满意度连续 14 天 >=70',
    condition: { type: 'satisfaction_streak', threshold: 70, streakDays: 14 },
    reward: { type: 'unlock_event', eventId: 'golden_age' },
  },
  {
    id: 'income_5000',
    name: '日进斗金',
    description: '累计收入达到 5000',
    condition: { type: 'total_income', threshold: 5000 },
    reward: { type: 'bonus_money', value: 2000 },
  },
  {
    id: 'income_20000',
    name: '富甲一方',
    description: '累计收入达到 20000',
    condition: { type: 'total_income', threshold: 20000 },
    reward: { type: 'unlock_event', eventId: 'economic_crisis' },
  },
  {
    id: 'buildings_20',
    name: '建筑大师',
    description: '拥有 20 栋建筑（不含道路）',
    condition: { type: 'building_count', threshold: 20 },
    reward: { type: 'bonus_money', value: 1000 },
  },
  {
    id: 'day_50',
    name: '半百之城',
    description: '城市存续 50 天',
    condition: { type: 'day_reached', threshold: 50 },
    reward: { type: 'bonus_money', value: 3000 },
  },
  {
    id: 'day_100',
    name: '百日庆典',
    description: '城市存续 100 天',
    condition: { type: 'day_reached', threshold: 100 },
    reward: { type: 'bonus_money', value: 8000 },
  },
]

// === 邻接协同系统常量 ===

export const SYNERGY_RULES: SynergyRule[] = [
  {
    id: 'industrial_pollution',
    sourceTileType: TileType.Industrial,
    targetTileType: TileType.Residential,
    radius: 3,
    effect: { type: 'satisfaction', value: -5 },
    maxStacks: 3,
  },
  {
    id: 'commercial_convenience',
    sourceTileType: TileType.Commercial,
    targetTileType: TileType.Residential,
    radius: 2,
    effect: { type: 'income_multiplier', value: 1.15 },
    maxStacks: 2,
  },
  {
    id: 'supply_chain',
    sourceTileType: TileType.Industrial,
    targetTileType: TileType.Commercial,
    radius: 3,
    effect: { type: 'efficiency_multiplier', value: 1.1 },
    maxStacks: 2,
  },
  {
    id: 'residential_cluster',
    sourceTileType: TileType.Residential,
    targetTileType: TileType.Residential,
    radius: 1,
    effect: { type: 'satisfaction', value: 2 },
    maxStacks: 4,
  },
  {
    id: 'industrial_cluster',
    sourceTileType: TileType.Industrial,
    targetTileType: TileType.Industrial,
    radius: 2,
    effect: { type: 'efficiency_multiplier', value: 1.08 },
    maxStacks: 3,
  },
]

// === 区域设施系统常量 ===

export const FACILITY_TEMPLATES: FacilityTemplate[] = [
  {
    tileType: TileType.Park,
    name: '公园',
    buildCost: 300,
    maintenanceCost: 5,
    radius: 3,
    effects: [
      { type: 'satisfaction', value: 8, targetTileType: TileType.Residential },
    ],
    unlockTech: 'urban_planning',
  },
  {
    tileType: TileType.School,
    name: '学校',
    buildCost: 500,
    maintenanceCost: 10,
    radius: 4,
    effects: [
      {
        type: 'income_multiplier',
        value: 1.2,
        targetTileType: TileType.Residential,
      },
      { type: 'research_points', value: 3 },
    ],
    unlockTech: 'basic_education',
  },
  {
    tileType: TileType.Hospital,
    name: '医院',
    buildCost: 800,
    maintenanceCost: 15,
    radius: 5,
    effects: [
      { type: 'satisfaction', value: 6 },
      { type: 'crisis_resistance', value: 0.3 },
      {
        type: 'capacity_multiplier',
        value: 1.1,
        targetTileType: TileType.Residential,
      },
    ],
    unlockTech: 'public_health',
  },
  {
    tileType: TileType.FireStation,
    name: '消防局',
    buildCost: 400,
    maintenanceCost: 8,
    radius: 5,
    effects: [{ type: 'crisis_resistance', value: 0.4 }],
    unlockTech: 'basic_infrastructure',
  },
  {
    tileType: TileType.PoliceStation,
    name: '警察局',
    buildCost: 400,
    maintenanceCost: 8,
    radius: 4,
    effects: [
      {
        type: 'efficiency_multiplier',
        value: 1.1,
        targetTileType: TileType.Commercial,
      },
      { type: 'crisis_resistance', value: 0.3 },
    ],
    unlockTech: 'law_enforcement',
  },
  {
    tileType: TileType.PowerPlant,
    name: '发电厂',
    buildCost: 1000,
    maintenanceCost: 20,
    radius: 4,
    effects: [
      {
        type: 'efficiency_multiplier',
        value: 1.3,
        targetTileType: TileType.Industrial,
      },
      {
        type: 'satisfaction',
        value: -10,
        targetTileType: TileType.Residential,
      },
    ],
    unlockTech: 'power_grid',
  },
]

export function getFacilityTemplate(
  tileType: TileType
): FacilityTemplate | undefined {
  return FACILITY_TEMPLATES.find(t => t.tileType === tileType)
}

// === 政策系统常量 ===

export const MAX_ACTIVE_POLICIES = 5
export const POLICY_DEFAULT_COOLDOWN = 5

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'high_tax',
    name: '高税收',
    category: '经济',
    effects: [
      { type: 'income_multiplier', value: 1.4 },
      { type: 'satisfaction', value: -12 },
      { type: 'growth_multiplier', value: 0.8 },
    ],
    exclusiveWith: ['low_tax'],
    cooldownDays: 5,
  },
  {
    id: 'low_tax',
    name: '低税收',
    category: '经济',
    effects: [
      { type: 'satisfaction', value: 8 },
      { type: 'growth_multiplier', value: 1.5 },
      { type: 'income_multiplier', value: 0.7 },
    ],
    exclusiveWith: ['high_tax'],
    cooldownDays: 5,
  },
  {
    id: 'industrial_subsidy',
    name: '工业补贴',
    category: '经济',
    effects: [
      { type: 'industrial_multiplier', value: 1.25 },
      { type: 'expense_multiplier', value: 1.15 },
    ],
    exclusiveWith: ['commercial_subsidy'],
    cooldownDays: 5,
  },
  {
    id: 'commercial_subsidy',
    name: '商业补贴',
    category: '经济',
    effects: [
      { type: 'commercial_multiplier', value: 1.25 },
      { type: 'expense_multiplier', value: 1.15 },
    ],
    exclusiveWith: ['industrial_subsidy'],
    cooldownDays: 5,
  },
  {
    id: 'public_housing',
    name: '公共住房',
    category: '社会',
    effects: [
      { type: 'capacity_multiplier', value: 1.3 },
      { type: 'expense_multiplier', value: 1.2 },
    ],
    exclusiveWith: [],
    cooldownDays: 5,
  },
  {
    id: 'education_mandate',
    name: '教育强制令',
    category: '社会',
    effects: [
      { type: 'research_multiplier', value: 1.5 },
      { type: 'satisfaction', value: -5 },
    ],
    exclusiveWith: [],
    cooldownDays: 5,
  },
  {
    id: 'road_investment',
    name: '道路投资',
    category: '基建',
    effects: [
      { type: 'road_maintenance_multiplier', value: 0.5 },
      { type: 'build_cost_multiplier', value: 1.15 },
    ],
    exclusiveWith: [],
    cooldownDays: 5,
  },
  {
    id: 'green_city',
    name: '绿色城市',
    category: '环境',
    effects: [
      { type: 'satisfaction', value: 10 },
      { type: 'industrial_multiplier', value: 0.85 },
      { type: 'build_cost_multiplier', value: 1.1 },
    ],
    exclusiveWith: ['industrial_deregulation'],
    cooldownDays: 5,
  },
  {
    id: 'industrial_deregulation',
    name: '工业放松管制',
    category: '环境',
    effects: [
      { type: 'industrial_multiplier', value: 1.4 },
      { type: 'satisfaction', value: -15 },
      { type: 'crisis_frequency_multiplier', value: 1.3 },
    ],
    exclusiveWith: ['green_city'],
    cooldownDays: 5,
  },
]

// === 危机系统常量 ===

export const CRISIS_BASE_COOLDOWN = 40
export const CRISIS_COOLDOWN_VARIANCE = 15
export const CHALLENGE_DEFICIT_LIMIT = 10
export const CHALLENGE_LOW_SAT_LIMIT = 30
export const CHALLENGE_LOW_SAT_THRESHOLD = 20
export const CHALLENGE_WIN_POP = 1000
export const CHALLENGE_WIN_SAT = 70
export const CHALLENGE_WIN_DAYS = 30

export const CRISIS_TEMPLATES: CrisisTemplate[] = [
  {
    id: 'factory_fire',
    name: '工厂大火',
    description: '一座工厂发生大火，工业区受到严重影响',
    severity: 'moderate',
    minDay: 20,
    baseProbability: 0.3,
    preventedByFacilities: [TileType.FireStation],
    preventionThreshold: 0.4,
    options: [
      {
        id: 'firefight',
        label: '全力灭火',
        description: '动用所有资源扑灭大火',
        cost: 500,
        effects: [
          { type: 'industrial_multiplier_temp', value: 0.8, durationDays: 2 },
          { type: 'satisfaction', value: 5 },
        ],
      },
      {
        id: 'contain',
        label: '控制蔓延',
        description: '尽量控制火势，减少损失',
        cost: 0,
        effects: [
          { type: 'industrial_multiplier_temp', value: 0.5, durationDays: 5 },
          { type: 'satisfaction', value: -10 },
        ],
      },
      {
        id: 'rebuild',
        label: '紧急重建',
        description: '投入大量资金立即重建',
        cost: 1000,
        effects: [{ type: 'prevent_chain', value: 1 }],
      },
    ],
  },
  {
    id: 'worker_strike',
    name: '工人罢工',
    description: '工人不满工作条件，发起大规模罢工',
    severity: 'major',
    minDay: 30,
    baseProbability: 0.25,
    chainEventId: 'social_unrest',
    chainProbability: 0.4,
    preventedByFacilities: [TileType.PoliceStation],
    preventionThreshold: 0.3,
    options: [
      {
        id: 'negotiate',
        label: '协商谈判',
        description: '与工人代表谈判达成共识',
        cost: 300,
        effects: [
          { type: 'income_multiplier_temp', value: 0.85, durationDays: 10 },
          { type: 'satisfaction', value: 10 },
          { type: 'prevent_chain', value: 1 },
        ],
      },
      {
        id: 'force',
        label: '强制复工',
        description: '派遣警力强制恢复秩序',
        cost: 200,
        effects: [{ type: 'satisfaction', value: -20 }],
        requirements: { facility: TileType.PoliceStation },
      },
      {
        id: 'concede',
        label: '全面让步',
        description: '满足工人全部要求',
        cost: 800,
        effects: [
          { type: 'satisfaction', value: 15 },
          { type: 'prevent_chain', value: 1 },
        ],
      },
    ],
  },
  {
    id: 'social_unrest',
    name: '社会动荡',
    description: '长期不满引发社会动荡',
    severity: 'major',
    minDay: 40,
    baseProbability: 0.15,
    options: [
      {
        id: 'reform',
        label: '社会改革',
        description: '推行全面改革安抚民心',
        cost: 1000,
        effects: [
          { type: 'satisfaction', value: 15 },
          { type: 'income_multiplier_temp', value: 0.7, durationDays: 10 },
        ],
      },
      {
        id: 'suppress',
        label: '镇压抗议',
        description: '用强力手段恢复秩序',
        cost: 500,
        effects: [
          { type: 'satisfaction', value: -25 },
          { type: 'population_loss', value: 10 },
        ],
        requirements: { facility: TileType.PoliceStation },
      },
    ],
  },
  {
    id: 'epidemic',
    name: '传染病',
    description: '一种传染病在城市中蔓延',
    severity: 'catastrophic',
    minDay: 50,
    baseProbability: 0.15,
    preventedByFacilities: [TileType.Hospital],
    preventionThreshold: 0.5,
    options: [
      {
        id: 'quarantine',
        label: '全城隔离',
        description: '实施严格隔离措施',
        cost: 400,
        effects: [
          { type: 'services_multiplier_temp', value: 0.3, durationDays: 10 },
          { type: 'population_loss', value: 5 },
        ],
      },
      {
        id: 'medical',
        label: '医疗应急',
        description: '全力投入医疗资源',
        cost: 1000,
        effects: [
          { type: 'services_multiplier_temp', value: 0.7, durationDays: 5 },
        ],
        requirements: { facility: TileType.Hospital },
      },
      {
        id: 'ignore',
        label: '顺其自然',
        description: '不采取特别措施',
        cost: 0,
        effects: [
          { type: 'population_loss', value: 30 },
          { type: 'satisfaction', value: -25 },
        ],
      },
    ],
  },
  {
    id: 'power_outage',
    name: '电力中断',
    description: '电力系统故障导致大面积停电',
    severity: 'moderate',
    minDay: 25,
    baseProbability: 0.25,
    preventedByFacilities: [TileType.PowerPlant],
    preventionThreshold: 0.3,
    options: [
      {
        id: 'emergency_repair',
        label: '紧急修复',
        description: '投入资金紧急修复电力系统',
        cost: 400,
        effects: [
          { type: 'industrial_multiplier_temp', value: 0.7, durationDays: 3 },
        ],
      },
      {
        id: 'wait',
        label: '等待恢复',
        description: '等待电力自然恢复',
        cost: 0,
        effects: [
          { type: 'industrial_multiplier_temp', value: 0.4, durationDays: 7 },
          { type: 'satisfaction', value: -10 },
        ],
      },
    ],
  },
]

// === 科技树常量 ===

export const TECH_TREE: TechNode[] = [
  // Tier 1
  {
    id: 'basic_infrastructure',
    name: '基础设施',
    description: '掌握城市基础设施建设技术，解锁消防局',
    tier: 1,
    rpCost: 30,
    effects: [{ type: 'unlock_building', target: 'fire_station' }],
    prerequisites: [],
  },
  {
    id: 'basic_education',
    name: '基础教育',
    description: '建立教育体系，解锁学校',
    tier: 1,
    rpCost: 40,
    effects: [{ type: 'unlock_building', target: 'school' }],
    prerequisites: [],
  },
  {
    id: 'urban_planning',
    name: '城市规划',
    description: '掌握城市规划技术，解锁公园',
    tier: 1,
    rpCost: 35,
    effects: [{ type: 'unlock_building', target: 'park' }],
    prerequisites: [],
  },
  // Tier 2
  {
    id: 'law_enforcement',
    name: '治安体系',
    description: '建立执法体系，解锁警察局',
    tier: 2,
    rpCost: 70,
    effects: [{ type: 'unlock_building', target: 'police_station' }],
    prerequisites: ['basic_infrastructure'],
  },
  {
    id: 'public_health',
    name: '公共卫生',
    description: '发展医疗体系，解锁医院',
    tier: 2,
    rpCost: 80,
    effects: [{ type: 'unlock_building', target: 'hospital' }],
    prerequisites: ['basic_education'],
  },
  {
    id: 'commercial_theory',
    name: '商业理论',
    description: '商业收入永久 +10%',
    tier: 2,
    rpCost: 60,
    effects: [
      { type: 'permanent_multiplier', target: 'commercial_income', value: 1.1 },
    ],
    prerequisites: ['urban_planning'],
  },
  {
    id: 'power_grid',
    name: '电力网络',
    description: '掌握电力技术，解锁发电厂',
    tier: 2,
    rpCost: 100,
    effects: [{ type: 'unlock_building', target: 'power_plant' }],
    prerequisites: ['basic_infrastructure'],
  },
  // Tier 3
  {
    id: 'advanced_manufacturing',
    name: '先进制造',
    description: '工业效率永久 +15%',
    tier: 3,
    rpCost: 150,
    effects: [
      {
        type: 'permanent_multiplier',
        target: 'industrial_efficiency',
        value: 1.15,
      },
    ],
    prerequisites: ['law_enforcement', 'power_grid'],
  },
  {
    id: 'education_reform',
    name: '教育改革',
    description: '研究速度永久 +30%',
    tier: 3,
    rpCost: 120,
    effects: [{ type: 'research_multiplier', value: 1.3 }],
    prerequisites: ['public_health'],
  },
  {
    id: 'green_tech',
    name: '绿色科技',
    description: '减少工业污染协同半径 -1',
    tier: 3,
    rpCost: 130,
    effects: [
      {
        type: 'increase_synergy_radius',
        target: 'industrial_pollution',
        value: -1,
      },
    ],
    prerequisites: ['commercial_theory'],
  },
  // Tier 4 - Specializations
  {
    id: 'industrial_mastery',
    name: '工业大师',
    description: '解锁工业之都特色路线',
    tier: 4,
    rpCost: 250,
    effects: [{ type: 'unlock_specialization', target: 'industrial_capital' }],
    prerequisites: ['advanced_manufacturing'],
  },
  {
    id: 'commercial_empire',
    name: '商业帝国',
    description: '解锁商业之都特色路线',
    tier: 4,
    rpCost: 250,
    effects: [{ type: 'unlock_specialization', target: 'commercial_capital' }],
    prerequisites: ['commercial_theory', 'education_reform'],
  },
  {
    id: 'utopia',
    name: '乌托邦',
    description: '解锁宜居天堂特色路线',
    tier: 4,
    rpCost: 250,
    effects: [{ type: 'unlock_specialization', target: 'utopia' }],
    prerequisites: ['green_tech', 'education_reform'],
  },
  {
    id: 'balanced_development',
    name: '均衡发展',
    description: '解锁均衡城市特色路线',
    tier: 4,
    rpCost: 200,
    effects: [{ type: 'unlock_specialization', target: 'balanced' }],
    prerequisites: ['advanced_manufacturing', 'education_reform'],
  },
]

// === 城市特色常量 ===

export const SPECIALIZATION_TEMPLATES: SpecializationTemplate[] = [
  {
    id: 'industrial_capital',
    name: '工业之都',
    description: '工业+30%, 工业建造-15%, 满意度-10, 污染范围+1',
    effects: [
      { type: 'industrial_multiplier', value: 1.3 },
      { type: 'build_cost_multiplier', value: 0.85 },
      { type: 'satisfaction', value: -10 },
    ],
    unlockTech: 'industrial_mastery',
  },
  {
    id: 'commercial_capital',
    name: '商业之都',
    description: '商业+30%, 商业收入+20%, 建造成本+20%',
    effects: [
      { type: 'commercial_multiplier', value: 1.3 },
      { type: 'income_multiplier', value: 1.2 },
      { type: 'build_cost_multiplier', value: 1.2 },
    ],
    unlockTech: 'commercial_empire',
  },
  {
    id: 'utopia',
    name: '宜居天堂',
    description: '满意度+20, 容量+40%, 收入-20%, 研究-15%',
    effects: [
      { type: 'satisfaction', value: 20 },
      { type: 'capacity_multiplier', value: 1.4 },
      { type: 'income_multiplier', value: 0.8 },
      { type: 'research_multiplier', value: 0.85 },
    ],
    unlockTech: 'utopia',
  },
  {
    id: 'balanced',
    name: '均衡城市',
    description: '全产出+10%, 全成本-10%, 研究+5%',
    effects: [
      { type: 'all_production_multiplier', value: 1.1 },
      { type: 'all_cost_multiplier', value: 0.9 },
      { type: 'research_multiplier', value: 1.05 },
    ],
    unlockTech: 'balanced_development',
  },
]
