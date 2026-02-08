import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TerrainType, RoadType } from 'shared/types'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'
import type { GameEngine } from '../engine/game-engine'

const dummy = new THREE.Object3D()
const ROAD_HEIGHT = 0.02

// 地形高度偏移（与 TerrainGrid / Buildings 保持一致）
const TERRAIN_Y_MAP: Record<TerrainType, number> = {
  [TerrainType.Plain]: 0,
  [TerrainType.Hill]: 0.15,
  [TerrainType.Water]: -0.08,
  [TerrainType.Fertile]: 0,
  [TerrainType.Rocky]: 0.05,
}

// 各道路类型颜色
const ROAD_TYPE_COLORS: Record<RoadType, string> = {
  [RoadType.Normal]: '#9ca3af',
  [RoadType.Highway]: '#fbbf24',
  [RoadType.Bridge]: '#60a5fa',
  [RoadType.Tunnel]: '#a78bfa',
}

// 各道路类型的 Y 偏移调整
const ROAD_TYPE_Y_OFFSET: Record<RoadType, number> = {
  [RoadType.Normal]: 0.06,
  [RoadType.Highway]: 0.08,
  [RoadType.Bridge]: 0.15, // 高于水面
  [RoadType.Tunnel]: -0.05, // 低于地面
}

const ROAD_TYPES = [
  RoadType.Normal,
  RoadType.Highway,
  RoadType.Bridge,
  RoadType.Tunnel,
] as const

/** tile key → { roadType, idx in its mesh } */
interface RoadInstanceEntry {
  roadType: RoadType
  idx: number
}

export function RoadNetwork() {
  const meshRefs = useRef<Record<string, THREE.InstancedMesh | null>>({})
  // 脏标记：道路只在建造/拆除时变化
  const prevMapRef = useRef<unknown>(null)

  /** 反向映射：tileKey(number) → 实例信息 */
  const tileToRoadInstance = useRef<Map<number, RoadInstanceEntry>>(new Map())
  /** 每种道路类型当前实例计数 */
  const roadCounts = useRef<Record<string, number>>({})
  /** 反向映射：(roadType, idx) → tileKey 用于 swap-and-pop */
  const idxToTile = useRef<Record<string, Map<number, number>>>({})

  const materials = useMemo(() => {
    const mats: Record<string, THREE.MeshStandardMaterial> = {}
    for (const rt of ROAD_TYPES) {
      mats[rt] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(ROAD_TYPE_COLORS[rt]),
        roughness: 0.9,
        metalness: 0.05,
      })
    }
    return mats
  }, [])

  const geometries = useMemo(() => {
    const geos: Record<string, THREE.BoxGeometry> = {}
    // 普通和桥梁使用标准宽度
    geos[RoadType.Normal] = new THREE.BoxGeometry(0.98, ROAD_HEIGHT, 0.98)
    // 高速公路稍宽
    geos[RoadType.Highway] = new THREE.BoxGeometry(
      0.98,
      ROAD_HEIGHT * 1.5,
      0.98
    )
    geos[RoadType.Bridge] = new THREE.BoxGeometry(0.98, ROAD_HEIGHT, 0.98)
    geos[RoadType.Tunnel] = new THREE.BoxGeometry(0.98, ROAD_HEIGHT * 2, 0.98)
    return geos
  }, [])

  useFrame(() => {
    const store = useGameStore.getState()
    const state = store.state
    if (!state) return

    const { map } = state

    // 引用比较：map 未变则跳过
    if (map === prevMapRef.current) return
    prevMapRef.current = map

    // 获取脏 Tile 信息
    const engine = store.engine as GameEngine | null
    const mapChanges = engine?.stateManager.getMapChanges()
    const isFull = !mapChanges || mapChanges.full

    if (isFull) {
      // === 全量重建 ===
      tileToRoadInstance.current.clear()
      const counts: Record<string, number> = {}
      const idx2tile: Record<string, Map<number, number>> = {}
      for (const rt of ROAD_TYPES) {
        counts[rt] = 0
        idx2tile[rt] = new Map()
      }

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tile = map.tiles[y][x]
          if (tile.buildingId !== 'road') continue

          const roadType = tile.roadType ?? RoadType.Normal
          const mesh = meshRefs.current[roadType]
          if (!mesh) continue

          const idx = counts[roadType]++
          const tileKey = y * MAP_WIDTH + x

          setRoadMatrix(mesh, idx, x, y, tile.terrain, roadType)

          tileToRoadInstance.current.set(tileKey, { roadType, idx })
          idx2tile[roadType].set(idx, tileKey)
        }
      }

      roadCounts.current = counts
      idxToTile.current = idx2tile

      // 更新各 mesh
      for (const rt of ROAD_TYPES) {
        const mesh = meshRefs.current[rt]
        if (!mesh) continue
        mesh.count = counts[rt]
        mesh.instanceMatrix.needsUpdate = true
      }
    } else {
      // === 增量更新 ===
      const affectedTypes = new Set<RoadType>()

      for (const tileKey of mapChanges.tiles) {
        const x = tileKey % MAP_WIDTH
        const y = (tileKey - x) / MAP_WIDTH

        const oldEntry = tileToRoadInstance.current.get(tileKey)
        const tile = map.tiles[y][x]
        const isRoad = tile.buildingId === 'road'
        const newRoadType = isRoad ? (tile.roadType ?? RoadType.Normal) : null

        // 如果旧条目和新条目完全相同，只需更新 matrix（地形可能变了）
        if (oldEntry && newRoadType === oldEntry.roadType) {
          const mesh = meshRefs.current[oldEntry.roadType]
          if (mesh) {
            setRoadMatrix(
              mesh,
              oldEntry.idx,
              x,
              y,
              tile.terrain,
              oldEntry.roadType
            )
            affectedTypes.add(oldEntry.roadType)
          }
          continue
        }

        // 移除旧实例（swap-and-pop）
        if (oldEntry) {
          const rt = oldEntry.roadType
          const mesh = meshRefs.current[rt]
          if (mesh) {
            const lastIdx = roadCounts.current[rt] - 1
            if (oldEntry.idx !== lastIdx) {
              // 把末尾实例的 matrix 复制到被移除的位置
              const tmpMatrix = new THREE.Matrix4()
              mesh.getMatrixAt(lastIdx, tmpMatrix)
              mesh.setMatrixAt(oldEntry.idx, tmpMatrix)

              // 更新被移动实例的反向映射
              const movedTileKey = idxToTile.current[rt].get(lastIdx)
              if (movedTileKey !== undefined) {
                tileToRoadInstance.current.set(movedTileKey, {
                  roadType: rt,
                  idx: oldEntry.idx,
                })
                idxToTile.current[rt].set(oldEntry.idx, movedTileKey)
              }
            }
            roadCounts.current[rt]--
            idxToTile.current[rt].delete(lastIdx)
            affectedTypes.add(rt)
          }
          tileToRoadInstance.current.delete(tileKey)
        }

        // 添加新实例
        if (isRoad && newRoadType !== null) {
          const rt = newRoadType
          const mesh = meshRefs.current[rt]
          if (mesh) {
            const idx = roadCounts.current[rt] ?? 0
            roadCounts.current[rt] = idx + 1

            setRoadMatrix(mesh, idx, x, y, tile.terrain, rt)

            tileToRoadInstance.current.set(tileKey, { roadType: rt, idx })
            idxToTile.current[rt].set(idx, tileKey)
            affectedTypes.add(rt)
          }
        }
      }

      // 更新受影响的 mesh
      for (const rt of affectedTypes) {
        const mesh = meshRefs.current[rt]
        if (!mesh) continue
        mesh.count = roadCounts.current[rt] ?? 0
        mesh.instanceMatrix.needsUpdate = true
      }
    }
  })

  return (
    <group>
      {ROAD_TYPES.map(rt => (
        <instancedMesh
          args={[geometries[rt], materials[rt], 1024]}
          frustumCulled={false}
          key={rt}
          receiveShadow
          ref={el => {
            meshRefs.current[rt] = el
          }}
        />
      ))}
    </group>
  )
}

/** 设置道路实例的 matrix */
function setRoadMatrix(
  mesh: THREE.InstancedMesh,
  idx: number,
  x: number,
  y: number,
  terrain: TerrainType,
  roadType: RoadType
): void {
  const worldX = x - MAP_WIDTH / 2 + 0.5
  const worldZ = y - MAP_HEIGHT / 2 + 0.5
  const terrainY = TERRAIN_Y_MAP[terrain] ?? 0
  const yOffset = ROAD_TYPE_Y_OFFSET[roadType]

  dummy.position.set(worldX, terrainY + yOffset, worldZ)
  dummy.updateMatrix()
  mesh.setMatrixAt(idx, dummy.matrix)
}
