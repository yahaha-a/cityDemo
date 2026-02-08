import {
  TerrainType,
  RoadType,
  DemandLevel,
  type ResourceMarket,
  type DemandIndicators,
} from 'shared/types'
import { buildingIdToCategory } from 'shared/types/building-defs'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem, SystemRegistry } from '../engine/system-registry'
import type { EventSystem } from './event-system'
import type { PolicySystem } from './policy-system'
import type { CrisisSystem } from './crisis-system'
import type { SpecializationSystem } from './specialization-system'
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  POP_CAPACITY_PER_RESIDENTIAL,
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
  WATER_ADJACENCY_SATISFACTION_BONUS,
  LEVEL_CAPACITY_MULTIPLIER,
  LEVEL_INCOME_MULTIPLIER,
} from '../config'
import { ROAD_CONFIGS } from '../config/road'

/** 安全比率计算：clamp(supply/demand, 0, 1)，demand≤0 时返回 1 */
function safeRatio(supply: number, demand: number): number {
  if (demand <= 0) return 1
  return Math.min(Math.max(supply / demand, 0), 1)
}

/** 根据满足率计算需求等级 */
function toDemandLevel(ratio: number): DemandLevel {
  if (ratio >= 0.9) return DemandLevel.Low
  if (ratio >= 0.7) return DemandLevel.Balanced
  if (ratio >= 0.4) return DemandLevel.High
  return DemandLevel.Critical
}

/** 聚合后的系统乘数 */
interface SystemMultipliers {
  policyIncomeMult: number
  policyExpenseMult: number
  policySatisfaction: number
  policyGrowthMult: number
  policyCapacityMult: number
  policyIndustrialMult: number
  policyCommercialMult: number
  policyRoadMaintMult: number
  crisisIncomeMult: number
  crisisIndustrialMult: number
  crisisServicesMult: number
  specIndustrialMult: number
  specCommercialMult: number
  specIncomeMult: number
  specCapacityMult: number
  specSatisfaction: number
  specAllProdMult: number
  techIndustrialEff: number
  techCommercialIncome: number
  synergyIncomeRes: number
  synergyIncomeCom: number
  synergyIncomeInd: number
  synergyEffCom: number
  synergyEffInd: number
  synergySatisfaction: number
  evtLaborSupplyMult: number
  evtLaborDemandMult: number
  evtGoodsSupplyMult: number
  evtGoodsDemandMult: number
  evtServicesSupplyMult: number
  evtServicesDemandMult: number
  evtIncomeMult: number
  evtRoadMaintMult: number
}

/** 瓦片普查结果 */
interface TileCensus {
  capacityWeighted: number
  resIncomeWeighted: number
  comIncomeWeighted: number
  indIncomeWeighted: number
  roadMaintenanceTotal: number
  connRes: number
  connCom: number
  connInd: number
  waterAdjacentResCount: number
  facilSatTotal: number
  facilSatCount: number
}

/** 经济计算结果 */
interface EconomicsResult {
  income: number
  expenses: number
  netRevenue: number
  laborRatio: number
  industrialEff: number
  commercialEff: number
  residentialEff: number
  goodsRatio: number
  servicesRatio: number
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

  /** tileCensus 缓存 */
  private cachedCensus: TileCensus | null = null
  private lastCensusMapRef: unknown = null
  private lastCensusBuildingEffectsRef: unknown = null

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

  /** 聚合所有系统的乘数 */
  private collectMultipliers(): SystemMultipliers {
    const state = this.stateManager.getState()
    const { buildingEffects, tech } = state

    return {
      policyIncomeMult:
        this.policySystem.getAggregatedEffect('income_multiplier') ?? 1,
      policyExpenseMult:
        this.policySystem.getAggregatedEffect('expense_multiplier') ?? 1,
      policySatisfaction:
        this.policySystem.getAggregatedEffect('satisfaction') ?? 0,
      policyGrowthMult:
        this.policySystem.getAggregatedEffect('growth_multiplier') ?? 1,
      policyCapacityMult:
        this.policySystem.getAggregatedEffect('capacity_multiplier') ?? 1,
      policyIndustrialMult:
        this.policySystem.getAggregatedEffect('industrial_multiplier') ?? 1,
      policyCommercialMult:
        this.policySystem.getAggregatedEffect('commercial_multiplier') ?? 1,
      policyRoadMaintMult:
        this.policySystem.getAggregatedEffect('road_maintenance_multiplier') ??
        1,
      crisisIncomeMult:
        this.crisisSystem.getActiveMultiplier('income_multiplier_temp') ?? 1,
      crisisIndustrialMult:
        this.crisisSystem.getActiveMultiplier('industrial_multiplier_temp') ??
        1,
      crisisServicesMult:
        this.crisisSystem.getActiveMultiplier('services_multiplier_temp') ?? 1,
      specIndustrialMult:
        this.specializationSystem.getEffectValue('industrial_multiplier') ?? 1,
      specCommercialMult:
        this.specializationSystem.getEffectValue('commercial_multiplier') ?? 1,
      specIncomeMult:
        this.specializationSystem.getEffectValue('income_multiplier') ?? 1,
      specCapacityMult:
        this.specializationSystem.getEffectValue('capacity_multiplier') ?? 1,
      specSatisfaction:
        this.specializationSystem.getEffectValue('satisfaction') ?? 0,
      specAllProdMult:
        this.specializationSystem.getEffectValue('all_production_multiplier') ??
        1,
      techIndustrialEff: tech.permanentMultipliers.industrial_efficiency ?? 1,
      techCommercialIncome: tech.permanentMultipliers.commercial_income ?? 1,
      synergyIncomeRes: buildingEffects.incomeMultByCategory.residential,
      synergyIncomeCom: buildingEffects.incomeMultByCategory.commercial,
      synergyIncomeInd: buildingEffects.incomeMultByCategory.industrial,
      synergyEffCom: buildingEffects.effMultByCategory.commercial,
      synergyEffInd: buildingEffects.effMultByCategory.industrial,
      synergySatisfaction: buildingEffects.globalSatisfactionMod,
      evtLaborSupplyMult: this.getEventMult('laborSupplyMultiplier'),
      evtLaborDemandMult: this.getEventMult('laborDemandMultiplier'),
      evtGoodsSupplyMult: this.getEventMult('goodsSupplyMultiplier'),
      evtGoodsDemandMult: this.getEventMult('goodsDemandMultiplier'),
      evtServicesSupplyMult: this.getEventMult('servicesSupplyMultiplier'),
      evtServicesDemandMult: this.getEventMult('servicesDemandMultiplier'),
      evtIncomeMult: this.getEventMult('incomeMultiplier'),
      evtRoadMaintMult: this.getEventMult('roadMaintenanceMultiplier'),
    }
  }

  /** 遍历地图瓦片，统一计算容量、收入、道路维护等 */
  private runTileCensus(mults: SystemMultipliers): TileCensus {
    const state = this.stateManager.getState()
    const { map, buildingEffects } = state

    // 缓存命中：map 和 buildingEffects 引用未变则直接返回
    if (
      this.cachedCensus &&
      map === this.lastCensusMapRef &&
      buildingEffects === this.lastCensusBuildingEffectsRef
    ) {
      return this.cachedCensus
    }

    this.lastCensusMapRef = map
    this.lastCensusBuildingEffectsRef = buildingEffects

    const census: TileCensus = {
      capacityWeighted: 0,
      resIncomeWeighted: 0,
      comIncomeWeighted: 0,
      indIncomeWeighted: 0,
      roadMaintenanceTotal: 0,
      connRes: 0,
      connCom: 0,
      connInd: 0,
      waterAdjacentResCount: 0,
      facilSatTotal: 0,
      facilSatCount: 0,
    }

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        const bid = tile.buildingId

        if (bid === 'road') {
          const roadType = tile.roadType ?? RoadType.Normal
          census.roadMaintenanceTotal += ROAD_CONFIGS[roadType].maintenanceCost
          continue
        }

        if (!tile.connected) continue

        const category = buildingIdToCategory(bid)
        switch (category) {
          case 'residential':
            {
              census.connRes++
              const li = tile.level - 1
              const capMult = LEVEL_CAPACITY_MULTIPLIER[li]
              const incMult = LEVEL_INCOME_MULTIPLIER[li]
              const tileEffect = buildingEffects.tileEffects[`${x},${y}`]
              const facCapMult = tileEffect?.capacityMultiplier ?? 1
              census.capacityWeighted +=
                POP_CAPACITY_PER_RESIDENTIAL *
                capMult *
                mults.policyCapacityMult *
                mults.specCapacityMult *
                facCapMult
              census.resIncomeWeighted += BASE_RESIDENTIAL_TAX * incMult
              if (this.hasAdjacentWater(x, y, map)) {
                census.waterAdjacentResCount++
              }
              if (tileEffect) {
                census.facilSatTotal += tileEffect.satisfactionMod
                census.facilSatCount++
              }
            }
            break
          case 'commercial':
            {
              census.connCom++
              const incMult = LEVEL_INCOME_MULTIPLIER[tile.level - 1]
              census.comIncomeWeighted += BASE_COMMERCIAL_INCOME * incMult
            }
            break
          case 'industrial':
            {
              census.connInd++
              const incMult = LEVEL_INCOME_MULTIPLIER[tile.level - 1]
              census.indIncomeWeighted += BASE_INDUSTRIAL_INCOME * incMult
            }
            break
          default:
            break
        }
      }
    }

    this.cachedCensus = census
    return census
  }

  /** 统一级联效率、收入/支出计算 */
  private computeEconomics(
    census: TileCensus,
    mults: SystemMultipliers
  ): EconomicsResult {
    const { buildingEffects } = this.stateManager.getState()
    const res = buildingEffects.resources

    // 使用 BuildingEffectSystem 计算的基础资源数据，再叠加系统乘数
    const laborSupply = res.laborSupply * mults.evtLaborSupplyMult
    const laborDemand = res.laborDemand * mults.evtLaborDemandMult

    // 工业产出乘数: 事件 × 政策 × 危机 × 特色 × 科技 × 协同 × 全产出
    const industrialProdMult =
      mults.evtGoodsSupplyMult *
      mults.policyIndustrialMult *
      mults.crisisIndustrialMult *
      mults.specIndustrialMult *
      mults.techIndustrialEff *
      mults.synergyEffInd *
      mults.specAllProdMult

    const goodsSupply = res.goodsSupply * industrialProdMult
    const goodsDemand = res.goodsDemand * mults.evtGoodsDemandMult

    // 商业产出乘数
    const commercialProdMult =
      mults.evtServicesSupplyMult *
      mults.policyCommercialMult *
      mults.crisisServicesMult *
      mults.specCommercialMult *
      mults.synergyEffCom *
      mults.specAllProdMult

    const servicesSupply = res.servicesSupply * commercialProdMult
    const servicesDemand = res.servicesDemand * mults.evtServicesDemandMult

    // 级联效率
    const laborRatio = safeRatio(laborSupply, laborDemand)
    const industrialEff = laborRatio

    const actualGoods = goodsSupply * industrialEff
    const actualGoodsRatio = safeRatio(actualGoods, goodsDemand)
    const commercialEff = Math.min(actualGoodsRatio, laborRatio)

    const actualServices = servicesSupply * commercialEff
    const actualServicesRatio = safeRatio(actualServices, servicesDemand)
    const residentialEff = actualServicesRatio

    const goodsRatio = safeRatio(actualGoods, goodsDemand)
    const servicesRatio = actualServicesRatio

    // 收入（含所有系统乘数）
    const totalIncomeMult =
      mults.evtIncomeMult *
      mults.policyIncomeMult *
      mults.crisisIncomeMult *
      mults.specIncomeMult

    const income =
      (census.resIncomeWeighted * residentialEff * mults.synergyIncomeRes +
        census.comIncomeWeighted *
          commercialEff *
          mults.synergyIncomeCom *
          mults.techCommercialIncome +
        census.indIncomeWeighted * industrialEff * mults.synergyIncomeInd) *
      totalIncomeMult

    // 支出: 道路维护 + 建筑维护
    const specAllCostMult =
      this.specializationSystem.getEffectValue('all_cost_multiplier') ?? 1
    const roadExpenses =
      census.roadMaintenanceTotal *
      mults.evtRoadMaintMult *
      mults.policyRoadMaintMult
    const buildingMaintenance = buildingEffects.totalMaintenance
    const expenses =
      (roadExpenses + buildingMaintenance) *
      mults.policyExpenseMult *
      specAllCostMult
    const netRevenue = Math.round(income - expenses)

    return {
      income,
      expenses,
      netRevenue,
      laborRatio,
      industrialEff,
      commercialEff,
      residentialEff,
      goodsRatio,
      servicesRatio,
    }
  }

  /**
   * 计算每日经济数据并结算
   */
  processDailyEconomy(): void {
    const state = this.stateManager.getState()
    const { economy, buildingEffects } = state
    const currentPopulation = economy.population
    const prevSatisfaction = economy.satisfaction

    const mults = this.collectMultipliers()
    const census = this.runTileCensus(mults)
    const econ = this.computeEconomics(census, mults)

    // === 满意度（含政策、协同、设施、特色修正） ===
    const avgEfficiency =
      (econ.residentialEff + econ.commercialEff + econ.industrialEff) / 3

    let rawSatisfaction: number
    if (census.connRes === 0 && census.connCom === 0 && census.connInd === 0) {
      rawSatisfaction = 75
    } else {
      rawSatisfaction =
        (econ.servicesRatio * SAT_WEIGHT_SERVICES +
          econ.laborRatio * SAT_WEIGHT_EMPLOYMENT +
          econ.goodsRatio * SAT_WEIGHT_GOODS +
          avgEfficiency * SAT_WEIGHT_BALANCE) *
        100
    }

    // 水域相邻加成
    if (census.waterAdjacentResCount > 0 && census.connRes > 0) {
      rawSatisfaction +=
        (census.waterAdjacentResCount * WATER_ADJACENCY_SATISFACTION_BONUS) /
        census.connRes
    }

    // 协同满意度修正
    rawSatisfaction += mults.synergySatisfaction

    // 政策满意度修正
    rawSatisfaction += mults.policySatisfaction

    // 特色满意度修正
    rawSatisfaction += mults.specSatisfaction

    // 设施满意度修正
    if (census.facilSatCount > 0) {
      rawSatisfaction += census.facilSatTotal / census.facilSatCount
    }

    const satisfaction = Math.min(
      100,
      Math.max(
        0,
        prevSatisfaction * (1 - SATISFACTION_SMOOTHING) +
          rawSatisfaction * SATISFACTION_SMOOTHING
      )
    )

    // === 人口动态 ===
    const capacity = census.capacityWeighted
    let populationFloat = state.populationFloat
    let newPopulation = currentPopulation

    if (census.connRes > 0 && currentPopulation === 0) {
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
          mults.policyGrowthMult
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

    // === 需求指示 ===
    const demandIndicators: DemandIndicators = {
      residential: toDemandLevel(econ.laborRatio),
      commercial: toDemandLevel(econ.servicesRatio),
      industrial: toDemandLevel(econ.goodsRatio),
    }

    const resources: ResourceMarket = {
      labor: {
        supply: buildingEffects.resources.laborSupply * mults.evtLaborSupplyMult,
        demand: buildingEffects.resources.laborDemand * mults.evtLaborDemandMult,
        ratio: econ.laborRatio,
      },
      goods: {
        supply:
          buildingEffects.resources.goodsSupply *
          mults.evtGoodsSupplyMult *
          mults.policyIndustrialMult *
          mults.crisisIndustrialMult *
          mults.specIndustrialMult *
          mults.techIndustrialEff *
          mults.synergyEffInd *
          mults.specAllProdMult *
          econ.industrialEff,
        demand: buildingEffects.resources.goodsDemand * mults.evtGoodsDemandMult,
        ratio: econ.goodsRatio,
      },
      services: {
        supply:
          buildingEffects.resources.servicesSupply *
          mults.evtServicesSupplyMult *
          mults.policyCommercialMult *
          mults.crisisServicesMult *
          mults.specCommercialMult *
          mults.synergyEffCom *
          mults.specAllProdMult *
          econ.commercialEff,
        demand:
          buildingEffects.resources.servicesDemand *
          mults.evtServicesDemandMult,
        ratio: econ.servicesRatio,
      },
    }

    this.stateManager.addMoney(econ.netRevenue)
    this.stateManager.update({
      populationFloat,
      economy: {
        ...state.economy,
        income: Math.round(econ.income),
        expenses: Math.round(econ.expenses),
        population: newPopulation,
        lastDayRevenue: econ.netRevenue,
        satisfaction,
        populationCapacity: Math.floor(capacity),
        resources,
        demandIndicators,
        efficiencyByType: {
          residential: econ.residentialEff,
          commercial: econ.commercialEff,
          industrial: econ.industrialEff,
        },
      },
    })
  }

  private getEventMult(
    target: import('shared/types').EventModifierTarget
  ): number {
    return this.eventSystem.getActiveMultiplier(target) ?? 1
  }

  private hasAdjacentWater(
    x: number,
    y: number,
    map: { tiles: Array<Array<{ terrain: TerrainType }>> }
  ): boolean {
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
   * 应用所有系统乘数以确保与实际结算一致
   */
  getProjection(): {
    income: number
    expenses: number
    population: number
    netRevenue: number
    satisfaction: number
  } {
    const state = this.stateManager.getState()
    const { economy } = state

    const mults = this.collectMultipliers()
    const census = this.runTileCensus(mults)
    const econ = this.computeEconomics(census, mults)

    return {
      income: Math.round(econ.income),
      expenses: Math.round(econ.expenses),
      population: economy.population,
      netRevenue: econ.netRevenue,
      satisfaction: economy.satisfaction,
    }
  }
}
