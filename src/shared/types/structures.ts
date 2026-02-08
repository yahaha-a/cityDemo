import type { TileType } from './core'

/** 足迹单元格偏移 */
export interface FootprintCell {
  dx: number
  dy: number
}

/** 结构效果 */
export interface StructureEffect {
  type: 'satisfaction' | 'income_multiplier' | 'efficiency' | 'capacity'
  value: number
  target?: string
}

/** 多格建筑模板 */
export interface StructureTemplate {
  id: string
  name: string
  tileType: TileType
  footprint: FootprintCell[]
  buildCost: number
  effects: StructureEffect[]
  unlockTech?: string
  comboTag?: string
}

/** 多格建筑实例 */
export interface StructureInstance {
  id: string
  templateId: string
  originX: number
  originY: number
  level: number
  connected: boolean
  rotation?: number
  activeCombo?: string
}

/** 结构注册表 */
export interface StructureRegistry {
  instances: Record<string, StructureInstance>
  tileToStructure: Record<string, string>
}

/** 组合效果定义 */
export interface ComboDefinition {
  id: string
  name: string
  requiredTags: string[]
  effect: StructureEffect
}
