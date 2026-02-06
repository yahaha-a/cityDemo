export interface PolicyEffect {
  type:
    | 'income_multiplier'
    | 'satisfaction'
    | 'growth_multiplier'
    | 'expense_multiplier'
    | 'industrial_multiplier'
    | 'commercial_multiplier'
    | 'capacity_multiplier'
    | 'research_multiplier'
    | 'road_maintenance_multiplier'
    | 'build_cost_multiplier'
    | 'crisis_frequency_multiplier'
  value: number
}

export interface PolicyTemplate {
  id: string
  name: string
  category: string
  effects: PolicyEffect[]
  exclusiveWith: string[]
  cooldownDays: number
  unlockTech?: string
}

export interface PolicyState {
  activePolicies: string[]
  cooldowns: Record<string, number>
  unlockedPolicies: string[]
}
