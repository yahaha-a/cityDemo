import * as THREE from 'three'
import type { BuildingId, BuildingCategory } from 'shared/types/building-defs'
import { MAP_WIDTH } from '../config'

/** buildingInstanceMap 条目 */
export interface BuildingInstanceEntry {
  baseKey: string
  accentKey: string
  windowKey: string
  idx: number
  bid: BuildingId
}

/** 效率索引条目 */
export interface EfficiencyIndexEntry {
  buildingId: BuildingId
  category: BuildingCategory
  level: number
  idx: number
  connected: boolean
}

/** swap-and-pop 操作结果 */
export interface SwapResult {
  baseKey: string
  lastIdx: number
}

/** 生成 mesh key */
export function baseMeshKey(id: BuildingId, level: number): string {
  return `${id}_base_${level}`
}
export function accentMeshKey(id: BuildingId, level: number): string {
  return `${id}_accent_${level}`
}
export function windowMeshKey(id: BuildingId, level: number): string {
  return `${id}_windows_${level}`
}

/**
 * 建筑实例管理器：管理所有建筑的 InstancedMesh 索引
 * 使用 swap-and-pop 策略支持高效的增量添加/移除
 */
export class BuildingInstanceManager {
  /** tileKey → 实例信息 */
  private instanceMap = new Map<number, BuildingInstanceEntry>()
  /** baseMeshKey → (idx → tileKey) 反向映射 */
  private meshIdxToTile = new Map<string, Map<number, number>>()
  /** baseMeshKey → count */
  private counts: Record<string, number> = {}
  /** 效率相关建筑索引 */
  private efficiencyIndex = new Map<string, EfficiencyIndexEntry>()

  clear(): void {
    this.instanceMap.clear()
    this.meshIdxToTile.clear()
    this.counts = {}
    this.efficiencyIndex.clear()
  }

  initBaseKey(bKey: string): void {
    this.counts[bKey] = 0
    this.meshIdxToTile.set(bKey, new Map())
  }

  /** 添加实例，返回分配的 idx */
  addInstance(
    tileKey: number,
    x: number,
    y: number,
    bid: BuildingId,
    bKey: string,
    aKey: string,
    wKey: string,
    category: BuildingCategory | null,
    level: number,
    connected: boolean,
    isEfficiencyCategory: boolean
  ): number {
    const idx = this.counts[bKey] ?? 0
    this.counts[bKey] = idx + 1

    this.instanceMap.set(tileKey, {
      baseKey: bKey,
      accentKey: aKey,
      windowKey: wKey,
      idx,
      bid,
    })

    if (!this.meshIdxToTile.has(bKey)) {
      this.meshIdxToTile.set(bKey, new Map())
    }
    this.meshIdxToTile.get(bKey)?.set(idx, tileKey)

    if (isEfficiencyCategory && category) {
      this.efficiencyIndex.set(`${x},${y}`, {
        buildingId: bid,
        category,
        level,
        idx,
        connected,
      })
    }

    return idx
  }

  /** 移除实例（swap-and-pop），返回受影响的 baseKey 或 null */
  removeInstance(
    tileKey: number,
    meshRefs: Record<string, THREE.InstancedMesh | null>
  ): string | null {
    const entry = this.instanceMap.get(tileKey)
    if (!entry) return null

    const bk = entry.baseKey
    const ak = entry.accentKey
    const wk = entry.windowKey
    const baseMesh = meshRefs[bk]
    const accentMesh = meshRefs[ak]
    const windowMesh = meshRefs[wk]

    if (baseMesh && accentMesh) {
      const lastIdx = (this.counts[bk] ?? 1) - 1
      if (entry.idx !== lastIdx) {
        const tmpMatrix = new THREE.Matrix4()

        // base mesh
        baseMesh.getMatrixAt(lastIdx, tmpMatrix)
        baseMesh.setMatrixAt(entry.idx, tmpMatrix)
        if (baseMesh.instanceColor) {
          const tmpC = new THREE.Color()
          baseMesh.getColorAt(lastIdx, tmpC)
          baseMesh.setColorAt(entry.idx, tmpC)
        }

        // accent mesh
        accentMesh.getMatrixAt(lastIdx, tmpMatrix)
        accentMesh.setMatrixAt(entry.idx, tmpMatrix)
        if (accentMesh.instanceColor) {
          const tmpC = new THREE.Color()
          accentMesh.getColorAt(lastIdx, tmpC)
          accentMesh.setColorAt(entry.idx, tmpC)
        }

        // window mesh
        if (windowMesh) {
          windowMesh.getMatrixAt(lastIdx, tmpMatrix)
          windowMesh.setMatrixAt(entry.idx, tmpMatrix)
          if (windowMesh.instanceColor) {
            const tmpC = new THREE.Color()
            windowMesh.getColorAt(lastIdx, tmpC)
            windowMesh.setColorAt(entry.idx, tmpC)
          }
        }

        // 更新被移动实例的反向映射
        const reverseMap = this.meshIdxToTile.get(bk)
        const movedTileKey = reverseMap?.get(lastIdx)
        if (reverseMap && movedTileKey !== undefined) {
          const movedEntry = this.instanceMap.get(movedTileKey)
          if (movedEntry) movedEntry.idx = entry.idx
          reverseMap.set(entry.idx, movedTileKey)

          // 更新 efficiencyIndex 中被移动实例的 idx
          const movedX = movedTileKey % MAP_WIDTH
          const movedY = (movedTileKey - movedX) / MAP_WIDTH
          const movedEffEntry = this.efficiencyIndex.get(
            `${movedX},${movedY}`
          )
          if (movedEffEntry) movedEffEntry.idx = entry.idx
        }
      }
      this.counts[bk]--
      this.meshIdxToTile.get(bk)?.delete(lastIdx)
    }

    this.instanceMap.delete(tileKey)
    const x = tileKey % MAP_WIDTH
    const y = (tileKey - x) / MAP_WIDTH
    this.efficiencyIndex.delete(`${x},${y}`)

    return bk
  }

  getByTileKey(tileKey: number): BuildingInstanceEntry | undefined {
    return this.instanceMap.get(tileKey)
  }

  getMeshCounts(): Record<string, number> {
    return this.counts
  }

  getCount(bKey: string): number {
    return this.counts[bKey] ?? 0
  }

  forEachEfficiencyEntry(
    cb: (key: string, entry: EfficiencyIndexEntry) => void
  ): void {
    for (const [key, entry] of this.efficiencyIndex) {
      cb(key, entry)
    }
  }
}
