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

// 地形高度偏移（与 TerrainGrid 保持一致）
const TERRAIN_Y_MAP: Record<string, number> = {
  plain: 0,
  hill: 0.15,
  water: -0.08,
  fertile: 0,
  rocky: 0.05,
}

const dummy = new THREE.Object3D()

export function Buildings() {
  const meshRefs = useRef<Record<string, THREE.InstancedMesh | null>>({})

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

    // 统计每种建筑数量
    const counts: Record<string, number> = {}
    for (const t of BUILDING_TYPES) counts[t] = 0

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        if (isBuilding(tile.type) && tile.type in counts) {
          counts[tile.type]++
        }
      }
    }

    // 设置实例矩阵
    const indices: Record<string, number> = {}
    for (const t of BUILDING_TYPES) indices[t] = 0

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        if (!isBuilding(tile.type)) continue

        const t = tile.type as (typeof BUILDING_TYPES)[number]
        const mesh = meshRefs.current[t]
        if (!mesh) continue

        if (mesh.count !== counts[t]) {
          mesh.count = counts[t]
        }

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

        // 颜色：未连接变灰，低效率去饱和
        const baseColor = new THREE.Color(TILE_COLORS[tile.type].top)
        if (!tile.connected && isBuilding(tile.type)) {
          baseColor.multiplyScalar(0.4)
        } else if (isCoreBuilding(tile.type)) {
          const eff =
            tile.type === TileType.Residential
              ? effByType.residential
              : tile.type === TileType.Commercial
                ? effByType.commercial
                : effByType.industrial
          if (eff < 1) {
            const gray = (baseColor.r + baseColor.g + baseColor.b) / 3
            const factor = (1 - eff) * 0.6
            baseColor.r = baseColor.r * (1 - factor) + gray * factor
            baseColor.g = baseColor.g * (1 - factor) + gray * factor
            baseColor.b = baseColor.b * (1 - factor) + gray * factor
          }
        }
        mesh.setColorAt(idx, baseColor)
      }
    }

    // 标记更新
    for (const t of BUILDING_TYPES) {
      const mesh = meshRefs.current[t]
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      }
    }
  })

  const maxCount = MAP_WIDTH * MAP_HEIGHT

  return (
    <group>
      {BUILDING_TYPES.map(t => (
        <instancedMesh
          args={[geometry, materials[t], maxCount]}
          castShadow
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
