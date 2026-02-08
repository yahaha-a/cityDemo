import { useRef, useCallback, useEffect } from 'react'
import type * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { getBuildingDef } from '../config/building-defs'
import { useGameStore } from '../stores/game-store'
import type { GameEngine } from '../engine/game-engine'

export function InputPlane() {
  const planeRef = useRef<THREE.Mesh>(null)
  const isBuildingRef = useRef(false)

  const worldToGrid = useCallback(
    (point: THREE.Vector3): { x: number; y: number } | null => {
      const gx = Math.floor(point.x + MAP_WIDTH / 2)
      const gy = Math.floor(point.z + MAP_HEIGHT / 2)
      if (gx < 0 || gx >= MAP_WIDTH || gy < 0 || gy >= MAP_HEIGHT) return null
      return { x: gx, y: gy }
    },
    []
  )

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const { engine } = useGameStore.getState()
      if (!engine) return

      const grid = worldToGrid(e.point)
      const ge = engine as GameEngine

      if (grid) {
        ge.stateManager.setHoveredTile(grid)

        // 拖动建造：仅单格建筑（footprint.length === 1）支持拖动
        if (isBuildingRef.current) {
          const state = ge.stateManager.getState()
          const selectedBuildingId = state.selectedBuildingId

          if (selectedBuildingId) {
            const def = getBuildingDef(selectedBuildingId)
            // 多格建筑不拖动
            if (def && def.footprint.length === 1) {
              ge.buildingSystem.tryAction(grid.x, grid.y)
            }
          } else {
            // 非建筑选中模式：允许拖动
            ge.buildingSystem.tryAction(grid.x, grid.y)
          }
        }
      } else {
        ge.stateManager.setHoveredTile(null)
      }
    },
    [worldToGrid]
  )

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      // 只处理左键
      if (e.nativeEvent.button !== 0) return

      const { engine } = useGameStore.getState()
      if (!engine) return

      const grid = worldToGrid(e.point)
      if (!grid) return

      const ge = engine as GameEngine
      const state = ge.stateManager.getState()

      // 新路径：selectedBuildingId
      const selectedBuildingId = state.selectedBuildingId
      if (selectedBuildingId) {
        const def = getBuildingDef(selectedBuildingId)
        if (def && def.footprint.length > 1) {
          // 多格建筑：仅点击放置
          ge.buildingSystem.tryPlaceBuilding(selectedBuildingId, grid.x, grid.y)
          return
        }
      }

      isBuildingRef.current = true
      ge.buildingSystem.tryAction(grid.x, grid.y)
    },
    [worldToGrid]
  )

  const onPointerUp = useCallback(() => {
    isBuildingRef.current = false
  }, [])

  // R 键旋转建筑
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const { engine } = useGameStore.getState()
        if (!engine) return
        const ge = engine as GameEngine
        const state = ge.stateManager.getState()
        if (state.selectedBuildingId) {
          ge.rotateBuildingCW()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <mesh
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      position={[0, 0, 0]}
      ref={planeRef}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[MAP_WIDTH, MAP_HEIGHT]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  )
}
