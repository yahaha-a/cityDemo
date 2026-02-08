import {
  type GameState,
  type Tile,
  ToolType,
  toolToBuildingId,
  toolToRoadType,
  isRoadTool,
  isTerraformTool,
  isFacilityBuilding,
} from 'shared/types'
import { buildingIdToCategory } from 'shared/types/building-compat'
import { getBuildingDef } from '../config/building-defs'
import {
  TERRAIN_BUILD_COST_MULTIPLIER,
  UPGRADE_COST_MULTIPLIER,
  UPGRADE_MIN_EFFICIENCY,
} from '../config'
import { ROAD_CONFIGS } from '../config/road'
import { getTerraformAction } from '../config/terraform'

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
      return tile.buildingId === 'empty' ? 'invalid' : 'valid'
    }

    // 地形改造工具验证
    if (isTerraformTool(currentTool)) {
      return this.canTerraform(tile, currentTool, money, state)
        ? 'valid'
        : 'invalid'
    }

    // 检查 selectedBuildingId
    const selectedBuildingId = state.selectedBuildingId
    if (selectedBuildingId) {
      const def = getBuildingDef(selectedBuildingId)
      if (def) {
        const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[tile.terrain]
        const cost = Number.isFinite(terrainMult)
          ? Math.ceil(def.cost * terrainMult)
          : null
        const isUnlocked =
          def.unlockCondition.type === 'initial' ||
          (def.unlockCondition.type === 'tech' &&
            state.tech.researched.includes(def.unlockCondition.id!)) ||
          (def.unlockCondition.type === 'milestone' &&
            state.milestones.achieved.includes(def.unlockCondition.id!))

        return tile.buildingId === 'empty' &&
          cost !== null &&
          money >= cost &&
          isUnlocked
          ? 'valid'
          : 'invalid'
      }
    }

    const targetBid = toolToBuildingId[currentTool]
    if (!targetBid) return 'valid'

    // 道路工具特殊验证
    if (isRoadTool(currentTool)) {
      return this.canBuildRoad(tile, currentTool, money) ? 'valid' : 'invalid'
    }

    if (isFacilityBuilding(targetBid)) {
      return this.canBuildFacility(tile, targetBid, money, state)
        ? 'valid'
        : 'invalid'
    }

    return this.canBuildRegular(tile, targetBid, money) ? 'valid' : 'invalid'
  }

  private canUpgradeTile(tile: Tile, state: GameState): boolean {
    const bid = tile.buildingId
    if (bid === 'empty' || bid === 'road') return false

    const def = getBuildingDef(bid)
    if (!def) return false

    if (tile.level >= def.maxLevel) return false
    if (tile.level === 2 && !state.milestones.upgradeLv3Unlocked) return false
    if (!tile.connected) return false

    const category = buildingIdToCategory(bid)
    if (
      category === 'residential' ||
      category === 'commercial' ||
      category === 'industrial'
    ) {
      const efficiency = state.economy.efficiencyByType[category]
      if (efficiency < UPGRADE_MIN_EFFICIENCY) return false
    }

    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[tile.terrain]
    const mult = Number.isFinite(terrainMult) ? terrainMult : 1
    const cost = Math.ceil(
      def.cost * mult * UPGRADE_COST_MULTIPLIER[tile.level]
    )
    return state.money >= cost
  }

  private canBuildFacility(
    tile: Tile,
    buildingId: string,
    money: number,
    state: GameState
  ): boolean {
    const def = getBuildingDef(buildingId)
    if (!def) return false

    const isUnlocked =
      def.unlockCondition.type === 'initial' ||
      (def.unlockCondition.type === 'tech' &&
        state.tech.researched.includes(def.unlockCondition.id!)) ||
      (def.unlockCondition.type === 'milestone' &&
        state.milestones.achieved.includes(def.unlockCondition.id!))

    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[tile.terrain]
    const cost = Number.isFinite(terrainMult)
      ? Math.ceil(def.cost * terrainMult)
      : null

    return (
      tile.buildingId === 'empty' &&
      cost !== null &&
      money >= cost &&
      isUnlocked
    )
  }

  private canTerraform(
    tile: Tile,
    tool: ToolType,
    money: number,
    state: GameState
  ): boolean {
    if (tile.buildingId !== 'empty') return false

    const action = getTerraformAction(tool)
    if (!action) return false

    if (!action.fromTerrains.includes(tile.terrain)) return false

    if (action.unlockTech) {
      if (!state.tech.researched.includes(action.unlockTech)) return false
    }

    return money >= action.cost
  }

  private canBuildRoad(tile: Tile, tool: ToolType, money: number): boolean {
    if (tile.buildingId !== 'empty') return false

    const roadType = toolToRoadType[tool]
    if (!roadType) return false

    const config = ROAD_CONFIGS[roadType]

    // 地形限制检查
    if (config.terrainAllowances.length > 0) {
      if (!config.terrainAllowances.includes(tile.terrain)) return false
    } else {
      if (config.terrainRestrictions.includes(tile.terrain)) return false
    }

    return money >= config.buildCost
  }

  private canBuildRegular(
    tile: Tile,
    buildingId: string,
    money: number
  ): boolean {
    const def = getBuildingDef(buildingId)
    if (!def) return true

    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[tile.terrain]
    return (
      tile.buildingId === 'empty' &&
      Number.isFinite(terrainMult) &&
      money >= Math.ceil(def.cost * terrainMult)
    )
  }
}
