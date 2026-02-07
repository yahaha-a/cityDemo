import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TileType } from 'shared/types'
import { TILE_COLORS, MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'

const dummy = new THREE.Object3D()
const ROAD_HEIGHT = 0.02

export function RoadNetwork() {
  const meshRef = useRef<THREE.InstancedMesh>(null)

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
    let count = 0

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        if (tile.type !== TileType.Road) continue

        const worldX = x - MAP_WIDTH / 2 + 0.5
        const worldZ = y - MAP_HEIGHT / 2 + 0.5

        dummy.position.set(worldX, 0.06, worldZ)
        dummy.updateMatrix()
        mesh.setMatrixAt(count, dummy.matrix)
        count++
      }
    }

    mesh.count = count
    mesh.instanceMatrix.needsUpdate = true
  })

  const maxCount = MAP_WIDTH * MAP_HEIGHT

  return (
    <instancedMesh
      args={[geometry, material, maxCount]}
      receiveShadow
      ref={meshRef}
    />
  )
}
