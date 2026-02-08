import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TerrainType } from 'shared/types'
import type { BuildingId } from 'shared/types/building-defs'
import { rotateFootprint } from 'shared/types/building-defs'
import { getBuildingDef } from '../config/building-defs'
import { getBuildingGeometry } from './building-geometries'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'

const TERRAIN_Y_MAP: Record<TerrainType, number> = {
  [TerrainType.Plain]: 0,
  [TerrainType.Hill]: 0.15,
  [TerrainType.Water]: -0.08,
  [TerrainType.Fertile]: 0,
  [TerrainType.Rocky]: 0.05,
}

/**
 * 建筑放置预览 — 选中建筑工具后，在悬停位置显示半透明的 3D 建筑模型
 */
export function BuildingPreview() {
  const meshRef = useRef<THREE.Mesh>(null)
  const prevBuildingIdRef = useRef<BuildingId | null>(null)
  const prevHoverRef = useRef<{ x: number; y: number } | null>(null)
  const prevRotationRef = useRef<number>(0)
  const prevFootprintCenterRef = useRef<{ cx: number; cy: number }>({
    cx: 0,
    cy: 0,
  })
  const prevAllValidRef = useRef<boolean | null>(null)

  const validMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x66dd88,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        roughness: 0.8,
        metalness: 0.0,
      }),
    []
  )

  const invalidMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xdd6666,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        roughness: 0.8,
        metalness: 0.0,
      }),
    []
  )

  // 占位几何体（初始化用，会被替换）
  const placeholderGeo = useMemo(() => new THREE.BoxGeometry(0.1, 0.1, 0.1), [])

  useFrame(() => {
    const { state, engine } = useGameStore.getState()
    if (!state || !engine) return

    const mesh = meshRef.current
    if (!mesh) return

    const { hoveredTile, selectedBuildingId } = state
    // 直接从 stateManager 读取 buildingRotation（绕过 Zustand store，
    // 避免 store 刷新触发 Buildings 的全量重建）
    const ge = engine as import('../engine/game-engine').GameEngine
    const rotation = ge.stateManager.getState().buildingRotation ?? 0

    if (!selectedBuildingId || !hoveredTile) {
      mesh.visible = false
      prevHoverRef.current = null
      prevAllValidRef.current = null
      return
    }

    const def = getBuildingDef(selectedBuildingId)
    if (!def) {
      mesh.visible = false
      return
    }

    const { x, y } = hoveredTile
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      mesh.visible = false
      return
    }

    // 切换建筑类型或旋转变化时更新几何体和包围盒中心缓存
    const rotationChanged = rotation !== prevRotationRef.current
    if (selectedBuildingId !== prevBuildingIdRef.current || rotationChanged) {
      mesh.geometry = getBuildingGeometry(selectedBuildingId, 1)
      prevBuildingIdRef.current = selectedBuildingId
      prevRotationRef.current = rotation

      const footprint = rotateFootprint(def.footprint, rotation)
      let minDx = footprint[0].dx
      let maxDx = footprint[0].dx
      let minDy = footprint[0].dy
      let maxDy = footprint[0].dy
      for (let i = 1; i < footprint.length; i++) {
        if (footprint[i].dx < minDx) minDx = footprint[i].dx
        if (footprint[i].dx > maxDx) maxDx = footprint[i].dx
        if (footprint[i].dy < minDy) minDy = footprint[i].dy
        if (footprint[i].dy > maxDy) maxDy = footprint[i].dy
      }
      prevFootprintCenterRef.current = {
        cx: (minDx + maxDx) / 2,
        cy: (minDy + maxDy) / 2,
      }

      // 应用 Y 轴旋转
      mesh.rotation.set(0, -(rotation * Math.PI) / 2, 0)

      // 强制重新计算位置和有效性
      prevHoverRef.current = null
      prevAllValidRef.current = null
    }

    const prev = prevHoverRef.current
    const hoverChanged = !prev || prev.x !== x || prev.y !== y
    prevHoverRef.current = { x, y }

    if (hoverChanged) {
      // 通过 buildingSystem 检查所有足迹格的有效性
      const preview = ge.buildingSystem.getPreviewFootprint(
        selectedBuildingId,
        x,
        y,
        rotation
      )
      const allValid = preview.length > 0 && preview.every(c => c.valid)

      if (allValid !== prevAllValidRef.current) {
        mesh.material = allValid ? validMaterial : invalidMaterial
        prevAllValidRef.current = allValid
      }

      // 更新位置
      const { cx, cy } = prevFootprintCenterRef.current
      const worldX = x + cx - MAP_WIDTH / 2 + 0.5
      const worldZ = y + cy - MAP_HEIGHT / 2 + 0.5
      const tile = state.map.tiles[y][x]
      const terrainY = TERRAIN_Y_MAP[tile.terrain] ?? 0
      const baseTerrainTop = terrainY + 0.05

      mesh.position.set(worldX, baseTerrainTop, worldZ)
    }

    mesh.visible = true
  })

  return (
    <mesh
      geometry={placeholderGeo}
      material={validMaterial}
      ref={meshRef}
      visible={false}
    />
  )
}
