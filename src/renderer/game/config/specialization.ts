import type { SpecializationTemplate } from 'shared/game-types'

export const SPECIALIZATION_TEMPLATES: SpecializationTemplate[] = [
  {
    id: 'industrial_capital',
    name: '工业之都',
    description: '工业+30%, 工业建造-15%, 满意度-10, 污染范围+1',
    effects: [
      { type: 'industrial_multiplier', value: 1.3 },
      { type: 'build_cost_multiplier', value: 0.85 },
      { type: 'satisfaction', value: -10 },
    ],
    unlockTech: 'industrial_mastery',
  },
  {
    id: 'commercial_capital',
    name: '商业之都',
    description: '商业+30%, 商业收入+20%, 建造成本+20%',
    effects: [
      { type: 'commercial_multiplier', value: 1.3 },
      { type: 'income_multiplier', value: 1.2 },
      { type: 'build_cost_multiplier', value: 1.2 },
    ],
    unlockTech: 'commercial_empire',
  },
  {
    id: 'utopia',
    name: '宜居天堂',
    description: '满意度+20, 容量+40%, 收入-20%, 研究-15%',
    effects: [
      { type: 'satisfaction', value: 20 },
      { type: 'capacity_multiplier', value: 1.4 },
      { type: 'income_multiplier', value: 0.8 },
      { type: 'research_multiplier', value: 0.85 },
    ],
    unlockTech: 'utopia',
  },
  {
    id: 'balanced',
    name: '均衡城市',
    description: '全产出+10%, 全成本-10%, 研究+5%',
    effects: [
      { type: 'all_production_multiplier', value: 1.1 },
      { type: 'all_cost_multiplier', value: 0.9 },
      { type: 'research_multiplier', value: 1.05 },
    ],
    unlockTech: 'balanced_development',
  },
]
