import type { BuildingDefinition } from 'shared/types/building-defs'

/**
 * 16 种建筑的完整定义
 */
export const BUILDING_DEFS: BuildingDefinition[] = [
  // === 住宅类 ===
  {
    id: 'house',
    name: '民居',
    category: 'residential',
    footprint: [{ dx: 0, dy: 0 }],
    cost: 100,
    maintenance: 1,
    maxLevel: 3,
    synergyTags: ['residential'],
    produces: { labor: 10 },
    consumes: { services: 5 },
    baseIncome: 3,
    areaEffects: [],
    areaRadius: 0,
    unlockCondition: { type: 'initial' },
  },
  {
    id: 'apartment',
    name: '公寓',
    category: 'residential',
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
    ],
    cost: 350,
    maintenance: 3,
    maxLevel: 3,
    synergyTags: ['residential'],
    produces: { labor: 25 },
    consumes: { services: 12 },
    baseIncome: 8,
    areaEffects: [],
    areaRadius: 0,
    unlockCondition: { type: 'tech', id: 'urban_planning' },
  },
  {
    id: 'residential_complex',
    name: '住宅小区',
    category: 'residential',
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
    ],
    cost: 800,
    maintenance: 6,
    maxLevel: 2,
    synergyTags: ['residential'],
    produces: { labor: 50 },
    consumes: { services: 25 },
    baseIncome: 15,
    areaEffects: [],
    areaRadius: 0,
    unlockCondition: { type: 'tech', id: 'balanced_development' },
  },

  // === 商业类 ===
  {
    id: 'shop',
    name: '商铺',
    category: 'commercial',
    footprint: [{ dx: 0, dy: 0 }],
    cost: 150,
    maintenance: 2,
    maxLevel: 3,
    synergyTags: ['commercial'],
    produces: { services: 8 },
    consumes: { goods: 3, labor: 2 },
    baseIncome: 15,
    areaEffects: [],
    areaRadius: 0,
    unlockCondition: { type: 'initial' },
  },
  {
    id: 'office',
    name: '写字楼',
    category: 'commercial',
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
    ],
    cost: 500,
    maintenance: 4,
    maxLevel: 3,
    synergyTags: ['commercial'],
    produces: { services: 15 },
    consumes: { goods: 2, labor: 4 },
    baseIncome: 25,
    areaEffects: [],
    areaRadius: 0,
    unlockCondition: { type: 'tech', id: 'commercial_theory' },
  },
  {
    id: 'mall',
    name: '商场',
    category: 'commercial',
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
    ],
    cost: 600,
    maintenance: 5,
    maxLevel: 2,
    synergyTags: ['commercial'],
    produces: { services: 20 },
    consumes: { goods: 8, labor: 5 },
    baseIncome: 35,
    areaEffects: [],
    areaRadius: 0,
    unlockCondition: { type: 'tech', id: 'commercial_theory' },
  },

  // === 工业类 ===
  {
    id: 'factory',
    name: '工厂',
    category: 'industrial',
    footprint: [{ dx: 0, dy: 0 }],
    cost: 100,
    maintenance: 2,
    maxLevel: 3,
    synergyTags: ['industrial'],
    produces: { goods: 5 },
    consumes: { labor: 3 },
    baseIncome: 10,
    areaEffects: [],
    areaRadius: 0,
    unlockCondition: { type: 'initial' },
  },
  {
    id: 'heavy_industry',
    name: '重工业',
    category: 'industrial',
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
    ],
    cost: 700,
    maintenance: 8,
    maxLevel: 2,
    synergyTags: ['industrial'],
    produces: { goods: 15 },
    consumes: { labor: 8 },
    baseIncome: 25,
    areaEffects: [],
    areaRadius: 0,
    unlockCondition: { type: 'tech', id: 'advanced_manufacturing' },
  },
  {
    id: 'warehouse',
    name: '仓储',
    category: 'industrial',
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
    ],
    cost: 400,
    maintenance: 3,
    maxLevel: 2,
    synergyTags: ['warehouse'],
    produces: {},
    consumes: { labor: 2 },
    baseIncome: 5,
    areaEffects: [],
    areaRadius: 0,
    unlockCondition: { type: 'tech', id: 'basic_infrastructure' },
  },

  // === 服务类 ===
  {
    id: 'park',
    name: '公园',
    category: 'service',
    footprint: [{ dx: 0, dy: 0 }],
    cost: 200,
    maintenance: 3,
    maxLevel: 2,
    synergyTags: ['park', 'green'],
    produces: {},
    consumes: {},
    baseIncome: 0,
    areaEffects: [
      { type: 'satisfaction', value: 5, targetCategory: 'residential' },
    ],
    areaRadius: 3,
    unlockCondition: { type: 'tech', id: 'urban_planning' },
  },
  {
    id: 'plaza',
    name: '广场',
    category: 'service',
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
    ],
    cost: 1500,
    maintenance: 12,
    maxLevel: 2,
    synergyTags: ['park', 'green'],
    produces: {},
    consumes: {},
    baseIncome: 0,
    areaEffects: [
      { type: 'satisfaction', value: 10 },
      { type: 'income_multiplier', value: 1.05, targetCategory: 'commercial' },
    ],
    areaRadius: 4,
    unlockCondition: { type: 'milestone', id: 'pop_300' },
  },
  {
    id: 'school',
    name: '学校',
    category: 'service',
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 2, dy: 0 },
      { dx: 1, dy: 1 },
    ],
    cost: 600,
    maintenance: 8,
    maxLevel: 2,
    synergyTags: ['education'],
    produces: {},
    consumes: {},
    baseIncome: 0,
    areaEffects: [
      { type: 'income_multiplier', value: 1.1, targetCategory: 'residential' },
      { type: 'research_points', value: 3 },
    ],
    areaRadius: 4,
    unlockCondition: { type: 'tech', id: 'basic_education' },
  },
  {
    id: 'hospital',
    name: '医院',
    category: 'service',
    footprint: [
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
    ],
    cost: 1200,
    maintenance: 15,
    maxLevel: 2,
    synergyTags: ['medical'],
    produces: {},
    consumes: {},
    baseIncome: 0,
    areaEffects: [
      { type: 'satisfaction', value: 6 },
      { type: 'crisis_resistance', value: 0.3 },
      {
        type: 'capacity_multiplier',
        value: 1.1,
        targetCategory: 'residential',
      },
    ],
    areaRadius: 5,
    unlockCondition: { type: 'tech', id: 'public_health' },
  },
  {
    id: 'fire_station',
    name: '消防局',
    category: 'service',
    footprint: [{ dx: 0, dy: 0 }],
    cost: 300,
    maintenance: 5,
    maxLevel: 2,
    synergyTags: ['emergency'],
    produces: {},
    consumes: {},
    baseIncome: 0,
    areaEffects: [{ type: 'crisis_resistance', value: 0.4 }],
    areaRadius: 5,
    unlockCondition: { type: 'tech', id: 'basic_infrastructure' },
  },
  {
    id: 'police_station',
    name: '警察局',
    category: 'service',
    footprint: [{ dx: 0, dy: 0 }],
    cost: 300,
    maintenance: 5,
    maxLevel: 2,
    synergyTags: ['police'],
    produces: {},
    consumes: {},
    baseIncome: 0,
    areaEffects: [
      {
        type: 'efficiency_multiplier',
        value: 1.1,
        targetCategory: 'commercial',
      },
      { type: 'crisis_resistance', value: 0.3 },
    ],
    areaRadius: 4,
    unlockCondition: { type: 'tech', id: 'law_enforcement' },
  },
  {
    id: 'power_plant',
    name: '发电厂',
    category: 'service',
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
    ],
    cost: 800,
    maintenance: 12,
    maxLevel: 2,
    synergyTags: ['power'],
    produces: {},
    consumes: {},
    baseIncome: 0,
    areaEffects: [
      {
        type: 'efficiency_multiplier',
        value: 1.15,
        targetCategory: 'industrial',
      },
      { type: 'satisfaction', value: -8, targetCategory: 'residential' },
    ],
    areaRadius: 4,
    unlockCondition: { type: 'tech', id: 'power_grid' },
  },
]

/** ID → 定义 的 O(1) 查找表 */
const BUILDING_DEF_MAP = new Map<string, BuildingDefinition>(
  BUILDING_DEFS.map(d => [d.id, d])
)

/** 分类 → 定义列表 的缓存 */
const BUILDING_CATEGORY_MAP = new Map<string, BuildingDefinition[]>()
for (const d of BUILDING_DEFS) {
  let list = BUILDING_CATEGORY_MAP.get(d.category)
  if (!list) {
    list = []
    BUILDING_CATEGORY_MAP.set(d.category, list)
  }
  list.push(d)
}

/** 根据 ID 获取建筑定义 */
export function getBuildingDef(id: string): BuildingDefinition | undefined {
  return BUILDING_DEF_MAP.get(id)
}

/** 根据分类获取建筑列表 */
export function getBuildingsByCategory(category: string): BuildingDefinition[] {
  return BUILDING_CATEGORY_MAP.get(category) ?? []
}
