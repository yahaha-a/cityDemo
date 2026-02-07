import { TileType } from 'shared/types'
import type {
  StructureTemplate,
  ComboDefinition,
} from 'shared/types/structures'

/** 多格建筑模板 */
export const STRUCTURE_TEMPLATES: StructureTemplate[] = [
  {
    id: 'large_park',
    name: '大型公园',
    tileType: TileType.Park,
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
    ],
    buildCost: 1000,
    effects: [{ type: 'satisfaction', value: 20 }],
    comboTag: 'park',
  },
  {
    id: 'large_mall',
    name: '大型商场',
    tileType: TileType.Commercial,
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: 2, dy: 1 },
      { dx: 0, dy: 2 },
      { dx: 1, dy: 2 },
      { dx: 2, dy: 2 },
    ],
    buildCost: 3000,
    effects: [{ type: 'income_multiplier', value: 1.5 }],
    comboTag: 'commercial',
  },
  {
    id: 'l_factory',
    name: 'L型工厂',
    tileType: TileType.Industrial,
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
    ],
    buildCost: 1500,
    effects: [{ type: 'efficiency', value: 1.3, target: 'industrial' }],
    comboTag: 'industrial',
  },
  {
    id: 'residential_complex',
    name: '住宅综合体',
    tileType: TileType.Residential,
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: 0, dy: 2 },
      { dx: 1, dy: 2 },
    ],
    buildCost: 2000,
    effects: [{ type: 'capacity', value: 2 }],
    comboTag: 'residential',
  },
  {
    id: 'logistics_center',
    name: '物流中心',
    tileType: TileType.Industrial,
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
    ],
    buildCost: 1800,
    effects: [{ type: 'efficiency', value: 1.2, target: 'industrial' }],
    comboTag: 'logistics',
  },
  {
    id: 'city_plaza',
    name: '市政广场',
    tileType: TileType.Park,
    footprint: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: 2, dy: 1 },
      { dx: 0, dy: 2 },
      { dx: 1, dy: 2 },
      { dx: 2, dy: 2 },
    ],
    buildCost: 2500,
    effects: [{ type: 'satisfaction', value: 10 }],
    comboTag: 'park',
  },
]

/** 组合效果定义 */
export const COMBO_DEFINITIONS: ComboDefinition[] = [
  {
    id: 'park_residential',
    name: '绿色家园',
    requiredTags: ['park', 'residential'],
    effect: { type: 'satisfaction', value: 15 },
  },
  {
    id: 'industrial_logistics',
    name: '产业集群',
    requiredTags: ['industrial', 'logistics'],
    effect: { type: 'efficiency', value: 1.15, target: 'industrial' },
  },
  {
    id: 'commercial_park',
    name: '商业休闲区',
    requiredTags: ['commercial', 'park'],
    effect: { type: 'income_multiplier', value: 1.2 },
  },
]

/** 根据 ID 获取结构模板 */
export function getStructureTemplate(
  id: string
): StructureTemplate | undefined {
  return STRUCTURE_TEMPLATES.find(t => t.id === id)
}
