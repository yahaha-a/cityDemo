/** 资源供需快照 */
export interface ResourceBalance {
  supply: number
  demand: number
  ratio: number
}

/** 城市资源市场 */
export interface ResourceMarket {
  labor: ResourceBalance
  goods: ResourceBalance
  services: ResourceBalance
}

/** 需求等级 */
export enum DemandLevel {
  Low = 'low',
  Balanced = 'balanced',
  High = 'high',
  Critical = 'critical',
}

/** 各建筑类别的需求指示 */
export interface DemandIndicators {
  residential: DemandLevel
  commercial: DemandLevel
  industrial: DemandLevel
}

/** 经济状态 */
export interface EconomyState {
  income: number
  expenses: number
  population: number
  lastDayRevenue: number
  satisfaction: number
  populationCapacity: number
  resources: ResourceMarket
  demandIndicators: DemandIndicators
  efficiencyByType: {
    residential: number
    commercial: number
    industrial: number
  }
}
