import { DemandLevel } from 'shared/game-types'

/** 需求等级 → 圆点背景色 */
export const DEMAND_DOT_COLORS: Record<DemandLevel, string> = {
  [DemandLevel.Low]: 'bg-green-400',
  [DemandLevel.Balanced]: 'bg-yellow-400',
  [DemandLevel.High]: 'bg-orange-400',
  [DemandLevel.Critical]: 'bg-red-500',
}

/** 需求等级 → 文字颜色 */
export const DEMAND_TEXT_COLORS: Record<DemandLevel, string> = {
  [DemandLevel.Low]: 'text-green-400',
  [DemandLevel.Balanced]: 'text-yellow-400',
  [DemandLevel.High]: 'text-orange-400',
  [DemandLevel.Critical]: 'text-red-400',
}

/** 危机严重度 → 文字颜色 */
export const SEVERITY_COLORS: Record<string, string> = {
  minor: 'text-yellow-400',
  moderate: 'text-orange-400',
  major: 'text-red-400',
  catastrophic: 'text-red-600',
}

/** 满意度 → 文字颜色 */
export function satisfactionColor(sat: number): string {
  if (sat >= 70) return 'text-green-400'
  if (sat >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

/** 满意度 → 进度条背景色 */
export function satisfactionBarColor(sat: number): string {
  if (sat >= 70) return 'bg-green-500'
  if (sat >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

/** 比率 → 进度条背景色 */
export function ratioBarColor(ratio: number): string {
  if (ratio >= 0.7) return 'bg-green-500'
  if (ratio >= 0.4) return 'bg-yellow-500'
  return 'bg-red-500'
}
