import { TileType, type CrisisTemplate } from 'shared/types'

export const CRISIS_BASE_COOLDOWN = 40
export const CRISIS_COOLDOWN_VARIANCE = 15
export const CHALLENGE_DEFICIT_LIMIT = 10
export const CHALLENGE_LOW_SAT_LIMIT = 30
export const CHALLENGE_LOW_SAT_THRESHOLD = 20
export const CHALLENGE_WIN_POP = 1000
export const CHALLENGE_WIN_SAT = 70
export const CHALLENGE_WIN_DAYS = 30

export const CRISIS_TEMPLATES: CrisisTemplate[] = [
  {
    id: 'factory_fire',
    name: '工厂大火',
    description: '一座工厂发生大火，工业区受到严重影响',
    severity: 'moderate',
    minDay: 20,
    baseProbability: 0.3,
    preventedByFacilities: [TileType.FireStation],
    preventionThreshold: 0.4,
    options: [
      {
        id: 'firefight',
        label: '全力灭火',
        description: '动用所有资源扑灭大火',
        cost: 500,
        effects: [
          { type: 'industrial_multiplier_temp', value: 0.8, durationDays: 2 },
          { type: 'satisfaction', value: 5 },
        ],
      },
      {
        id: 'contain',
        label: '控制蔓延',
        description: '尽量控制火势，减少损失',
        cost: 0,
        effects: [
          { type: 'industrial_multiplier_temp', value: 0.5, durationDays: 5 },
          { type: 'satisfaction', value: -10 },
        ],
      },
      {
        id: 'rebuild',
        label: '紧急重建',
        description: '投入大量资金立即重建',
        cost: 1000,
        effects: [{ type: 'prevent_chain', value: 1 }],
      },
    ],
  },
  {
    id: 'worker_strike',
    name: '工人罢工',
    description: '工人不满工作条件，发起大规模罢工',
    severity: 'major',
    minDay: 30,
    baseProbability: 0.25,
    chainEventId: 'social_unrest',
    chainProbability: 0.4,
    preventedByFacilities: [TileType.PoliceStation],
    preventionThreshold: 0.3,
    options: [
      {
        id: 'negotiate',
        label: '协商谈判',
        description: '与工人代表谈判达成共识',
        cost: 300,
        effects: [
          { type: 'income_multiplier_temp', value: 0.85, durationDays: 10 },
          { type: 'satisfaction', value: 10 },
          { type: 'prevent_chain', value: 1 },
        ],
      },
      {
        id: 'force',
        label: '强制复工',
        description: '派遣警力强制恢复秩序',
        cost: 200,
        effects: [{ type: 'satisfaction', value: -20 }],
        requirements: { facility: TileType.PoliceStation },
      },
      {
        id: 'concede',
        label: '全面让步',
        description: '满足工人全部要求',
        cost: 800,
        effects: [
          { type: 'satisfaction', value: 15 },
          { type: 'prevent_chain', value: 1 },
        ],
      },
    ],
  },
  {
    id: 'social_unrest',
    name: '社会动荡',
    description: '长期不满引发社会动荡',
    severity: 'major',
    minDay: 40,
    baseProbability: 0.15,
    options: [
      {
        id: 'reform',
        label: '社会改革',
        description: '推行全面改革安抚民心',
        cost: 1000,
        effects: [
          { type: 'satisfaction', value: 15 },
          { type: 'income_multiplier_temp', value: 0.7, durationDays: 10 },
        ],
      },
      {
        id: 'suppress',
        label: '镇压抗议',
        description: '用强力手段恢复秩序',
        cost: 500,
        effects: [
          { type: 'satisfaction', value: -25 },
          { type: 'population_loss', value: 10 },
        ],
        requirements: { facility: TileType.PoliceStation },
      },
    ],
  },
  {
    id: 'epidemic',
    name: '传染病',
    description: '一种传染病在城市中蔓延',
    severity: 'catastrophic',
    minDay: 50,
    baseProbability: 0.15,
    preventedByFacilities: [TileType.Hospital],
    preventionThreshold: 0.5,
    options: [
      {
        id: 'quarantine',
        label: '全城隔离',
        description: '实施严格隔离措施',
        cost: 400,
        effects: [
          { type: 'services_multiplier_temp', value: 0.3, durationDays: 10 },
          { type: 'population_loss', value: 5 },
        ],
      },
      {
        id: 'medical',
        label: '医疗应急',
        description: '全力投入医疗资源',
        cost: 1000,
        effects: [
          { type: 'services_multiplier_temp', value: 0.7, durationDays: 5 },
        ],
        requirements: { facility: TileType.Hospital },
      },
      {
        id: 'ignore',
        label: '顺其自然',
        description: '不采取特别措施',
        cost: 0,
        effects: [
          { type: 'population_loss', value: 30 },
          { type: 'satisfaction', value: -25 },
        ],
      },
    ],
  },
  {
    id: 'power_outage',
    name: '电力中断',
    description: '电力系统故障导致大面积停电',
    severity: 'moderate',
    minDay: 25,
    baseProbability: 0.25,
    preventedByFacilities: [TileType.PowerPlant],
    preventionThreshold: 0.3,
    options: [
      {
        id: 'emergency_repair',
        label: '紧急修复',
        description: '投入资金紧急修复电力系统',
        cost: 400,
        effects: [
          { type: 'industrial_multiplier_temp', value: 0.7, durationDays: 3 },
        ],
      },
      {
        id: 'wait',
        label: '等待恢复',
        description: '等待电力自然恢复',
        cost: 0,
        effects: [
          { type: 'industrial_multiplier_temp', value: 0.4, durationDays: 7 },
          { type: 'satisfaction', value: -10 },
        ],
      },
    ],
  },
]
