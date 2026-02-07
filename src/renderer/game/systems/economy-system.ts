import {
  TileType,
  TerrainType,
  DemandLevel,
  type ResourceMarket,
  type DemandIndicators,
} from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem, SystemRegistry } from '../engine/system-registry'
import type { EventSystem } from './event-system'
import type { PolicySystem } from './policy-system'
import type { CrisisSystem } from './crisis-system'
import type { SpecializationSystem } from './specialization-system'
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
} from '../config'

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
export class EconomySystem implements IGameSystem {
  readonly id = 'economy'
  private stateManager: GameStateManager
  private eventSystem!: EventSystem
  private policySystem!: PolicySystem
  private crisisSystem!: CrisisSystem
  private specializationSystem!: SpecializationSystem

  constructor(
    stateManager: GameStateManager,
    eventSystem?: EventSystem,
    policySystem?: PolicySystem,
    crisisSystem?: CrisisSystem,
    specializationSystem?: SpecializationSystem
  ) {
    this.stateManager = stateManager
    if (eventSystem) this.eventSystem = eventSystem
    if (policySystem) this.policySystem = policySystem
    if (crisisSystem) this.crisisSystem = crisisSystem
    if (specializationSystem) this.specializationSystem = specializationSystem
  }

  init(registry: SystemRegistry): void {
    this.eventSystem = registry.get<EventSystem>('event')
    this.policySystem = registry.get<PolicySystem>('policy')
    this.crisisSystem = registry.get<CrisisSystem>('crisis')
    this.specializationSystem =
      registry.get<SpecializationSystem>('specialization')
  }

  processDailyTick(): void {
    this.processDailyEconomy()
  }

  /**
   * 计算每日经济数据并结算
   */
  processDailyEconomy(): void {
    const state = this.stateManager.getState()
    const { map, economy, synergy, facilities, tech } = state
    const currentPopulation = economy.population
    const prevSatisfaction = economy.satisfaction

    // === 聚合所有系统的乘数 ===
    const policyIncomeMult =
      this.policySystem.getAggregatedEffect('income_multiplier') ?? 1
    const policyExpenseMult =
      this.policySystem.getAggregatedEffect('expense_multiplier') ?? 1
    const policySatisfaction =
      this.policySystem.getAggregatedEffect('satisfaction') ?? 0
    const policyGrowthMult =
      this.policySystem.getAggregatedEffect('growth_multiplier') ?? 1
    const policyCapacityMult =
      this.policySystem.getAggregatedEffect('capacity_multiplier') ?? 1
    const policyIndustrialMult =
      this.policySystem.getAggregatedEffect('industrial_multiplier') ?? 1
    const policyCommercialMult =
      this.policySystem.getAggregatedEffect('commercial_multiplier') ?? 1
    const policyRoadMaintMult =
      this.policySystem.getAggregatedEffect('road_maintenance_multiplier') ?? 1
    const crisisIncomeMult =
      this.crisisSystem.getActiveMultiplier('income_multiplier_temp') ?? 1
    const crisisIndustrialMult =
      this.crisisSystem.getActiveMultiplier('industrial_multiplier_temp') ?? 1
    const crisisServicesMult =
      this.crisisSystem.getActiveMultiplier('services_multiplier_temp') ?? 1

    const specIndustrialMult =
      this.specializationSystem.getEffectValue('industrial_multiplier') ?? 1
    const specCommercialMult =
      this.specializationSystem.getEffectValue('commercial_multiplier') ?? 1
    const specIncomeMult =
      this.specializationSystem.getEffectValue('income_multiplier') ?? 1
    const specCapacityMult =
      this.specializationSystem.getEffectValue('capacity_multiplier') ?? 1
    const specSatisfaction =
      this.specializationSystem.getEffectValue('satisfaction') ?? 0
    const specAllProdMult =
      this.specializationSystem.getEffectValue('all_production_multiplier') ?? 1

    // 科技永久乘数
    const techIndustrialEff =
      tech.permanentMultipliers.industrial_efficiency ?? 1
    const techCommercialIncome =
      tech.permanentMultipliers.commercial_income ?? 1

    // 协同乘数
    const synergyIncomeRes = synergy.incomeMultByType.residential
    const synergyIncomeCom = synergy.incomeMultByType.commercial
    const synergyEffCom = synergy.effMultByType.commercial
    const synergyEffInd = synergy.effMultByType.industrial
    const synergySatisfaction = synergy.globalSatisfactionMod

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
    let facilSatTotal = 0
    let facilSatCount = 0

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
              // 设施覆盖容量乘数
              const facCoverage = facilities.coverage[`${x},${y}`]
              const facCapMult = facCoverage?.capacityMultiplier ?? 1
              capacityWeighted +=
                POP_CAPACITY_PER_RESIDENTIAL *
                capMult *
                policyCapacityMult *
                specCapacityMult *
                facCapMult
              resIncomeWeighted += BASE_RESIDENTIAL_TAX * incMult
              if (this.hasAdjacentWater(x, y)) {
                waterAdjacentResCount++
              }
              // 收集设施满意度修正（避免步骤5的二次遍历）
              if (facCoverage) {
                facilSatTotal += facCoverage.satisfactionMod
                facilSatCount++
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
          default:
            // 设施类型不参与经济产出计算
            break
        }
      }
    }

    // === 步骤 2 - 供需计算（含事件+政策+危机+特色乘数） ===
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

    // 工业产出乘数: 事件 × 政策 × 危机 × 特色 × 科技 × 协同 × 全产出
    const industrialProdMult =
      evtGoodsSupplyMult *
      policyIndustrialMult *
      crisisIndustrialMult *
      specIndustrialMult *
      techIndustrialEff *
      synergyEffInd *
      specAllProdMult

    const goodsSupply = goodsSupplyWeighted * industrialProdMult
    const goodsDemand = goodsDemandWeighted * evtGoodsDemandMult

    // 商业产出乘数
    const commercialProdMult =
      evtServicesSupplyMult *
      policyCommercialMult *
      crisisServicesMult *
      specCommercialMult *
      synergyEffCom *
      specAllProdMult

    const servicesSupply = servicesSupplyWeighted * commercialProdMult
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

    // === 步骤 4 - 收入（含所有系统乘数） ===
    const totalIncomeMult =
      evtIncomeMult * policyIncomeMult * crisisIncomeMult * specIncomeMult

    const income =
      (resIncomeWeighted * residentialEff * synergyIncomeRes +
        comIncomeWeighted *
          commercialEff *
          synergyIncomeCom *
          techCommercialIncome +
        indIncomeWeighted * industrialEff) *
      totalIncomeMult

    // 支出: 道路维护 + 设施维护
    const roadExpenses =
      roadCount * ROAD_MAINTENANCE_COST * evtRoadMaintMult * policyRoadMaintMult
    const facilityExpenses = facilities.totalMaintenance
    const expenses = (roadExpenses + facilityExpenses) * policyExpenseMult
    const netRevenue = Math.round(income - expenses)

    // === 步骤 5 - 满意度（含政策、协同、设施、特色修正） ===
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

    // 协同满意度修正
    rawSatisfaction += synergySatisfaction

    // 政策满意度修正
    rawSatisfaction += policySatisfaction

    // 特色满意度修正
    rawSatisfaction += specSatisfaction

    // 设施满意度修正（步骤1中已收集）
    if (facilSatCount > 0) {
      rawSatisfaction += facilSatTotal / facilSatCount
    }

    const satisfaction = Math.min(
      100,
      Math.max(
        0,
        prevSatisfaction * (1 - SATISFACTION_SMOOTHING) +
          rawSatisfaction * SATISFACTION_SMOOTHING
      )
    )

    // === 步骤 6 - 人口动态 ===
    const capacity = capacityWeighted
    let populationFloat = state.populationFloat
    let newPopulation = currentPopulation

    if (connRes > 0 && currentPopulation === 0) {
      newPopulation = INITIAL_POP_SEED
      populationFloat = 0
    } else if (capacity > 0 && currentPopulation > 0) {
      if (satisfaction >= NEUTRAL_SATISFACTION) {
        const happinessFactor =
          (satisfaction - NEUTRAL_SATISFACTION) / (100 - NEUTRAL_SATISFACTION)
        const roomFactor = Math.max(
          0,
          (capacity - currentPopulation) / capacity
        )
        const growth =
          MAX_GROWTH_RATE *
          capacity *
          happinessFactor *
          roomFactor *
          policyGrowthMult
        populationFloat += growth
      } else {
        const unhappinessFactor =
          (NEUTRAL_SATISFACTION - satisfaction) / NEUTRAL_SATISFACTION
        const decline = MAX_DECLINE_RATE * currentPopulation * unhappinessFactor
        populationFloat -= decline
      }

      const intPart = Math.trunc(populationFloat)
      if (intPart !== 0) {
        newPopulation = Math.max(0, currentPopulation + intPart)
        populationFloat -= intPart
      }

      if (newPopulation > capacity) {
        newPopulation = Math.floor(capacity)
        populationFloat = 0
      }
    } else if (capacity === 0) {
      newPopulation = 0
      populationFloat = 0
    }

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

    this.stateManager.addMoney(netRevenue)
    this.stateManager.update({
      populationFloat,
      economy: {
        ...state.economy,
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
      },
    })
  }

  private getEventMult(
    target: import('shared/types').EventModifierTarget
  ): number {
    return this.eventSystem.getActiveMultiplier(target) ?? 1
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
