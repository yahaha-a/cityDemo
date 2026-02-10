import * as THREE from 'three'
import type { BuildingId, BuildingCategory } from 'shared/types/building-defs'
import { buildingIdToCategory } from 'shared/types/building-defs'
import { BUILDING_COLORS } from '../config'
import {
  DISCONNECTED_COLOR_SCALE,
  EFFICIENCY_GRAY_FACTOR,
  HOVER_LERP_FACTOR,
  COMMERCIAL_BASE_EMISSIVE,
} from './scene-constants'

/** 受效率影响的建筑分类 */
export const EFFICIENCY_CATEGORIES: BuildingCategory[] = [
  'residential',
  'commercial',
  'industrial',
]

// 模块级复用临时变量
const tmpColor = new THREE.Color()
const hoverWhite = new THREE.Color(0xffffff)
const hoverOrigColor = new THREE.Color()
const hoverOrigAccentColor = new THREE.Color()
const hoverOrigWindowColor = new THREE.Color()

/** 应用效率和连接状态到颜色 */
export function applyEfficiencyColor(
  color: THREE.Color,
  entry: { connected: boolean; category: BuildingCategory },
  effByType: Record<string, number>
): void {
  if (!entry.connected) {
    color.multiplyScalar(DISCONNECTED_COLOR_SCALE)
  } else if (EFFICIENCY_CATEGORIES.includes(entry.category)) {
    const eff = effByType[entry.category as keyof typeof effByType] ?? 1
    if (eff < 1) {
      const gray = (color.r + color.g + color.b) / 3
      const factor = (1 - eff) * EFFICIENCY_GRAY_FACTOR
      color.r = color.r * (1 - factor) + gray * factor
      color.g = color.g * (1 - factor) + gray * factor
      color.b = color.b * (1 - factor) + gray * factor
    }
  }
}

/** 设置建筑实例颜色（base + accent + windows） */
export function setInstanceColors(
  baseMesh: THREE.InstancedMesh,
  accentMesh: THREE.InstancedMesh,
  windowMesh: THREE.InstancedMesh | null,
  idx: number,
  bid: BuildingId,
  connected: boolean,
  category: string,
  effByType: Record<string, number>
): void {
  // base 颜色
  tmpColor.set(BUILDING_COLORS[bid].base)
  if (!connected) {
    tmpColor.multiplyScalar(DISCONNECTED_COLOR_SCALE)
  } else if (
    EFFICIENCY_CATEGORIES.includes(category as BuildingCategory)
  ) {
    const eff = effByType[category as keyof typeof effByType] ?? 1
    if (eff < 1) {
      const gray = (tmpColor.r + tmpColor.g + tmpColor.b) / 3
      const factor = (1 - eff) * EFFICIENCY_GRAY_FACTOR
      tmpColor.r = tmpColor.r * (1 - factor) + gray * factor
      tmpColor.g = tmpColor.g * (1 - factor) + gray * factor
      tmpColor.b = tmpColor.b * (1 - factor) + gray * factor
    }
  }
  baseMesh.setColorAt(idx, tmpColor)

  // accent 颜色
  tmpColor.set(BUILDING_COLORS[bid].accent)
  if (!connected) {
    tmpColor.multiplyScalar(DISCONNECTED_COLOR_SCALE)
  } else if (
    EFFICIENCY_CATEGORIES.includes(category as BuildingCategory)
  ) {
    const eff = effByType[category as keyof typeof effByType] ?? 1
    if (eff < 1) {
      const gray = (tmpColor.r + tmpColor.g + tmpColor.b) / 3
      const factor = (1 - eff) * EFFICIENCY_GRAY_FACTOR
      tmpColor.r = tmpColor.r * (1 - factor) + gray * factor
      tmpColor.g = tmpColor.g * (1 - factor) + gray * factor
      tmpColor.b = tmpColor.b * (1 - factor) + gray * factor
    }
  }
  accentMesh.setColorAt(idx, tmpColor)

  // window 颜色
  if (windowMesh) {
    tmpColor.set(BUILDING_COLORS[bid].window)
    windowMesh.setColorAt(idx, tmpColor)
  }
}

/** 悬停高亮状态 */
export interface HoverHighlightState {
  baseKey: string
  accentKey: string
  windowKey: string
  idx: number
  origBaseColor: THREE.Color
  origAccentColor: THREE.Color
  origWindowColor: THREE.Color
}

/** 应用悬停高亮到指定实例，返回高亮状态用于后续恢复 */
export function applyHoverHighlight(
  meshRefs: Record<string, THREE.InstancedMesh | null>,
  entry: { baseKey: string; accentKey: string; windowKey: string; idx: number }
): HoverHighlightState | null {
  const baseMesh = meshRefs[entry.baseKey]
  const accentMesh = meshRefs[entry.accentKey]
  const windowMesh = meshRefs[entry.windowKey]
  if (!baseMesh?.instanceColor || !accentMesh?.instanceColor) return null

  baseMesh.getColorAt(entry.idx, hoverOrigColor)
  accentMesh.getColorAt(entry.idx, hoverOrigAccentColor)
  if (windowMesh?.instanceColor) {
    windowMesh.getColorAt(entry.idx, hoverOrigWindowColor)
  }

  const state: HoverHighlightState = {
    baseKey: entry.baseKey,
    accentKey: entry.accentKey,
    windowKey: entry.windowKey,
    idx: entry.idx,
    origBaseColor: hoverOrigColor.clone(),
    origAccentColor: hoverOrigAccentColor.clone(),
    origWindowColor: hoverOrigWindowColor.clone(),
  }

  tmpColor.copy(hoverOrigColor).lerp(hoverWhite, HOVER_LERP_FACTOR)
  baseMesh.setColorAt(entry.idx, tmpColor)
  baseMesh.instanceColor.needsUpdate = true

  tmpColor.copy(hoverOrigAccentColor).lerp(hoverWhite, HOVER_LERP_FACTOR)
  accentMesh.setColorAt(entry.idx, tmpColor)
  accentMesh.instanceColor.needsUpdate = true

  if (windowMesh?.instanceColor) {
    tmpColor.copy(hoverOrigWindowColor).lerp(hoverWhite, HOVER_LERP_FACTOR)
    windowMesh.setColorAt(entry.idx, tmpColor)
    windowMesh.instanceColor.needsUpdate = true
  }

  return state
}

/** 移除悬停高亮，恢复原始颜色 */
export function removeHoverHighlight(
  meshRefs: Record<string, THREE.InstancedMesh | null>,
  prev: HoverHighlightState
): void {
  const baseMesh = meshRefs[prev.baseKey]
  const accentMesh = meshRefs[prev.accentKey]
  const windowMesh = meshRefs[prev.windowKey]
  if (baseMesh) {
    baseMesh.setColorAt(prev.idx, prev.origBaseColor)
    if (baseMesh.instanceColor) baseMesh.instanceColor.needsUpdate = true
  }
  if (accentMesh) {
    accentMesh.setColorAt(prev.idx, prev.origAccentColor)
    if (accentMesh.instanceColor)
      accentMesh.instanceColor.needsUpdate = true
  }
  if (windowMesh) {
    windowMesh.setColorAt(prev.idx, prev.origWindowColor)
    if (windowMesh.instanceColor)
      windowMesh.instanceColor.needsUpdate = true
  }
}

/** 所有可渲染的建筑 ID（不含 empty/road） */
export const RENDERABLE_IDS: BuildingId[] = [
  'house',
  'apartment',
  'residential_complex',
  'shop',
  'office',
  'mall',
  'factory',
  'heavy_industry',
  'warehouse',
  'park',
  'plaza',
  'school',
  'hospital',
  'fire_station',
  'police_station',
  'power_plant',
]

/** 更新窗户发光强度 */
export function updateWindowEmissive(
  materials: Record<string, THREE.MeshToonMaterial>,
  nightFactor: number
): void {
  for (const id of RENDERABLE_IDS) {
    const winMat = materials[`${id}_windows`]
    if (winMat) {
      const category = buildingIdToCategory(id)
      const isCommercial = category === 'commercial'
      winMat.emissiveIntensity = isCommercial
        ? COMMERCIAL_BASE_EMISSIVE + nightFactor * (1 - COMMERCIAL_BASE_EMISSIVE)
        : nightFactor * 1.0
    }
  }
}
