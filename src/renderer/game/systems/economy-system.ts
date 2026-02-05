import { TileType } from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  INCOME_PER_RESIDENTIAL,
  INCOME_PER_COMMERCIAL,
  INCOME_PER_INDUSTRIAL,
  POPULATION_PER_RESIDENTIAL,
  ROAD_MAINTENANCE_COST,
} from '../constants'

/**
 * 经济系统 - 处理收入、支出和人口计算
 */
export class EconomySystem {
  private stateManager: GameStateManager

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  /**
   * 计算每日经济数据并结算
   */
  processDailyEconomy(): void {
    const { map } = this.stateManager.getState()

    let income = 0
    let expenses = 0
    let population = 0
    let connectedResidential = 0
    let connectedCommercial = 0
    let connectedIndustrial = 0
    let roadCount = 0

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]

        switch (tile.type) {
          case TileType.Road:
            roadCount++
            break
          case TileType.Residential:
            if (tile.connected) {
              connectedResidential++
              population += POPULATION_PER_RESIDENTIAL
            }
            break
          case TileType.Commercial:
            if (tile.connected) {
              connectedCommercial++
            }
            break
          case TileType.Industrial:
            if (tile.connected) {
              connectedIndustrial++
            }
            break
        }
      }
    }

    // 计算收入
    income += connectedResidential * INCOME_PER_RESIDENTIAL
    income += connectedCommercial * INCOME_PER_COMMERCIAL
    income += connectedIndustrial * INCOME_PER_INDUSTRIAL

    // 商业收入受人口影响：有人口才有消费
    const commercialBonus = Math.min(population, connectedCommercial * 10)
    income += Math.floor(commercialBonus * 0.5)

    // 计算支出
    expenses = roadCount * ROAD_MAINTENANCE_COST

    // 净收入
    const netRevenue = income - expenses

    // 更新状态
    this.stateManager.addMoney(netRevenue)
    this.stateManager.updateEconomy({
      income,
      expenses,
      population,
      lastDayRevenue: netRevenue,
    })
  }

  /**
   * 获取预测数据（不结算，只计算）
   */
  getProjection(): {
    income: number
    expenses: number
    population: number
    netRevenue: number
  } {
    const { map } = this.stateManager.getState()

    let income = 0
    let expenses = 0
    let population = 0
    let roadCount = 0
    let connectedCommercial = 0

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]

        switch (tile.type) {
          case TileType.Road:
            roadCount++
            break
          case TileType.Residential:
            if (tile.connected) {
              income += INCOME_PER_RESIDENTIAL
              population += POPULATION_PER_RESIDENTIAL
            }
            break
          case TileType.Commercial:
            if (tile.connected) {
              income += INCOME_PER_COMMERCIAL
              connectedCommercial++
            }
            break
          case TileType.Industrial:
            if (tile.connected) {
              income += INCOME_PER_INDUSTRIAL
            }
            break
        }
      }
    }

    const commercialBonus = Math.min(population, connectedCommercial * 10)
    income += Math.floor(commercialBonus * 0.5)
    expenses = roadCount * ROAD_MAINTENANCE_COST

    return {
      income,
      expenses,
      population,
      netRevenue: income - expenses,
    }
  }
}
