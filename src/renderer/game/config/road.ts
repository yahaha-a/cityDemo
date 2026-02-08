import { RoadType, TerrainType } from 'shared/types'

/** 道路配置接口 */
export interface RoadConfig {
  /** 建造成本 */
  buildCost: number
  /** 每日维护成本 */
  maintenanceCost: number
  /** 速度乘数（预留） */
  speedMultiplier: number
  /** 连接半径 */
  connectionRadius: number
  /** 允许建造的地形（为空表示无地形限制） */
  terrainAllowances: TerrainType[]
  /** 禁止建造的地形 */
  terrainRestrictions: TerrainType[]
  /** 显示名称 */
  name: string
}

/** 各种道路类型的配置 */
export const ROAD_CONFIGS: Record<RoadType, RoadConfig> = {
  [RoadType.Normal]: {
    buildCost: 10,
    maintenanceCost: 1,
    speedMultiplier: 1,
    connectionRadius: 1,
    terrainAllowances: [],
    terrainRestrictions: [TerrainType.Water],
    name: '普通道路',
  },
  [RoadType.Highway]: {
    buildCost: 50,
    maintenanceCost: 3,
    speedMultiplier: 2,
    connectionRadius: 2,
    terrainAllowances: [],
    terrainRestrictions: [TerrainType.Water],
    name: '高速公路',
  },
  [RoadType.Bridge]: {
    buildCost: 80,
    maintenanceCost: 4,
    speedMultiplier: 1,
    connectionRadius: 1,
    terrainAllowances: [TerrainType.Water],
    terrainRestrictions: [],
    name: '桥梁',
  },
  [RoadType.Tunnel]: {
    buildCost: 100,
    maintenanceCost: 5,
    speedMultiplier: 0.8,
    connectionRadius: 1,
    terrainAllowances: [TerrainType.Hill, TerrainType.Rocky],
    terrainRestrictions: [],
    name: '隧道',
  },
}
