import type { TileType } from './core'

export interface FacilityEffect {
  type:
    | 'satisfaction'
    | 'income_multiplier'
    | 'efficiency_multiplier'
    | 'crisis_resistance'
    | 'capacity_multiplier'
    | 'research_points'
  value: number
  targetTileType?: TileType
}

export interface FacilityTemplate {
  tileType: TileType
  name: string
  buildCost: number
  maintenanceCost: number
  radius: number
  effects: FacilityEffect[]
  unlockTech?: string
}

export interface FacilityCoverageInfo {
  satisfactionMod: number
  incomeMultiplier: number
  efficiencyMultiplier: number
  crisisResistance: number
  capacityMultiplier: number
  researchPoints: number
  facilities: TileType[]
}

export interface FacilityCoverageState {
  coverage: Record<string, FacilityCoverageInfo>
  totalMaintenance: number
  totalResearchPoints: number
  avgCrisisResistance: number
}
