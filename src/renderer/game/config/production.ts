import { TileType, ProductType } from 'shared/types'
import type { ProductionChainDef } from 'shared/types'

/** 产业链定义 */
export const PRODUCTION_CHAINS: ProductionChainDef[] = [
  {
    id: 'food_chain',
    name: '食品产业链',
    description: '从原料加工到食品销售的完整链条',
    nodes: [
      {
        buildingType: TileType.Industrial,
        requiredCount: 2,
        requireConnected: true,
        inputs: [],
        outputs: [ProductType.RawFood],
      },
      {
        buildingType: TileType.Industrial,
        requiredCount: 1,
        requireConnected: true,
        inputs: [ProductType.RawFood],
        outputs: [ProductType.ProcessedFood],
      },
      {
        buildingType: TileType.Commercial,
        requiredCount: 2,
        requireConnected: true,
        inputs: [ProductType.ProcessedFood],
        outputs: [ProductType.ConsumerGoods],
      },
    ],
    completionBonus: { type: 'satisfaction', value: 10 },
  },
  {
    id: 'manufacturing_chain',
    name: '制造产业链',
    description: '从原材料到成品的制造流程',
    nodes: [
      {
        buildingType: TileType.Industrial,
        requiredCount: 3,
        requireConnected: true,
        inputs: [],
        outputs: [ProductType.RawMaterials],
      },
      {
        buildingType: TileType.Industrial,
        requiredCount: 2,
        requireConnected: true,
        inputs: [ProductType.RawMaterials],
        outputs: [ProductType.Components],
      },
      {
        buildingType: TileType.Commercial,
        requiredCount: 3,
        requireConnected: true,
        inputs: [ProductType.Components],
        outputs: [ProductType.ConsumerGoods],
      },
    ],
    completionBonus: {
      type: 'income_multiplier',
      value: 1.3,
      target: 'commercial',
    },
  },
  {
    id: 'energy_chain',
    name: '能源产业链',
    description: '电力驱动工业效率提升',
    nodes: [
      {
        buildingType: TileType.PowerPlant,
        requiredCount: 1,
        requireConnected: true,
        inputs: [],
        outputs: [ProductType.Energy],
      },
      {
        buildingType: TileType.Industrial,
        requiredCount: 4,
        requireConnected: true,
        inputs: [ProductType.Energy],
        outputs: [],
      },
    ],
    completionBonus: {
      type: 'efficiency',
      value: 1.2,
      target: 'industrial',
    },
  },
]

/** 根据 ID 获取产业链定义 */
export function getProductionChain(id: string): ProductionChainDef | undefined {
  return PRODUCTION_CHAINS.find(c => c.id === id)
}
