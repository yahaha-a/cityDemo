import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TerrainType } from 'shared/types'
import { TERRAIN_COLORS, MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'

const TILE_UNIT = 1

// 将 hex 色转为 THREE.Color
function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

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

export function TerrainGrid() {
  const meshRefs = useRef<Record<string, THREE.InstancedMesh | null>>({})

  // 为每种地形创建材质
  const materials = useMemo(() => {
    const mats: Record<string, THREE.MeshStandardMaterial> = {}
    for (const t of TERRAIN_TYPES) {
      mats[t] = new THREE.MeshStandardMaterial({
        color: hexToColor(TERRAIN_COLORS[t].top),
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

  // 每帧更新实例矩阵
  useFrame(() => {
    const state = useGameStore.getState().state
    if (!state) return

    const { map } = state

    // 统计每种地形瓦片数
    const counts: Record<string, number> = {}
    for (const t of TERRAIN_TYPES) counts[t] = 0

    // 第一遍：统计仅空地上显示地形的瓦片
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        counts[tile.terrain]++
      }
    }

    // 第二遍：设置矩阵
    const indices: Record<string, number> = {}
    for (const t of TERRAIN_TYPES) indices[t] = 0

    const dummy = new THREE.Object3D()

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        const t = tile.terrain
        const mesh = meshRefs.current[t]
        if (!mesh) continue

        // 仅在需要时更新 count
        if (mesh.count !== counts[t]) {
          mesh.count = counts[t]
        }

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
  })

  const maxCount = MAP_WIDTH * MAP_HEIGHT

  return (
    <group>
      {TERRAIN_TYPES.map(t => (
        <instancedMesh
          args={[geometry, materials[t], maxCount]}
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
