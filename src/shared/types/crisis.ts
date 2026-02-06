import type { TileType } from './core'

export interface CrisisEffect {
  type:
    | 'money'
    | 'satisfaction'
    | 'income_multiplier_temp'
    | 'industrial_multiplier_temp'
    | 'services_multiplier_temp'
    | 'population_loss'
    | 'prevent_chain'
  value: number
  durationDays?: number
}

export interface CrisisOption {
  id: string
  label: string
  description: string
  cost: number
  effects: CrisisEffect[]
  requirements?: { facility?: TileType; tech?: string }
}

export interface CrisisTemplate {
  id: string
  name: string
  description: string
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic'
  options: CrisisOption[]
  chainEventId?: string
  chainProbability?: number
  preventedByFacilities?: TileType[]
  preventionThreshold?: number
  minDay: number
  baseProbability: number
}

export interface ActiveCrisis {
  templateId: string
  name: string
  severity: string
  remainingEffects: Array<{
    type: string
    value: number
    remainingDays: number
  }>
}

export interface ChallengeState {
  challengeMode: boolean
  pendingCrisis: CrisisTemplate | null
  activeCrises: ActiveCrisis[]
  deficitDays: number
  lowSatisfactionDays: number
  gameOver: boolean
  gameWon: boolean
  winProgress: number
  score: number
}
