/**
 * 协同规则 V2 — 使用 synergyTags 匹配
 */

export interface SynergyRuleV2 {
  id: string
  sourceTag: string
  targetTag: string
  radius: number
  effect: {
    type: 'satisfaction' | 'income_multiplier' | 'efficiency_multiplier'
    value: number
  }
  maxStacks: number
}

export const SYNERGY_RULES_V2: SynergyRuleV2[] = [
  // 负面协同
  {
    id: 'industrial_pollution',
    sourceTag: 'industrial',
    targetTag: 'residential',
    radius: 3,
    effect: { type: 'satisfaction', value: -5 },
    maxStacks: 3,
  },
  {
    id: 'power_noise',
    sourceTag: 'power',
    targetTag: 'residential',
    radius: 3,
    effect: { type: 'satisfaction', value: -8 },
    maxStacks: 1,
  },
  {
    id: 'commercial_noise',
    sourceTag: 'commercial',
    targetTag: 'park',
    radius: 2,
    effect: { type: 'satisfaction', value: -3 },
    maxStacks: 2,
  },

  // 正面协同
  {
    id: 'commercial_convenience',
    sourceTag: 'commercial',
    targetTag: 'residential',
    radius: 2,
    effect: { type: 'income_multiplier', value: 1.12 },
    maxStacks: 2,
  },
  {
    id: 'residential_cluster',
    sourceTag: 'residential',
    targetTag: 'residential',
    radius: 1,
    effect: { type: 'satisfaction', value: 2 },
    maxStacks: 4,
  },
  {
    id: 'industrial_cluster',
    sourceTag: 'industrial',
    targetTag: 'industrial',
    radius: 2,
    effect: { type: 'efficiency_multiplier', value: 1.08 },
    maxStacks: 3,
  },
  {
    id: 'supply_chain',
    sourceTag: 'industrial',
    targetTag: 'commercial',
    radius: 3,
    effect: { type: 'efficiency_multiplier', value: 1.1 },
    maxStacks: 2,
  },
  {
    id: 'green_living',
    sourceTag: 'park',
    targetTag: 'residential',
    radius: 3,
    effect: { type: 'satisfaction', value: 5 },
    maxStacks: 2,
  },
  {
    id: 'education_value',
    sourceTag: 'education',
    targetTag: 'residential',
    radius: 4,
    effect: { type: 'income_multiplier', value: 1.1 },
    maxStacks: 1,
  },
  {
    id: 'police_security',
    sourceTag: 'police',
    targetTag: 'commercial',
    radius: 4,
    effect: { type: 'efficiency_multiplier', value: 1.12 },
    maxStacks: 1,
  },
  {
    id: 'power_drive',
    sourceTag: 'power',
    targetTag: 'industrial',
    radius: 4,
    effect: { type: 'efficiency_multiplier', value: 1.15 },
    maxStacks: 1,
  },
  {
    id: 'warehouse_logistics',
    sourceTag: 'warehouse',
    targetTag: 'industrial',
    radius: 3,
    effect: { type: 'income_multiplier', value: 1.1 },
    maxStacks: 2,
  },
  {
    id: 'warehouse_delivery',
    sourceTag: 'warehouse',
    targetTag: 'commercial',
    radius: 3,
    effect: { type: 'efficiency_multiplier', value: 1.08 },
    maxStacks: 1,
  },
]
