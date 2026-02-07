import { TileType, type SynergyRule } from 'shared/types'

export const SYNERGY_RULES: SynergyRule[] = [
  {
    id: 'industrial_pollution',
    sourceTileType: TileType.Industrial,
    targetTileType: TileType.Residential,
    radius: 3,
    effect: { type: 'satisfaction', value: -5 },
    maxStacks: 3,
  },
  {
    id: 'commercial_convenience',
    sourceTileType: TileType.Commercial,
    targetTileType: TileType.Residential,
    radius: 2,
    effect: { type: 'income_multiplier', value: 1.15 },
    maxStacks: 2,
  },
  {
    id: 'supply_chain',
    sourceTileType: TileType.Industrial,
    targetTileType: TileType.Commercial,
    radius: 3,
    effect: { type: 'efficiency_multiplier', value: 1.1 },
    maxStacks: 2,
  },
  {
    id: 'residential_cluster',
    sourceTileType: TileType.Residential,
    targetTileType: TileType.Residential,
    radius: 1,
    effect: { type: 'satisfaction', value: 2 },
    maxStacks: 4,
  },
  {
    id: 'industrial_cluster',
    sourceTileType: TileType.Industrial,
    targetTileType: TileType.Industrial,
    radius: 2,
    effect: { type: 'efficiency_multiplier', value: 1.08 },
    maxStacks: 3,
  },
]
