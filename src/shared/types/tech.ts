import type { BuildingId } from './building-defs'

export interface TechEffect {
  type:
    | 'unlock_building'
    | 'unlock_policy'
    | 'permanent_multiplier'
    | 'unlock_specialization'
    | 'increase_synergy_radius'
    | 'research_multiplier'
  value?: number
  target?: string
}

export interface TechNode {
  id: string
  name: string
  description: string
  tier: number
  rpCost: number
  effects: TechEffect[]
  prerequisites: string[]
}

export interface TechState {
  researched: string[]
  currentResearch: string | null
  researchProgress: number
  dailyRP: number
  unlockedBuildings: BuildingId[]
  unlockedPolicies: string[]
  unlockedSpecializations: string[]
  permanentMultipliers: Record<string, number>
}
