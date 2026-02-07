import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ToolType } from 'shared/types'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'

export function HoverIndicator() {
  const meshRef = useRef<THREE.Mesh>(null)

  const validMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    []
  )

  const invalidMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    []
  )

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  useFrame(() => {
    const { state, engine } = useGameStore.getState()
    if (!state || !engine) return

    const mesh = meshRef.current
    if (!mesh) return

    const { hoveredTile, currentTool } = state

    if (!hoveredTile) {
      mesh.visible = false
      return
    }

    const { x, y } = hoveredTile
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      mesh.visible = false
      return
    }

    mesh.visible = true
    const worldX = x - MAP_WIDTH / 2 + 0.5
    const worldZ = y - MAP_HEIGHT / 2 + 0.5
    mesh.position.set(worldX, 0.12, worldZ)

    // 判断有效性
    const hoverValidity = engine.gameLoop?.hoverValidity ?? 'none'
    mesh.material =
      currentTool === ToolType.Select || hoverValidity === 'valid'
        ? validMaterial
        : invalidMaterial
  })

  return (
    <mesh geometry={geometry} ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial
        color={0x00ff00}
        depthWrite={false}
        opacity={0.35}
        transparent
      />
    </mesh>
  )
}
