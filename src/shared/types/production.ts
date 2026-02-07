import type { TileType } from './core'

/** 产品类型 */
export enum ProductType {
  RawFood = 'raw_food',
  ProcessedFood = 'processed_food',
  RawMaterials = 'raw_materials',
  Components = 'components',
  ConsumerGoods = 'consumer_goods',
  Energy = 'energy',
}

/** 产业链节点 */
export interface ProductionNode {
  /** 需要的建筑类型 */
  buildingType: TileType
  /** 所需数量 */
  requiredCount: number
  /** 必须连接道路 */
  requireConnected: boolean
  /** 输入产品 */
  inputs: ProductType[]
  /** 输出产品 */
  outputs: ProductType[]
}

/** 产业链完成奖励 */
export interface ChainBonus {
  type: 'satisfaction' | 'income_multiplier' | 'efficiency'
  value: number
  target?: 'residential' | 'commercial' | 'industrial'
}

/** 产业链定义 */
export interface ProductionChainDef {
  id: string
  name: string
  description: string
  nodes: ProductionNode[]
  completionBonus: ChainBonus
  unlockTech?: string
}

/** 激活的产业链信息 */
export interface ActiveChainInfo {
  chainId: string
  /** 各节点的完成比例 (0~1) */
  nodeCompletion: number[]
  /** 整体完成比例 (0~1) */
  completionRatio: number
}

/** 产业链状态 */
export interface ProductionChainState {
  activeChains: Record<string, ActiveChainInfo>
}
