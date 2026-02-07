import {
  type GameState,
  type Tile,
  TileType,
  ToolType,
  toolToTileType,
  isFacilityType,
  isCoreBuilding,
} from 'shared/types'
import {
  BUILDING_COSTS,
  TERRAIN_BUILD_COST_MULTIPLIER,
  UPGRADE_COST_MULTIPLIER,
  MAX_BUILDING_LEVEL,
  UPGRADE_MIN_EFFICIENCY,
  getFacilityTemplate,
} from '../config'

export type HoverValidity = 'valid' | 'invalid' | 'none'

/**
 * 建造可行性查询 — 从 IsometricRenderer 提取的纯业务逻辑
 * 无 Canvas 依赖，可独立单元测试
 */
export class BuildQuery {
  /** 获取悬停瓦片的有效性标志 */
  getHoverValidity(state: GameState): HoverValidity {
    const { hoveredTile, currentTool, money } = state
    if (!hoveredTile) return 'none'

    const { x, y } = hoveredTile
    if (x < 0 || x >= state.map.width || y < 0 || y >= state.map.height)
      return 'none'

    const tile = state.map.tiles[y][x]

    if (currentTool === ToolType.Select) return 'valid'

    if (currentTool === ToolType.Upgrade) {
      return this.canUpgradeTile(tile, state) ? 'valid' : 'invalid'
    }

    if (currentTool === ToolType.Demolish) {
      return tile.type === TileType.Empty ? 'invalid' : 'valid'
    }

    const targetType = toolToTileType[currentTool]
    if (!targetType) return 'valid'

    if (isFacilityType(targetType)) {
      return this.canBuildFacility(tile, targetType, money, state)
        ? 'valid'
        : 'invalid'
    }

    return this.canBuildRegular(tile, targetType, money) ? 'valid' : 'invalid'
  }

  private canUpgradeTile(tile: Tile, state: GameState): boolean {
    if (!isCoreBuilding(tile.type)) return false
    if (tile.level >= MAX_BUILDING_LEVEL) return false
    if (tile.level === 2 && !state.milestones.upgradeLv3Unlocked) return false
    if (!tile.connected) return false

    const efficiency =
      tile.type === TileType.Residential
        ? state.economy.efficiencyByType.residential
        : tile.type === TileType.Commercial
          ? state.economy.efficiencyByType.commercial
          : state.economy.efficiencyByType.industrial
    if (efficiency < UPGRADE_MIN_EFFICIENCY) return false

    const baseCost = BUILDING_COSTS[tile.type as keyof typeof BUILDING_COSTS]
    if (baseCost === undefined) return false
    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[tile.terrain]
    const mult = Number.isFinite(terrainMult) ? terrainMult : 1
    const cost = Math.ceil(
      baseCost * mult * UPGRADE_COST_MULTIPLIER[tile.level]
    )
    return state.money >= cost
  }

  private canBuildFacility(
    tile: Tile,
    targetType: TileType,
    money: number,
    state: GameState
  ): boolean {
    const template = getFacilityTemplate(targetType)
    if (!template) return false

    const isUnlocked =
      !template.unlockTech ||
      state.tech.researched.includes(template.unlockTech)
    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[tile.terrain]
    const cost = Number.isFinite(terrainMult)
      ? Math.ceil(template.buildCost * terrainMult)
      : null

    return (
      tile.type === TileType.Empty &&
      cost !== null &&
      money >= cost &&
      isUnlocked
    )
  }

  private canBuildRegular(
    tile: Tile,
    targetType: TileType,
    money: number
  ): boolean {
    const baseCost = BUILDING_COSTS[targetType as keyof typeof BUILDING_COSTS]
    if (baseCost === undefined) return true

    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[tile.terrain]
    return (
      tile.type === TileType.Empty &&
      Number.isFinite(terrainMult) &&
      money >= Math.ceil(baseCost * terrainMult)
    )
  }
}
