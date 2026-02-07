import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TileType } from 'shared/types'
import { TILE_COLORS, MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'

const dummy = new THREE.Object3D()
const ROAD_HEIGHT = 0.02

// 地形高度偏移（与 TerrainGrid / Buildings 保持一致）
const TERRAIN_Y_MAP: Record<string, number> = {
  plain: 0,
  hill: 0.15,
  water: -0.08,
  fertile: 0,
  rocky: 0.05,
}

export function RoadNetwork() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  // 脏标记：道路只在建造/拆除时变化
  const prevMapRef = useRef<unknown>(null)

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(TILE_COLORS[TileType.Road].top),
        roughness: 0.9,
        metalness: 0.05,
      }),
    []
  )

  const geometry = useMemo(
    () => new THREE.BoxGeometry(0.98, ROAD_HEIGHT, 0.98),
    []
  )

  useFrame(() => {
    const state = useGameStore.getState().state
    if (!state) return

    const mesh = meshRef.current
    if (!mesh) return

    const { map } = state

    // 引用比较：map 未变则跳过
    if (map === prevMapRef.current) return
    prevMapRef.current = map

    let count = 0

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        if (tile.type !== TileType.Road) continue

        const worldX = x - MAP_WIDTH / 2 + 0.5
        const worldZ = y - MAP_HEIGHT / 2 + 0.5
        const terrainY = TERRAIN_Y_MAP[tile.terrain] ?? 0

        dummy.position.set(worldX, terrainY + 0.06, worldZ)
        dummy.updateMatrix()
        mesh.setMatrixAt(count, dummy.matrix)
        count++
      }
    }

    mesh.count = count
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      args={[geometry, material, 1024]}
      frustumCulled={false}
      receiveShadow
      ref={meshRef}
    />
  )
}
