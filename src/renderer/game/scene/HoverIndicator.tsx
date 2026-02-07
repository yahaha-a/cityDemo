import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ToolType, TerrainType } from 'shared/types'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { getBuildingDef } from '../config/building-defs'
import { useGameStore } from '../stores/game-store'

// 地形高度（与 TerrainGrid 一致），加半厚度 0.05 得到顶面
const TERRAIN_TOP_Y: Record<TerrainType, number> = {
  [TerrainType.Plain]: 0.05,
  [TerrainType.Hill]: 0.2,
  [TerrainType.Water]: -0.03,
  [TerrainType.Fertile]: 0.05,
  [TerrainType.Rocky]: 0.1,
}

const MAX_FOOTPRINT = 16

const dummy = new THREE.Object3D()

export function HoverIndicator() {
  // 单格指示器
  const meshRef = useRef<THREE.Mesh>(null)
  // 多格指示器
  const instancedRef = useRef<THREE.InstancedMesh>(null)
  const prevMaterialRef = useRef<THREE.Material | null>(null)

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

  const validColor = useMemo(() => new THREE.Color(0x00ff00), [])
  const invalidColor = useMemo(() => new THREE.Color(0xff0000), [])

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  useFrame(() => {
    const { state, engine } = useGameStore.getState()
    if (!state || !engine) return

    const mesh = meshRef.current
    const instanced = instancedRef.current
    if (!mesh) return

    const { hoveredTile, currentTool } = state

    if (!hoveredTile) {
      mesh.visible = false
      if (instanced) instanced.visible = false
      return
    }

    const { x, y } = hoveredTile
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      mesh.visible = false
      if (instanced) instanced.visible = false
      return
    }

    // 新路径：检查 selectedBuildingId
    const selectedBuildingId = state.selectedBuildingId
    if (selectedBuildingId && instanced) {
      const def = getBuildingDef(selectedBuildingId)
      if (def && def.footprint.length > 1) {
        // 多格建筑模式
        mesh.visible = false
        instanced.visible = true

        const ge = engine as import('../engine/game-engine').GameEngine
        const preview = ge.buildingSystem.getPreviewFootprint(
          selectedBuildingId,
          x,
          y
        )

        let idx = 0
        for (const cell of preview) {
          if (idx >= MAX_FOOTPRINT) break
          const worldX = cell.x - MAP_WIDTH / 2 + 0.5
          const worldZ = cell.y - MAP_HEIGHT / 2 + 0.5
          const terrain =
            cell.x >= 0 &&
            cell.x < MAP_WIDTH &&
            cell.y >= 0 &&
            cell.y < MAP_HEIGHT
              ? state.map.tiles[cell.y][cell.x].terrain
              : TerrainType.Plain
          const hoverY = (TERRAIN_TOP_Y[terrain] ?? 0.05) + 0.01

          dummy.position.set(worldX, hoverY, worldZ)
          dummy.rotation.set(-Math.PI / 2, 0, 0)
          dummy.scale.set(1, 1, 1)
          dummy.updateMatrix()
          instanced.setMatrixAt(idx, dummy.matrix)
          instanced.setColorAt(idx, cell.valid ? validColor : invalidColor)
          idx++
        }

        instanced.count = idx
        instanced.instanceMatrix.needsUpdate = true
        if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
        return
      }
    }

    // 单格模式
    if (instanced) instanced.visible = false
    mesh.visible = true
    const worldX = x - MAP_WIDTH / 2 + 0.5
    const worldZ = y - MAP_HEIGHT / 2 + 0.5
    const terrain = state.map.tiles[y][x].terrain
    const hoverY = (TERRAIN_TOP_Y[terrain] ?? 0.05) + 0.01
    mesh.position.set(worldX, hoverY, worldZ)

    // 判断有效性，仅在材质实际变化时赋值
    const hoverValidity = engine.gameLoop?.hoverValidity ?? 'none'
    const targetMaterial =
      currentTool === ToolType.Select || hoverValidity === 'valid'
        ? validMaterial
        : invalidMaterial
    if (prevMaterialRef.current !== targetMaterial) {
      mesh.material = targetMaterial
      prevMaterialRef.current = targetMaterial
    }
  })

  return (
    <group>
      <mesh
        geometry={geometry}
        material={validMaterial}
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <instancedMesh
        args={[geometry, validMaterial, MAX_FOOTPRINT]}
        frustumCulled={false}
        ref={instancedRef}
        visible={false}
      />
    </group>
  )
}
