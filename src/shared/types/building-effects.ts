/**
 * 建筑效果状态类型
 */
import type { BuildingCategory } from './building-defs'

/** 单个格子的建筑效果汇总 */
export interface TileBuildingEffect {
  satisfactionMod: number
  incomeMultiplier: number
  efficiencyMultiplier: number
  crisisResistance: number
  capacityMultiplier: number
  researchPoints: number
  sources: Array<{ ruleId: string; stacks: number }>
}

/** 建筑效果系统的全局状态 */
export interface BuildingEffectState {
  tileEffects: Record<string, TileBuildingEffect>
  globalSatisfactionMod: number
  incomeMultByCategory: Record<BuildingCategory, number>
  effMultByCategory: Record<BuildingCategory, number>
  totalMaintenance: number
  totalResearchPoints: number
  avgCrisisResistance: number
  resources: {
    laborSupply: number
    laborDemand: number
    laborFulfillment: number
    goodsSupply: number
    goodsDemand: number
    goodsFulfillment: number
    servicesSupply: number
    servicesDemand: number
    servicesFulfillment: number
  }
}
