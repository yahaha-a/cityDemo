import {
  TileType,
  TerrainType,
  DemandLevel,
  type ResourceMarket,
  type DemandIndicators,
} from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'
import type { EventSystem } from './event-system'
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  ROAD_MAINTENANCE_COST,
  POP_CAPACITY_PER_RESIDENTIAL,
  LABOR_PER_POP,
  SERVICES_DEMAND_PER_POP,
  SERVICES_PER_COMMERCIAL,
  GOODS_DEMAND_PER_COMMERCIAL,
  LABOR_DEMAND_PER_COMMERCIAL,
  GOODS_PER_INDUSTRIAL,
  LABOR_DEMAND_PER_INDUSTRIAL,
  BASE_RESIDENTIAL_TAX,
  BASE_COMMERCIAL_INCOME,
  BASE_INDUSTRIAL_INCOME,
  NEUTRAL_SATISFACTION,
  MAX_GROWTH_RATE,
  MAX_DECLINE_RATE,
  SATISFACTION_SMOOTHING,
  INITIAL_POP_SEED,
  SAT_WEIGHT_SERVICES,
  SAT_WEIGHT_EMPLOYMENT,
  SAT_WEIGHT_GOODS,
  SAT_WEIGHT_BALANCE,
  TERRAIN_INDUSTRIAL_OUTPUT_MULTIPLIER,
  WATER_ADJACENCY_SATISFACTION_BONUS,
  LEVEL_CAPACITY_MULTIPLIER,
  LEVEL_OUTPUT_MULTIPLIER,
  LEVEL_DEMAND_MULTIPLIER,
  LEVEL_INCOME_MULTIPLIER,
} from '../constants'

/** 安全比率计算：min(supply/demand, 1)，demand=0 时返回 1 */
function safeRatio(supply: number, demand: number): number {
  if (demand <= 0) return 1
  return Math.min(supply / demand, 1)
}

/** 根据满足率计算需求等级 */
function toDemandLevel(ratio: number): DemandLevel {
  if (ratio >= 0.9) return DemandLevel.Low
  if (ratio >= 0.7) return DemandLevel.Balanced
  if (ratio >= 0.4) return DemandLevel.High
  return DemandLevel.Critical
}

/**
 * 经济系统 - 供需网络模型
 */
export class EconomySystem {
  private stateManager: GameStateManager
  private eventSystem: EventSystem | null = null

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  setEventSystem(eventSystem: EventSystem): void {
    this.eventSystem = eventSystem
  }

  /**
   * 计算每日经济数据并结算
   */
  processDailyEconomy(): void {
    const state = this.stateManager.getState()
    const { map, economy } = state
    const currentPopulation = economy.population
    const prevSatisfaction = economy.satisfaction

    // === 步骤 1 - 普查（支持等级和地形加权） ===
    let capacityWeighted = 0
    let goodsSupplyWeighted = 0
    let goodsDemandWeighted = 0
    let servicesSupplyWeighted = 0
    let resIncomeWeighted = 0
    let comIncomeWeighted = 0
    let indIncomeWeighted = 0
    let laborDemandComWeighted = 0
    let laborDemandIndWeighted = 0
    let roadCount = 0
    let connRes = 0
    let connCom = 0
    let connInd = 0
    let waterAdjacentResCount = 0

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        switch (tile.type) {
          case TileType.Road:
            roadCount++
            break
          case TileType.Residential:
            if (tile.connected) {
              connRes++
              const li = tile.level - 1
              const capMult = LEVEL_CAPACITY_MULTIPLIER[li]
              const incMult = LEVEL_INCOME_MULTIPLIER[li]
              capacityWeighted += POP_CAPACITY_PER_RESIDENTIAL * capMult
              resIncomeWeighted += BASE_RESIDENTIAL_TAX * incMult
              // 检查水域相邻
              if (this.hasAdjacentWater(x, y)) {
                waterAdjacentResCount++
              }
            }
            break
          case TileType.Commercial:
            if (tile.connected) {
              connCom++
              const li = tile.level - 1
              const outMult = LEVEL_OUTPUT_MULTIPLIER[li]
              const demMult = LEVEL_DEMAND_MULTIPLIER[li]
              const incMult = LEVEL_INCOME_MULTIPLIER[li]
              servicesSupplyWeighted += SERVICES_PER_COMMERCIAL * outMult
              goodsDemandWeighted += GOODS_DEMAND_PER_COMMERCIAL * demMult
              laborDemandComWeighted += LABOR_DEMAND_PER_COMMERCIAL * demMult
              comIncomeWeighted += BASE_COMMERCIAL_INCOME * incMult
            }
            break
          case TileType.Industrial:
            if (tile.connected) {
              connInd++
              const li = tile.level - 1
              const outMult = LEVEL_OUTPUT_MULTIPLIER[li]
              const demMult = LEVEL_DEMAND_MULTIPLIER[li]
              const incMult = LEVEL_INCOME_MULTIPLIER[li]
              const terrainMult =
                TERRAIN_INDUSTRIAL_OUTPUT_MULTIPLIER[tile.terrain]
              goodsSupplyWeighted +=
                GOODS_PER_INDUSTRIAL * outMult * terrainMult
              laborDemandIndWeighted += LABOR_DEMAND_PER_INDUSTRIAL * demMult
              indIncomeWeighted += BASE_INDUSTRIAL_INCOME * incMult
            }
            break
        }
      }
    }

    // === 步骤 2 - 供需计算（含事件乘数） ===
    const evtLaborSupplyMult = this.getEventMult('laborSupplyMultiplier')
    const evtLaborDemandMult = this.getEventMult('laborDemandMultiplier')
    const evtGoodsSupplyMult = this.getEventMult('goodsSupplyMultiplier')
    const evtGoodsDemandMult = this.getEventMult('goodsDemandMultiplier')
    const evtServicesSupplyMult = this.getEventMult('servicesSupplyMultiplier')
    const evtServicesDemandMult = this.getEventMult('servicesDemandMultiplier')
    const evtIncomeMult = this.getEventMult('incomeMultiplier')
    const evtRoadMaintMult = this.getEventMult('roadMaintenanceMultiplier')

    const laborSupply = currentPopulation * LABOR_PER_POP * evtLaborSupplyMult
    const laborDemand =
      (laborDemandComWeighted + laborDemandIndWeighted) * evtLaborDemandMult

    const goodsSupply = goodsSupplyWeighted * evtGoodsSupplyMult
    const goodsDemand = goodsDemandWeighted * evtGoodsDemandMult

    const servicesSupply = servicesSupplyWeighted * evtServicesSupplyMult
    // 服务需求基于实际人口
    const servicesDemand =
      currentPopulation * SERVICES_DEMAND_PER_POP * evtServicesDemandMult

    // === 步骤 3 - 级联效率 ===
    const laborRatio = safeRatio(laborSupply, laborDemand)
    const industrialEff = laborRatio

    const actualGoods = goodsSupply * industrialEff
    const actualGoodsRatio = safeRatio(actualGoods, goodsDemand)
    const commercialEff = Math.min(actualGoodsRatio, laborRatio)

    const actualServices = servicesSupply * commercialEff
    const actualServicesRatio = safeRatio(actualServices, servicesDemand)
    const residentialEff = actualServicesRatio

    // === 步骤 4 - 收入（含事件乘数） ===
    const income =
      (resIncomeWeighted * residentialEff +
        comIncomeWeighted * commercialEff +
        indIncomeWeighted * industrialEff) *
      evtIncomeMult
    const expenses = roadCount * ROAD_MAINTENANCE_COST * evtRoadMaintMult
    const netRevenue = Math.round(income - expenses)

    // === 步骤 5 - 满意度 ===
    const employmentRatio = safeRatio(laborDemand, laborSupply)
    const goodsRatio = safeRatio(actualGoods, goodsDemand)
    const servicesRatio = actualServicesRatio
    const avgEfficiency = (residentialEff + commercialEff + industrialEff) / 3

    let rawSatisfaction: number
    if (connRes === 0 && connCom === 0 && connInd === 0) {
      rawSatisfaction = 75
    } else {
      rawSatisfaction =
        (servicesRatio * SAT_WEIGHT_SERVICES +
          employmentRatio * SAT_WEIGHT_EMPLOYMENT +
          goodsRatio * SAT_WEIGHT_GOODS +
          avgEfficiency * SAT_WEIGHT_BALANCE) *
        100
    }

    // 水域相邻加成
    if (waterAdjacentResCount > 0 && connRes > 0) {
      rawSatisfaction +=
        (waterAdjacentResCount * WATER_ADJACENCY_SATISFACTION_BONUS) / connRes
    }

    const satisfaction = Math.min(
      100,
      prevSatisfaction * (1 - SATISFACTION_SMOOTHING) +
        rawSatisfaction * SATISFACTION_SMOOTHING
    )

    // === 步骤 6 - 人口动态 ===
    const capacity = capacityWeighted
    let populationFloat = state.populationFloat
    let newPopulation = currentPopulation

    if (connRes > 0 && currentPopulation === 0) {
      // 种子人口启动经济
      newPopulation = INITIAL_POP_SEED
      populationFloat = 0
    } else if (capacity > 0 && currentPopulation > 0) {
      if (satisfaction >= NEUTRAL_SATISFACTION) {
        // 人口增长
        const happinessFactor =
          (satisfaction - NEUTRAL_SATISFACTION) / (100 - NEUTRAL_SATISFACTION)
        const roomFactor = Math.max(
          0,
          (capacity - currentPopulation) / capacity
        )
        const growth = MAX_GROWTH_RATE * capacity * happinessFactor * roomFactor
        populationFloat += growth
      } else {
        // 人口下降
        const unhappinessFactor =
          (NEUTRAL_SATISFACTION - satisfaction) / NEUTRAL_SATISFACTION
        const decline = MAX_DECLINE_RATE * currentPopulation * unhappinessFactor
        populationFloat -= decline
      }

      // 处理小数累积
      const intPart = Math.trunc(populationFloat)
      if (intPart !== 0) {
        newPopulation = Math.max(0, currentPopulation + intPart)
        populationFloat -= intPart
      }

      // 不超过容量
      if (newPopulation > capacity) {
        newPopulation = Math.floor(capacity)
        populationFloat = 0
      }
    } else if (capacity === 0) {
      // 无住宅，人口归零
      newPopulation = 0
      populationFloat = 0
    }

    this.stateManager.setPopulationFloat(populationFloat)

    // === 步骤 7 - 需求指示 ===
    const demandIndicators: DemandIndicators = {
      residential: toDemandLevel(laborRatio),
      commercial: toDemandLevel(servicesRatio),
      industrial: toDemandLevel(goodsRatio),
    }

    const resources: ResourceMarket = {
      labor: { supply: laborSupply, demand: laborDemand, ratio: laborRatio },
      goods: {
        supply: actualGoods,
        demand: goodsDemand,
        ratio: goodsRatio,
      },
      services: {
        supply: actualServices,
        demand: servicesDemand,
        ratio: servicesRatio,
      },
    }

    // 更新状态（addMoneySilent 不触发 notify，由 updateEconomy 统一触发一次）
    this.stateManager.addMoneySilent(netRevenue)
    this.stateManager.updateEconomy({
      income: Math.round(income),
      expenses: Math.round(expenses),
      population: newPopulation,
      lastDayRevenue: netRevenue,
      satisfaction,
      populationCapacity: Math.floor(capacity),
      resources,
      demandIndicators,
      efficiencyByType: {
        residential: residentialEff,
        commercial: commercialEff,
        industrial: industrialEff,
      },
    })
  }

  private getEventMult(
    target: import('shared/game-types').EventModifierTarget
  ): number {
    return this.eventSystem?.getActiveMultiplier(target) ?? 1
  }

  private hasAdjacentWater(x: number, y: number): boolean {
    const { map } = this.stateManager.getState()
    const dirs = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]
    for (const [dx, dy] of dirs) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
        if (map.tiles[ny][nx].terrain === TerrainType.Water) return true
      }
    }
    return false
  }

  /**
   * 获取预测数据（不结算，只计算）
   */
  getProjection(): {
    income: number
    expenses: number
    population: number
    netRevenue: number
    satisfaction: number
  } {
    const state = this.stateManager.getState()
    const { map, economy } = state
    const currentPopulation = economy.population

    let resIncome = 0
    let comIncome = 0
    let indIncome = 0
    let roadCount = 0
    let laborDemandCom = 0
    let laborDemandInd = 0
    let goodsSupplyW = 0
    let goodsDemandW = 0
    let servicesSupplyW = 0

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        switch (tile.type) {
          case TileType.Road:
            roadCount++
            break
          case TileType.Residential:
            if (tile.connected) {
              resIncome +=
                BASE_RESIDENTIAL_TAX * LEVEL_INCOME_MULTIPLIER[tile.level - 1]
            }
            break
          case TileType.Commercial:
            if (tile.connected) {
              const li = tile.level - 1
              servicesSupplyW +=
                SERVICES_PER_COMMERCIAL * LEVEL_OUTPUT_MULTIPLIER[li]
              goodsDemandW +=
                GOODS_DEMAND_PER_COMMERCIAL * LEVEL_DEMAND_MULTIPLIER[li]
              laborDemandCom +=
                LABOR_DEMAND_PER_COMMERCIAL * LEVEL_DEMAND_MULTIPLIER[li]
              comIncome += BASE_COMMERCIAL_INCOME * LEVEL_INCOME_MULTIPLIER[li]
            }
            break
          case TileType.Industrial:
            if (tile.connected) {
              const li = tile.level - 1
              const tMult = TERRAIN_INDUSTRIAL_OUTPUT_MULTIPLIER[tile.terrain]
              goodsSupplyW +=
                GOODS_PER_INDUSTRIAL * LEVEL_OUTPUT_MULTIPLIER[li] * tMult
              laborDemandInd +=
                LABOR_DEMAND_PER_INDUSTRIAL * LEVEL_DEMAND_MULTIPLIER[li]
              indIncome += BASE_INDUSTRIAL_INCOME * LEVEL_INCOME_MULTIPLIER[li]
            }
            break
        }
      }
    }

    const laborSupply = currentPopulation * LABOR_PER_POP
    const laborDemand = laborDemandCom + laborDemandInd
    const laborRatio = safeRatio(laborSupply, laborDemand)

    const industrialEff = laborRatio
    const actualGoods = goodsSupplyW * industrialEff
    const actualGoodsRatio = safeRatio(actualGoods, goodsDemandW)
    const commercialEff = Math.min(actualGoodsRatio, laborRatio)

    const actualServices = servicesSupplyW * commercialEff
    const servicesDemand = currentPopulation * SERVICES_DEMAND_PER_POP
    const actualServicesRatio = safeRatio(actualServices, servicesDemand)
    const residentialEff = actualServicesRatio

    const income =
      resIncome * residentialEff +
      comIncome * commercialEff +
      indIncome * industrialEff
    const expenses = roadCount * ROAD_MAINTENANCE_COST

    return {
      income: Math.round(income),
      expenses,
      population: currentPopulation,
      netRevenue: Math.round(income - expenses),
      satisfaction: economy.satisfaction,
    }
  }
}
