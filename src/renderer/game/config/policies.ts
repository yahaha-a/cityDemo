import type { PolicyTemplate } from 'shared/game-types'

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
