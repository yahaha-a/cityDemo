import { TileType } from 'shared/types'
import type { ActiveChainInfo } from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem, SystemRegistry } from '../engine/system-registry'
import { PRODUCTION_CHAINS } from '../config/production'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'

/**
 * 产业链系统 — 每日扫描地图建筑，计算各链条完成度
 */
export class ProductionChainSystem implements IGameSystem {
  readonly id = 'production'
  private stateManager: GameStateManager

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  init(_registry: SystemRegistry): void {
    // 无跨系统依赖
  }

  /**
   * 每日 tick — 扫描建筑数量，计算每条产业链的完成比例
   */
  processDailyTick(): void {
    const state = this.stateManager.getState()
    const { map } = state

    // 统计已连接道路的各类型建筑数量
    const connectedCounts: Partial<Record<TileType, number>> = {}
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        if (tile.type === TileType.Empty || tile.type === TileType.Road)
          continue
        if (!tile.connected) continue
        connectedCounts[tile.type] = (connectedCounts[tile.type] ?? 0) + 1
      }
    }

    const activeChains: Record<string, ActiveChainInfo> = {}

    for (const chain of PRODUCTION_CHAINS) {
      // 检查科技解锁
      if (
        chain.unlockTech &&
        !state.tech.researched.includes(chain.unlockTech)
      ) {
        continue
      }

      const nodeCompletion: number[] = []

      for (const node of chain.nodes) {
        const available = connectedCounts[node.buildingType] ?? 0
        const ratio = Math.min(available / node.requiredCount, 1)
        nodeCompletion.push(ratio)
      }

      // 整体完成比例 = 所有节点完成比例的最小值
      // 这确保整条链必须每个节点都满足
      const completionRatio =
        nodeCompletion.length > 0 ? Math.min(...nodeCompletion) : 0

      activeChains[chain.id] = {
        chainId: chain.id,
        nodeCompletion,
        completionRatio,
      }
    }

    state.productionChains = { activeChains }
    this.stateManager.update({
      productionChains: { activeChains },
    })
  }
}
