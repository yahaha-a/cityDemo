import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ToolType, TerrainType } from 'shared/types'
import { getTileBuildingId } from 'shared/types/building-compat'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'

// 地形高度（与 TerrainGrid 一致），加半厚度 0.05 得到顶面
const TERRAIN_TOP_Y: Record<TerrainType, number> = {
  [TerrainType.Plain]: 0.05,
  [TerrainType.Hill]: 0.2,
  [TerrainType.Water]: -0.03,
  [TerrainType.Fertile]: 0.05,
  [TerrainType.Rocky]: 0.1,
}

export function HoverIndicator() {
  const meshRef = useRef<THREE.Mesh>(null)
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

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  useFrame(() => {
    const { state, engine } = useGameStore.getState()
    if (!state || !engine) return

    const mesh = meshRef.current
    if (!mesh) return

    const { hoveredTile, currentTool, selectedBuildingId } = state

    if (!hoveredTile) {
      mesh.visible = false
      return
    }

    const { x, y } = hoveredTile
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      mesh.visible = false
      return
    }

    // Build 模式下 BuildingPreview 接管，隐藏地面指示器
    if (selectedBuildingId) {
      mesh.visible = false
      return
    }

    // 悬停 tile 上有建筑时，Buildings 悬停高亮接管
    const tile = state.map.tiles[y][x]
    const bid = getTileBuildingId(tile)
    if (bid !== 'empty' && bid !== 'road') {
      mesh.visible = false
      return
    }

    // 单格模式：仅在 Select/Demolish/Upgrade 悬停空地/道路时显示
    mesh.visible = true
    const worldX = x - MAP_WIDTH / 2 + 0.5
    const worldZ = y - MAP_HEIGHT / 2 + 0.5
    const terrain = tile.terrain
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
    <mesh
      geometry={geometry}
      material={validMaterial}
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  )
}
