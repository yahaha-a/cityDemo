/** 经济配置 - 供需系统 */

// 人口容量
export const POP_CAPACITY_PER_RESIDENTIAL = 8

// 资源产出/消耗（每栋建筑每日）
export const LABOR_PER_POP = 1.0
export const SERVICES_DEMAND_PER_POP = 0.5

export const SERVICES_PER_COMMERCIAL = 6.0
export const GOODS_DEMAND_PER_COMMERCIAL = 4.0
export const LABOR_DEMAND_PER_COMMERCIAL = 3.0

export const GOODS_PER_INDUSTRIAL = 6.0
export const LABOR_DEMAND_PER_INDUSTRIAL = 4.0

// 收入（100%效率时）
export const BASE_RESIDENTIAL_TAX = 3
export const BASE_COMMERCIAL_INCOME = 15
export const BASE_INDUSTRIAL_INCOME = 10

// 人口动态
export const NEUTRAL_SATISFACTION = 50
export const MAX_GROWTH_RATE = 0.05
export const MAX_DECLINE_RATE = 0.03
export const SATISFACTION_SMOOTHING = 0.3
export const INITIAL_POP_SEED = 2

// 满意度权重（和为1）
export const SAT_WEIGHT_SERVICES = 0.35
export const SAT_WEIGHT_EMPLOYMENT = 0.3
export const SAT_WEIGHT_GOODS = 0.2
export const SAT_WEIGHT_BALANCE = 0.15

export const ROAD_MAINTENANCE_COST = 1
