export interface SpecializationEffect {
  type:
    | 'industrial_multiplier'
    | 'commercial_multiplier'
    | 'satisfaction'
    | 'capacity_multiplier'
    | 'income_multiplier'
    | 'build_cost_multiplier'
    | 'research_multiplier'
    | 'all_production_multiplier'
    | 'all_cost_multiplier'
  value: number
}

export interface SpecializationTemplate {
  id: string
  name: string
  description: string
  effects: SpecializationEffect[]
  unlockTech: string
}

export interface SpecializationState {
  chosen: string | null
  available: string[]
}
