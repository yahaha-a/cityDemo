import type { TileType } from './core'

export interface SynergyEffect {
  type: 'satisfaction' | 'income_multiplier' | 'efficiency_multiplier'
  value: number
}

export interface SynergyRule {
  id: string
  sourceTileType: TileType
  targetTileType: TileType
  radius: number
  effect: SynergyEffect
  maxStacks: number
}

export interface TileSynergyInfo {
  satisfactionMod: number
  incomeMultiplier: number
  efficiencyMultiplier: number
  sources: Array<{ ruleId: string; stacks: number }>
}

export interface SynergyState {
  tileEffects: Record<string, TileSynergyInfo>
  globalSatisfactionMod: number
  incomeMultByType: {
    residential: number
    commercial: number
    industrial: number
  }
  effMultByType: { residential: number; commercial: number; industrial: number }
}
