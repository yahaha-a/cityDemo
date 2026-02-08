import { useRef, useMemo, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { TerrainType } from 'shared/types'
import { TERRAIN_COLORS, MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'

const TILE_UNIT = 1

// 地形高度偏移
const TERRAIN_Y: Record<TerrainType, number> = {
  [TerrainType.Plain]: 0,
  [TerrainType.Hill]: 0.15,
  [TerrainType.Water]: -0.08,
  [TerrainType.Fertile]: 0,
  [TerrainType.Rocky]: 0.05,
}

// 地形基础块厚度
const TERRAIN_THICKNESS = 0.1

// 所有地形类型
const TERRAIN_TYPES = [
  TerrainType.Plain,
  TerrainType.Hill,
  TerrainType.Water,
  TerrainType.Fertile,
  TerrainType.Rocky,
] as const

// 模块级复用 Object3D，避免每帧分配
const dummy = new THREE.Object3D()

export function TerrainGrid() {
  const meshRefs = useRef<Record<string, THREE.InstancedMesh | null>>({})
  // 脏标记：地形在地形改造时也会变化，通过 map 引用比较检测
  const prevMapRef = useRef<unknown>(null)

  // 为每种地形创建材质
  const materials = useMemo(() => {
    const mats: Record<string, THREE.MeshStandardMaterial> = {}
    for (const t of TERRAIN_TYPES) {
      mats[t] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(TERRAIN_COLORS[t].top),
        roughness: 0.8,
        metalness: 0.1,
        transparent: t === TerrainType.Water,
        opacity: t === TerrainType.Water ? 0.75 : 1,
      })
    }
    return mats
  }, [])

  // 共享几何
  const geometry = useMemo(
    () => new THREE.BoxGeometry(TILE_UNIT, TERRAIN_THICKNESS, TILE_UNIT),
    []
  )

  // 地形更新逻辑：事件驱动，仅在 mount 和存档加载时执行
  const updateTerrain = useCallback(() => {
    const state = useGameStore.getState().state
    if (!state) return

    const { map } = state

    // 引用比较：map 未变则跳过
    if (map === prevMapRef.current) return
    prevMapRef.current = map

    // 单次遍历：统计 + 设置矩阵
    const counts: Record<string, number> = {}
    const indices: Record<string, number> = {}
    for (const t of TERRAIN_TYPES) {
      counts[t] = 0
      indices[t] = 0
    }

    // 先统计
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        counts[tile.terrain]++
      }
    }

    // 设置 count
    for (const t of TERRAIN_TYPES) {
      const mesh = meshRefs.current[t]
      if (mesh && mesh.count !== counts[t]) {
        mesh.count = counts[t]
      }
    }

    // 设置矩阵
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        const t = tile.terrain
        const mesh = meshRefs.current[t]
        if (!mesh) continue

        const idx = indices[t]++
        const worldX = x - MAP_WIDTH / 2 + 0.5
        const worldZ = y - MAP_HEIGHT / 2 + 0.5
        const terrainY = TERRAIN_Y[t]

        dummy.position.set(worldX, terrainY, worldZ)
        dummy.updateMatrix()
        mesh.setMatrixAt(idx, dummy.matrix)
      }
    }

    // 标记更新
    for (const t of TERRAIN_TYPES) {
      const mesh = meshRefs.current[t]
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true
      }
    }
  }, [])

  useEffect(() => {
    // 延迟一帧确保 mesh ref 已挂载
    const raf = requestAnimationFrame(() => updateTerrain())
    const unsub = useGameStore.subscribe(() => updateTerrain())
    return () => {
      cancelAnimationFrame(raf)
      unsub()
    }
  }, [updateTerrain])

  const maxCount = MAP_WIDTH * MAP_HEIGHT

  return (
    <group>
      {TERRAIN_TYPES.map(t => (
        <instancedMesh
          args={[geometry, materials[t], maxCount]}
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
