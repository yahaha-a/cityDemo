import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { TerrainType } from 'shared/types'
import type { BuildingId } from 'shared/types/building-defs'
import { rotateFootprint } from 'shared/types/building-defs'
import { getBuildingDef } from '../config/building-defs'
import {
  BUILDING_COLORS,
  WINDOW_GLOW_COLORS,
  MAP_WIDTH,
  MAP_HEIGHT,
} from '../config'
import { getBuildingGeometryPair } from './building-geometries'
import { disposeBuildingGeometries } from './building-geometries'
import {
  getGradientMap3,
  getGradientMap4,
  getGradientMap5,
} from './toon-materials'
import { getTimeOfDay, getNightFactor } from './day-night-cycle'
import { useGameStore } from '../stores/game-store'
import type { GameEngine } from '../engine/game-engine'
import { TERRAIN_Y_MAP } from './scene-constants'
import {
  type ShaderRefMap,
  injectBuildingAnimation,
  updateBuildingAnimations,
} from './building-animations'
import {
  RENDERABLE_IDS,
  EFFICIENCY_CATEGORIES,
  applyEfficiencyColor,
  setInstanceColors,
  applyHoverHighlight,
  removeHoverHighlight,
  updateWindowEmissive,
  type HoverHighlightState,
} from './building-coloring'
import {
  BuildingInstanceManager,
  baseMeshKey,
  accentMeshKey,
  windowMeshKey,
} from './building-instance-manager'
import { buildingIdToCategory } from 'shared/types/building-defs'

// 每种建筑 ID 的最大实例分配量
const MAX_INSTANCES: Partial<Record<BuildingId, number>> = {
  house: 1024,
  apartment: 512,
  residential_complex: 256,
  shop: 1024,
  office: 512,
  mall: 256,
  factory: 1024,
  heavy_industry: 256,
  warehouse: 256,
  park: 256,
  plaza: 128,
  school: 128,
  hospital: 128,
  fire_station: 128,
  police_station: 128,
  power_plant: 128,
}

const dummy = new THREE.Object3D()

export function Buildings() {
  const meshRefs = useRef<Record<string, THREE.InstancedMesh | null>>({})
  const prevMapRef = useRef<unknown>(null)
  const prevEffValues = useRef<Record<string, number>>({})
  const prevHoverKeyRef = useRef<number | null>(null)
  const prevHoverRef = useRef<HoverHighlightState | null>(null)
  const prevNightFactorRef = useRef(-1)

  const shaderRefs = useRef<ShaderRefMap>(new Map())
  const instanceManager = useRef(new BuildingInstanceManager())

  // 为每种建筑创建材质（base + accent + windows 各一个）
  const materials = useMemo(() => {
    const gm3 = getGradientMap3()
    const gm4 = getGradientMap4()
    const gm5 = getGradientMap5()

    const industrialIds: BuildingId[] = [
      'factory',
      'heavy_industry',
      'warehouse',
      'fire_station',
      'police_station',
      'power_plant',
    ]
    const commercialIds: BuildingId[] = ['shop', 'office', 'mall']

    const mats: Record<string, THREE.MeshToonMaterial> = {}
    for (const id of RENDERABLE_IDS) {
      const isIndustrial = industrialIds.includes(id)
      const baseGradient = isIndustrial ? gm3 : gm5
      const accentGradient = isIndustrial ? gm3 : gm4

      mats[`${id}_base`] = new THREE.MeshToonMaterial({
        color: new THREE.Color(BUILDING_COLORS[id].base),
        gradientMap: baseGradient,
      })
      const accentMat = new THREE.MeshToonMaterial({
        color: new THREE.Color(BUILDING_COLORS[id].accent),
        gradientMap: accentGradient,
        side: id === 'park' ? THREE.DoubleSide : THREE.FrontSide,
      })

      // 数据驱动的动画 shader 注入
      injectBuildingAnimation(id, accentMat, shaderRefs.current)

      mats[`${id}_accent`] = accentMat

      // 窗户材质
      const category = buildingIdToCategory(id)
      const glowColor = category ? WINDOW_GLOW_COLORS[category] : '#ffd888'
      const isCommercial = commercialIds.includes(id)
      mats[`${id}_windows`] = new THREE.MeshToonMaterial({
        color: new THREE.Color(BUILDING_COLORS[id].window),
        gradientMap: baseGradient,
        emissive: new THREE.Color(glowColor),
        emissiveIntensity: isCommercial ? 0.08 : 0,
      })
    }
    return mats
  }, [])

  // 建立 mesh 配置列表
  const meshConfigs = useMemo(() => {
    const configs: Array<{
      key: string
      id: BuildingId
      level: number
      role: 'base' | 'accent' | 'windows'
      geometry: THREE.BufferGeometry
      material: THREE.MeshToonMaterial
      maxCount: number
    }> = []

    for (const id of RENDERABLE_IDS) {
      const def = getBuildingDef(id)
      if (!def) continue
      const maxLvl = def.maxLevel
      for (let lvl = 1; lvl <= maxLvl; lvl++) {
        const pair = getBuildingGeometryPair(id, lvl)
        const maxCount = MAX_INSTANCES[id] ?? 256
        configs.push({
          key: baseMeshKey(id, lvl),
          id,
          level: lvl,
          role: 'base',
          geometry: pair.base,
          material: materials[`${id}_base`],
          maxCount,
        })
        configs.push({
          key: accentMeshKey(id, lvl),
          id,
          level: lvl,
          role: 'accent',
          geometry: pair.accent,
          material: materials[`${id}_accent`],
          maxCount,
        })
        if (pair.windows.attributes.position) {
          configs.push({
            key: windowMeshKey(id, lvl),
            id,
            level: lvl,
            role: 'windows',
            geometry: pair.windows,
            material: materials[`${id}_windows`],
            maxCount,
          })
        }
      }
    }
    return configs
  }, [materials])

  // cleanup
  useEffect(() => {
    return () => {
      shaderRefs.current.clear()
      for (const key of Object.keys(materials)) {
        materials[key].dispose()
      }
      disposeBuildingGeometries()
    }
  }, [materials])

  useFrame(({ clock }) => {
    // 动画更新
    updateBuildingAnimations(clock.elapsedTime, shaderRefs.current)

    const store = useGameStore.getState()
    const state = store.state
    if (!state) return

    const { map, economy, hoveredTile, structures } = state
    const effByType = economy.efficiencyByType
    const mapChanged = map !== prevMapRef.current
    const mgr = instanceManager.current

    // 检查效率变化
    let effChanged = false
    for (const cat of EFFICIENCY_CATEGORIES) {
      const key = cat as string
      const val = effByType[key as keyof typeof effByType] ?? 1
      if (prevEffValues.current[key] !== val) {
        effChanged = true
        break
      }
    }

    // 解析悬停建筑
    let hoverGridKey: number | null = null
    if (hoveredTile && !state.selectedBuildingId) {
      const ht = map.tiles[hoveredTile.y]?.[hoveredTile.x]
      if (ht) {
        const hBid = ht.buildingId
        if (hBid !== 'empty' && hBid !== 'road') {
          if (ht.structureId && ht.structureRole === 'part') {
            const inst = structures.instances[ht.structureId]
            if (inst) hoverGridKey = inst.originY * MAP_WIDTH + inst.originX
          } else {
            hoverGridKey = hoveredTile.y * MAP_WIDTH + hoveredTile.x
          }
        }
      }
    }
    const hoverChanged = hoverGridKey !== prevHoverKeyRef.current
    const colorsRebuilt = mapChanged || effChanged

    // 昼夜窗户发光
    const currentDay = state.time.day
    const timeOfDay = getTimeOfDay(currentDay)
    const nightFactor = getNightFactor(timeOfDay)
    if (Math.abs(nightFactor - prevNightFactorRef.current) > 0.01) {
      prevNightFactorRef.current = nightFactor
      updateWindowEmissive(materials, nightFactor)
    }

    if (!colorsRebuilt && !hoverChanged) return

    if (mapChanged) prevMapRef.current = map
    if (effChanged) {
      for (const cat of EFFICIENCY_CATEGORIES) {
        const key = cat as string
        prevEffValues.current[key] =
          effByType[key as keyof typeof effByType] ?? 1
      }
    }

    // 效率-only 更新
    if (!mapChanged && effChanged) {
      const updatedMeshKeys = new Set<string>()
      const tmpColor = new THREE.Color()
      mgr.forEachEfficiencyEntry((_, entry) => {
        if (!EFFICIENCY_CATEGORIES.includes(entry.category)) return
        const bKey = baseMeshKey(entry.buildingId, entry.level)
        const aKey = accentMeshKey(entry.buildingId, entry.level)
        const baseMesh = meshRefs.current[bKey]
        const accentMesh = meshRefs.current[aKey]

        if (baseMesh) {
          tmpColor.set(BUILDING_COLORS[entry.buildingId].base)
          applyEfficiencyColor(tmpColor, entry, effByType)
          baseMesh.setColorAt(entry.idx, tmpColor)
          updatedMeshKeys.add(bKey)
        }
        if (accentMesh) {
          tmpColor.set(BUILDING_COLORS[entry.buildingId].accent)
          applyEfficiencyColor(tmpColor, entry, effByType)
          accentMesh.setColorAt(entry.idx, tmpColor)
          updatedMeshKeys.add(aKey)
        }
      })
      for (const key of updatedMeshKeys) {
        const mesh = meshRefs.current[key]
        if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true
      }
    }

    // map 变更处理
    if (mapChanged) {
      const engine = store.engine as GameEngine | null
      const mapChanges = engine?.stateManager.getMapChanges()
      const isFull = !mapChanges || mapChanges.full

      if (isFull) {
        // === 全量重建 ===
        mgr.clear()
        for (const cfg of meshConfigs) {
          if (cfg.role === 'base') mgr.initBaseKey(cfg.key)
        }

        for (let y = 0; y < MAP_HEIGHT; y++) {
          for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map.tiles[y][x]
            const bid = tile.buildingId
            if (bid === 'empty' || bid === 'road') continue
            if (tile.structureRole === 'part') continue

            const def = getBuildingDef(bid)
            if (!def) continue

            const level = tile.level || 1
            const bKey = baseMeshKey(bid, level)
            const aKey = accentMeshKey(bid, level)
            const wKey = windowMeshKey(bid, level)
            const baseMesh = meshRefs.current[bKey]
            const accentMesh = meshRefs.current[aKey]
            const windowMesh = meshRefs.current[wKey]
            if (!baseMesh || !accentMesh) continue

            const tileKey = y * MAP_WIDTH + x
            const idx = mgr.addInstance(
              tileKey,
              x,
              y,
              bid,
              bKey,
              aKey,
              wKey,
              EFFICIENCY_CATEGORIES.includes(def.category)
                ? def.category
                : null,
              level,
              tile.connected,
              EFFICIENCY_CATEGORIES.includes(def.category)
            )

            setBuildingMatrix(
              baseMesh,
              accentMesh,
              windowMesh,
              idx,
              x,
              y,
              tile,
              def,
              structures
            )
            setInstanceColors(
              baseMesh,
              accentMesh,
              windowMesh,
              idx,
              bid,
              tile.connected,
              def.category,
              effByType
            )
          }
        }

        // 设 count 并标记更新
        const counts = mgr.getMeshCounts()
        for (const cfg of meshConfigs) {
          const mesh = meshRefs.current[cfg.key]
          if (!mesh) continue
          if (cfg.role === 'base') {
            const count = counts[cfg.key] ?? 0
            mesh.count = count
            const aMesh =
              meshRefs.current[accentMeshKey(cfg.id, cfg.level)]
            const wMesh =
              meshRefs.current[windowMeshKey(cfg.id, cfg.level)]
            if (aMesh) aMesh.count = count
            if (wMesh) wMesh.count = count
            if (count > 0) {
              mesh.instanceMatrix.needsUpdate = true
              if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
              if (aMesh) {
                aMesh.instanceMatrix.needsUpdate = true
                if (aMesh.instanceColor)
                  aMesh.instanceColor.needsUpdate = true
              }
              if (wMesh) {
                wMesh.instanceMatrix.needsUpdate = true
                if (wMesh.instanceColor)
                  wMesh.instanceColor.needsUpdate = true
              }
            }
          }
        }
      } else {
        // === 增量更新 ===
        const affectedBaseKeys = new Set<string>()

        for (const tileKey of mapChanges.tiles) {
          const x = tileKey % MAP_WIDTH
          const y = (tileKey - x) / MAP_WIDTH

          // 移除旧实例
          const removedBk = mgr.removeInstance(tileKey, meshRefs.current)
          if (removedBk) affectedBaseKeys.add(removedBk)

          // 添加新实例
          const tile = map.tiles[y][x]
          const bid = tile.buildingId
          if (bid === 'empty' || bid === 'road') continue
          if (tile.structureRole === 'part') continue

          const def = getBuildingDef(bid)
          if (!def) continue

          const level = tile.level || 1
          const bKey = baseMeshKey(bid, level)
          const aKey = accentMeshKey(bid, level)
          const wKey = windowMeshKey(bid, level)
          const baseMesh = meshRefs.current[bKey]
          const accentMesh = meshRefs.current[aKey]
          const windowMesh = meshRefs.current[wKey]
          if (!baseMesh || !accentMesh) continue

          const idx = mgr.addInstance(
            tileKey,
            x,
            y,
            bid,
            bKey,
            aKey,
            wKey,
            EFFICIENCY_CATEGORIES.includes(def.category)
              ? def.category
              : null,
            level,
            tile.connected,
            EFFICIENCY_CATEGORIES.includes(def.category)
          )

          setBuildingMatrix(
            baseMesh,
            accentMesh,
            windowMesh,
            idx,
            x,
            y,
            tile,
            def,
            structures
          )
          setInstanceColors(
            baseMesh,
            accentMesh,
            windowMesh,
            idx,
            bid,
            tile.connected,
            def.category,
            effByType
          )

          affectedBaseKeys.add(bKey)
        }

        // 更新受影响的 mesh
        const counts = mgr.getMeshCounts()
        for (const bk of affectedBaseKeys) {
          const baseMesh = meshRefs.current[bk]
          if (!baseMesh) continue
          const count = counts[bk] ?? 0
          baseMesh.count = count
          baseMesh.instanceMatrix.needsUpdate = true
          if (baseMesh.instanceColor)
            baseMesh.instanceColor.needsUpdate = true

          const ak = bk.replace('_base_', '_accent_')
          const wk = bk.replace('_base_', '_windows_')
          const accentMesh = meshRefs.current[ak]
          if (accentMesh) {
            accentMesh.count = count
            accentMesh.instanceMatrix.needsUpdate = true
            if (accentMesh.instanceColor)
              accentMesh.instanceColor.needsUpdate = true
          }
          const windowMesh = meshRefs.current[wk]
          if (windowMesh) {
            windowMesh.count = count
            windowMesh.instanceMatrix.needsUpdate = true
            if (windowMesh.instanceColor)
              windowMesh.instanceColor.needsUpdate = true
          }
        }
      }
    }

    // 悬停高亮
    if (colorsRebuilt || hoverChanged) {
      if (!colorsRebuilt && prevHoverRef.current) {
        removeHoverHighlight(meshRefs.current, prevHoverRef.current)
      }

      prevHoverKeyRef.current = hoverGridKey
      prevHoverRef.current = null

      if (hoverGridKey !== null) {
        const entry = mgr.getByTileKey(hoverGridKey)
        if (entry) {
          prevHoverRef.current = applyHoverHighlight(
            meshRefs.current,
            entry
          )
        }
      }
    }
  })

  return (
    <group>
      {meshConfigs.map((cfg) => (
        <instancedMesh
          args={[cfg.geometry, cfg.material, cfg.maxCount]}
          castShadow
          frustumCulled={false}
          key={cfg.key}
          receiveShadow
          ref={(el) => {
            meshRefs.current[cfg.key] = el
          }}
        />
      ))}
    </group>
  )
}

/** 设置建筑实例的 matrix（base + accent + windows 共用） */
function setBuildingMatrix(
  baseMesh: THREE.InstancedMesh,
  accentMesh: THREE.InstancedMesh,
  windowMesh: THREE.InstancedMesh | null,
  idx: number,
  x: number,
  y: number,
  tile: {
    terrain: TerrainType
    structureId?: string
  },
  def: { footprint: Array<{ dx: number; dy: number }> },
  structures: {
    instances: Record<
      string,
      { rotation?: number; originX: number; originY: number }
    >
  }
): void {
  let buildingRotation = 0
  if (tile.structureId) {
    const inst = structures.instances[tile.structureId]
    if (inst) buildingRotation = inst.rotation ?? 0
  }

  const footprint = rotateFootprint(def.footprint, buildingRotation)
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
  const cx = (minDx + maxDx) / 2
  const cy = (minDy + maxDy) / 2

  const worldX = x + cx - MAP_WIDTH / 2 + 0.5
  const worldZ = y + cy - MAP_HEIGHT / 2 + 0.5
  const terrainY = TERRAIN_Y_MAP[tile.terrain] ?? 0
  const baseTerrainTop = terrainY + 0.05

  dummy.position.set(worldX, baseTerrainTop, worldZ)
  dummy.scale.set(1, 1, 1)
  dummy.rotation.set(0, -(buildingRotation * Math.PI) / 2, 0)
  dummy.updateMatrix()

  baseMesh.setMatrixAt(idx, dummy.matrix)
  accentMesh.setMatrixAt(idx, dummy.matrix)
  if (windowMesh) windowMesh.setMatrixAt(idx, dummy.matrix)
}
