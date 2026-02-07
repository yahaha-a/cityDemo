import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TileType, isCoreBuilding, isBuilding } from 'shared/types'
import {
  TILE_COLORS,
  BUILDING_HEIGHTS,
  LEVEL_HEIGHT_MULTIPLIER,
  MAP_WIDTH,
  MAP_HEIGHT,
} from '../config'
import { useGameStore } from '../stores/game-store'

// 将 2D 像素高度映射到 3D 世界单位
const HEIGHT_SCALE = 1 / 32

// 所有建筑类型（排除 Empty 和 Road）
const BUILDING_TYPES = [
  TileType.Residential,
  TileType.Commercial,
  TileType.Industrial,
  TileType.Park,
  TileType.School,
  TileType.Hospital,
  TileType.FireStation,
  TileType.PoliceStation,
  TileType.PowerPlant,
] as const

// 受效率影响的核心建筑类型
const CORE_BUILDING_TYPES = [
  TileType.Residential,
  TileType.Commercial,
  TileType.Industrial,
] as const

// 地形高度偏移（与 TerrainGrid 保持一致）
const TERRAIN_Y_MAP: Record<string, number> = {
  plain: 0,
  hill: 0.15,
  water: -0.08,
  fertile: 0,
  rocky: 0.05,
}

// 每种建筑类型的最大实例分配量
const MAX_COUNTS: Partial<Record<TileType, number>> = {
  [TileType.Residential]: 1024,
  [TileType.Commercial]: 1024,
  [TileType.Industrial]: 1024,
  [TileType.Park]: 256,
  [TileType.School]: 256,
  [TileType.Hospital]: 256,
  [TileType.FireStation]: 256,
  [TileType.PoliceStation]: 256,
  [TileType.PowerPlant]: 256,
}

const dummy = new THREE.Object3D()
// 复用单个 Color 实例，避免每帧大量 GC
const tmpColor = new THREE.Color()

export function Buildings() {
  const meshRefs = useRef<Record<string, THREE.InstancedMesh | null>>({})
  // 脏标记：记录上次处理时的 map 引用和效率实际值
  const prevMapRef = useRef<unknown>(null)
  const prevEffValues = useRef({ residential: 1, commercial: 1, industrial: 1 })
  // 缓存 per-tile 的 instance 索引映射：tileKey → { type, idx }
  // 用于 efficiency-only 更新时快速定位需要更新颜色的实例
  const instanceIndexMap = useRef<
    Map<string, { type: TileType; idx: number; connected: boolean }>
  >(new Map())

  // 为每种建筑类型创建材质
  const materials = useMemo(() => {
    const mats: Record<string, THREE.MeshStandardMaterial> = {}
    for (const t of BUILDING_TYPES) {
      mats[t] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(TILE_COLORS[t].top),
        roughness: 0.6,
        metalness: 0.2,
      })
    }
    return mats
  }, [])

  // 基础几何 (1x1x1 cube)，Y 轴缩放由实例矩阵控制
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.85, 1, 0.85)
    // 将几何原点移到底部
    geo.translate(0, 0.5, 0)
    return geo
  }, [])

  useFrame(() => {
    const state = useGameStore.getState().state
    if (!state) return

    const { map, economy } = state
    const effByType = economy.efficiencyByType
    const mapChanged = map !== prevMapRef.current

    // 值比较：检查 3 个效率值是否实际变化
    const effChanged =
      effByType.residential !== prevEffValues.current.residential ||
      effByType.commercial !== prevEffValues.current.commercial ||
      effByType.industrial !== prevEffValues.current.industrial

    if (!mapChanged && !effChanged) return
    prevMapRef.current = map
    if (effChanged) {
      prevEffValues.current = {
        residential: effByType.residential,
        commercial: effByType.commercial,
        industrial: effByType.industrial,
      }
    }

    // 分离更新路径：仅 efficiency 变化时只更新核心建筑颜色
    if (!mapChanged && effChanged) {
      for (const [, entry] of instanceIndexMap.current) {
        if (!isCoreBuilding(entry.type)) continue
        const mesh = meshRefs.current[entry.type]
        if (!mesh) continue

        tmpColor.set(TILE_COLORS[entry.type].top)
        if (!entry.connected) {
          tmpColor.multiplyScalar(0.4)
        } else {
          const eff =
            entry.type === TileType.Residential
              ? effByType.residential
              : entry.type === TileType.Commercial
                ? effByType.commercial
                : effByType.industrial
          if (eff < 1) {
            const gray = (tmpColor.r + tmpColor.g + tmpColor.b) / 3
            const factor = (1 - eff) * 0.6
            tmpColor.r = tmpColor.r * (1 - factor) + gray * factor
            tmpColor.g = tmpColor.g * (1 - factor) + gray * factor
            tmpColor.b = tmpColor.b * (1 - factor) + gray * factor
          }
        }
        mesh.setColorAt(entry.idx, tmpColor)
      }
      // 仅标记核心建筑类型的颜色更新
      for (const t of CORE_BUILDING_TYPES) {
        const mesh = meshRefs.current[t]
        if (mesh?.instanceColor) {
          mesh.instanceColor.needsUpdate = true
        }
      }
      return
    }

    // map 变化 → 全量更新（矩阵 + 颜色），并重建索引映射
    instanceIndexMap.current.clear()
    const indices: Record<string, number> = {}
    for (const t of BUILDING_TYPES) indices[t] = 0

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        if (!isBuilding(tile.type)) continue

        const t = tile.type as (typeof BUILDING_TYPES)[number]
        const mesh = meshRefs.current[t]
        if (!mesh) continue

        const idx = indices[t]++
        const worldX = x - MAP_WIDTH / 2 + 0.5
        const worldZ = y - MAP_HEIGHT / 2 + 0.5
        const terrainY = TERRAIN_Y_MAP[tile.terrain] ?? 0
        const baseTerrainTop = terrainY + 0.05

        const baseH = BUILDING_HEIGHTS[tile.type] * HEIGHT_SCALE
        const levelMult =
          tile.level > 0 ? LEVEL_HEIGHT_MULTIPLIER[tile.level - 1] : 1
        const h = baseH * levelMult

        dummy.position.set(worldX, baseTerrainTop, worldZ)
        dummy.scale.set(1, Math.max(h, 0.1), 1)
        dummy.updateMatrix()
        mesh.setMatrixAt(idx, dummy.matrix)

        // 颜色：复用 tmpColor 避免分配
        tmpColor.set(TILE_COLORS[tile.type].top)
        if (!tile.connected && isBuilding(tile.type)) {
          tmpColor.multiplyScalar(0.4)
        } else if (isCoreBuilding(tile.type)) {
          const eff =
            tile.type === TileType.Residential
              ? effByType.residential
              : tile.type === TileType.Commercial
                ? effByType.commercial
                : effByType.industrial
          if (eff < 1) {
            const gray = (tmpColor.r + tmpColor.g + tmpColor.b) / 3
            const factor = (1 - eff) * 0.6
            tmpColor.r = tmpColor.r * (1 - factor) + gray * factor
            tmpColor.g = tmpColor.g * (1 - factor) + gray * factor
            tmpColor.b = tmpColor.b * (1 - factor) + gray * factor
          }
        }
        mesh.setColorAt(idx, tmpColor)

        // 缓存核心建筑的实例索引，供 efficiency-only 更新使用
        if (isCoreBuilding(tile.type)) {
          instanceIndexMap.current.set(`${x},${y}`, {
            type: tile.type,
            idx,
            connected: tile.connected,
          })
        }
      }
    }

    // 遍历结束后设 count 并标记更新（仅有实例的 mesh 标记 needsUpdate）
    for (const t of BUILDING_TYPES) {
      const mesh = meshRefs.current[t]
      if (!mesh) continue
      mesh.count = indices[t]
      if (indices[t] > 0) {
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      }
    }
  })

  return (
    <group>
      {BUILDING_TYPES.map(t => (
        <instancedMesh
          args={[geometry, materials[t], MAX_COUNTS[t] ?? 256]}
          castShadow
          frustumCulled={false}
          key={t}
          receiveShadow
          ref={el => {
            meshRefs.current[t] = el
          }}
        />
      ))}
    </group>
  )
}
