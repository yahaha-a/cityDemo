import { DemandLevel } from 'shared/types'

/** 需求等级 -> 圆点背景色 */
export const DEMAND_DOT_COLORS: Record<DemandLevel, string> = {
  [DemandLevel.Low]: 'bg-[var(--game-green)]',
  [DemandLevel.Balanced]: 'bg-[var(--game-gold)]',
  [DemandLevel.High]: 'bg-[var(--game-red-light)]',
  [DemandLevel.Critical]: 'bg-[var(--game-red)]',
}

/** 需求等级 -> 文字颜色 */
export const DEMAND_TEXT_COLORS: Record<DemandLevel, string> = {
  [DemandLevel.Low]: 'text-[var(--game-green)]',
  [DemandLevel.Balanced]: 'text-[var(--game-gold)]',
  [DemandLevel.High]: 'text-[var(--game-red-light)]',
  [DemandLevel.Critical]: 'text-[var(--game-red)]',
}

/** 危机严重度 -> 文字颜色 */
export const SEVERITY_COLORS: Record<string, string> = {
  minor: 'text-[var(--game-gold)]',
  moderate: 'text-[var(--game-red-light)]',
  major: 'text-[var(--game-red)]',
  catastrophic: 'text-[var(--game-red)] font-bold',
}

/** 危机严重度 -> 蜡封圆圈背景色 */
export const SEVERITY_SEAL_COLORS: Record<string, string> = {
  minor: 'bg-[var(--game-gold)]',
  moderate: 'bg-[var(--game-red-light)]',
  major: 'bg-[var(--game-red)]',
  catastrophic: 'bg-[oklch(0.35_0.18_25)]',
}

/** 满意度 -> 文字颜色 */
export function satisfactionColor(sat: number): string {
  if (sat >= 70) return 'text-[var(--game-green)]'
  if (sat >= 40) return 'text-[var(--game-gold)]'
  return 'text-[var(--game-red)]'
}

/** 满意度 -> 进度条背景色 */
export function satisfactionBarColor(sat: number): string {
  if (sat >= 70) return 'bg-[var(--game-green)]'
  if (sat >= 40) return 'bg-[var(--game-gold)]'
  return 'bg-[var(--game-red)]'
}

/** 比率 -> 进度条背景色 */
export function ratioBarColor(ratio: number): string {
  if (ratio >= 0.7) return 'bg-[var(--game-green)]'
  if (ratio >= 0.4) return 'bg-[var(--game-gold)]'
  return 'bg-[var(--game-red)]'
}
