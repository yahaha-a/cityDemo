import { ToolType, TerrainType } from 'shared/types'

/** 地形改造操作配置 */
export interface TerraformAction {
  tool: ToolType
  name: string
  cost: number
  fromTerrains: TerrainType[]
  toTerrain: TerrainType
  unlockTech?: string
}

/** 地形改造操作列表 */
export const TERRAFORM_ACTIONS: TerraformAction[] = [
  {
    tool: ToolType.FlattenTerrain,
    name: '平整地形',
    cost: 200,
    fromTerrains: [TerrainType.Hill, TerrainType.Rocky],
    toTerrain: TerrainType.Plain,
    unlockTech: 'terraforming_basics',
  },
  {
    tool: ToolType.FillWater,
    name: '填水造陆',
    cost: 500,
    fromTerrains: [TerrainType.Water],
    toTerrain: TerrainType.Plain,
    unlockTech: 'advanced_terraforming',
  },
  {
    tool: ToolType.DigChannel,
    name: '开挖水道',
    cost: 300,
    fromTerrains: [TerrainType.Plain, TerrainType.Fertile],
    toTerrain: TerrainType.Water,
    unlockTech: 'terraforming_basics',
  },
  {
    tool: ToolType.CreateHill,
    name: '堆土造丘',
    cost: 250,
    fromTerrains: [TerrainType.Plain],
    toTerrain: TerrainType.Hill,
    unlockTech: 'advanced_terraforming',
  },
]

/** 根据工具获取地形改造配置 */
export function getTerraformAction(
  tool: ToolType
): TerraformAction | undefined {
  return TERRAFORM_ACTIONS.find(a => a.tool === tool)
}
