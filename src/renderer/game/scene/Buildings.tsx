import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TerrainType } from 'shared/types'
import type { BuildingId, BuildingCategory } from 'shared/types/building-defs'
import { rotateFootprint } from 'shared/types/building-defs'
import { getBuildingDef } from '../config/building-defs'
import { BUILDING_COLORS, MAP_WIDTH, MAP_HEIGHT } from '../config'
import { getBuildingGeometryPair } from './building-geometries'
import { getGradientMap3 } from './toon-materials'
import { useGameStore } from '../stores/game-store'
import type { GameEngine } from '../engine/game-engine'

/** 所有可渲染的建筑 ID（不含 empty/road） */
const RENDERABLE_IDS: BuildingId[] = [
  'house',
  'apartment',
  'residential_complex',
  'shop',
  'office',
  'mall',
  'factory',
  'heavy_industry',
  'warehouse',
  'park',
  'plaza',
  'school',
  'hospital',
  'fire_station',
  'police_station',
  'power_plant',
]

/** 受效率影响的建筑分类 */
const EFFICIENCY_CATEGORIES: BuildingCategory[] = [
  'residential',
  'commercial',
  'industrial',
]

// 地形高度偏移（与 TerrainGrid 保持一致）
const TERRAIN_Y_MAP: Record<TerrainType, number> = {
  [TerrainType.Plain]: 0,
  [TerrainType.Hill]: 0.15,
  [TerrainType.Water]: -0.08,
  [TerrainType.Fertile]: 0,
  [TerrainType.Rocky]: 0.05,
}

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
const tmpColor = new THREE.Color()
const hoverWhite = new THREE.Color(0xffffff)
const hoverOrigColor = new THREE.Color()
const hoverOrigAccentColor = new THREE.Color()

/** 生成 mesh key */
function baseMeshKey(id: BuildingId, level: number): string {
  return `${id}_base_${level}`
}
function accentMeshKey(id: BuildingId, level: number): string {
  return `${id}_accent_${level}`
}

/** buildingInstanceMap 条目 */
interface BuildingInstanceEntry {
  baseKey: string
  accentKey: string
  idx: number
  bid: BuildingId
}

export function Buildings() {
  const meshRefs = useRef<Record<string, THREE.InstancedMesh | null>>({})
  const prevMapRef = useRef<unknown>(null)
  const prevEffValues = useRef<Record<string, number>>({})
  const instanceIndexMap = useRef<
    Map<
      string,
      {
        buildingId: BuildingId
        category: BuildingCategory
        level: number
        idx: number
        connected: boolean
      }
    >
  >(new Map())

  // 所有建筑的实例索引映射（用于悬停高亮和增量更新）— 使用数字键
  const buildingInstanceMap = useRef<Map<number, BuildingInstanceEntry>>(
    new Map()
  )
  // 反向映射：(baseMeshKey, idx) → tileKey 用于 swap-and-pop
  const meshIdxToTile = useRef<Map<string, Map<number, number>>>(new Map())
  // 每个 baseMeshKey 的当前计数（base 和 accent 共享同一计数）
  const meshCounts = useRef<Record<string, number>>({})

  const prevHoverKeyRef = useRef<number | null>(null)
  const prevHoverRef = useRef<{
    baseKey: string
    accentKey: string
    idx: number
    origBaseColor: THREE.Color
    origAccentColor: THREE.Color
  } | null>(null)

  // park accent shader ref（树冠呼吸）
  const parkAccentShaderRef =
    useRef<THREE.WebGLProgramParametersWithUniforms | null>(null)

  // 为每种建筑创建材质（base + accent 各一个）
  const materials = useMemo(() => {
    const gradientMap = getGradientMap3()
    const mats: Record<string, THREE.MeshToonMaterial> = {}
    for (const id of RENDERABLE_IDS) {
      mats[`${id}_base`] = new THREE.MeshToonMaterial({
        color: new THREE.Color(BUILDING_COLORS[id].base),
        gradientMap,
      })
      const accentMat = new THREE.MeshToonMaterial({
        color: new THREE.Color(BUILDING_COLORS[id].accent),
        gradientMap,
      })
      // park accent: 注入树冠呼吸 uniform
      if (id === 'park') {
        accentMat.onBeforeCompile = shader => {
          shader.uniforms.uBreathScale = { value: 1.0 }
          shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
transformed *= uBreathScale;`
          )
          parkAccentShaderRef.current = shader
        }
      }
      mats[`${id}_accent`] = accentMat
    }
    return mats
  }, [])

  // 建立 mesh 配置列表: 每种建筑 × 每个等级 × (base + accent)
  const meshConfigs = useMemo(() => {
    const configs: Array<{
      key: string
      id: BuildingId
      level: number
      role: 'base' | 'accent'
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
      }
    }
    return configs
  }, [materials])

  useFrame(({ clock }) => {
    // 树冠呼吸动画
    if (parkAccentShaderRef.current) {
      parkAccentShaderRef.current.uniforms.uBreathScale.value =
        1.0 + Math.sin(clock.elapsedTime * 0.8) * 0.06
    }

    const store = useGameStore.getState()
    const state = store.state
    if (!state) return

    const { map, economy, hoveredTile, structures } = state
    const effByType = economy.efficiencyByType
    const mapChanged = map !== prevMapRef.current

    // 检查效率是否变化
    let effChanged = false
    for (const cat of EFFICIENCY_CATEGORIES) {
      const key = cat as string
      const val = effByType[key as keyof typeof effByType] ?? 1
      if (prevEffValues.current[key] !== val) {
        effChanged = true
        break
      }
    }

    // 解析当前悬停的建筑（多格建筑解析到 origin 格）— 使用数字键
    // Build 模式下 BuildingPreview 接管，跳过悬停高亮
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

    if (!colorsRebuilt && !hoverChanged) return

    if (mapChanged) prevMapRef.current = map
    if (effChanged) {
      for (const cat of EFFICIENCY_CATEGORIES) {
        const key = cat as string
        prevEffValues.current[key] =
          effByType[key as keyof typeof effByType] ?? 1
      }
    }

    // 效率-only 更新：仅更新颜色
    if (!mapChanged && effChanged) {
      const updatedMeshKeys = new Set<string>()
      for (const [, entry] of instanceIndexMap.current) {
        if (!EFFICIENCY_CATEGORIES.includes(entry.category)) continue
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
      }
      for (const key of updatedMeshKeys) {
        const mesh = meshRefs.current[key]
        if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true
      }
    }

    // map 变更处理
    if (mapChanged) {
      // 获取脏 Tile 信息
      const engine = store.engine as GameEngine | null
      const mapChanges = engine?.stateManager.getMapChanges()
      const isFull = !mapChanges || mapChanges.full

      if (isFull) {
        // === 全量重建 ===
        instanceIndexMap.current.clear()
        buildingInstanceMap.current.clear()
        meshIdxToTile.current.clear()
        const indices: Record<string, number> = {}
        for (const cfg of meshConfigs) {
          if (cfg.role === 'base') {
            indices[cfg.key] = 0
            meshIdxToTile.current.set(cfg.key, new Map())
          }
        }

        for (let y = 0; y < MAP_HEIGHT; y++) {
          for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map.tiles[y][x]
            const bid = tile.buildingId
            if (bid === 'empty' || bid === 'road') continue

            // 多格建筑只在 origin 格渲染
            if (tile.structureRole === 'part') continue

            const def = getBuildingDef(bid)
            if (!def) continue

            const level = tile.level || 1
            const bKey = baseMeshKey(bid, level)
            const aKey = accentMeshKey(bid, level)
            const baseMesh = meshRefs.current[bKey]
            const accentMesh = meshRefs.current[aKey]
            if (!baseMesh || !accentMesh) continue

            const idx = indices[bKey]++
            const tileKey = y * MAP_WIDTH + x

            setBuildingInstance(
              baseMesh,
              accentMesh,
              idx,
              x,
              y,
              tile,
              def,
              structures,
              effByType
            )

            // 缓存建筑实例索引
            buildingInstanceMap.current.set(tileKey, {
              baseKey: bKey,
              accentKey: aKey,
              idx,
              bid,
            })
            meshIdxToTile.current.get(bKey)?.set(idx, tileKey)

            // 缓存效率相关建筑索引
            if (EFFICIENCY_CATEGORIES.includes(def.category)) {
              instanceIndexMap.current.set(`${x},${y}`, {
                buildingId: bid,
                category: def.category,
                level,
                idx,
                connected: tile.connected,
              })
            }
          }
        }

        meshCounts.current = indices

        // 设 count 并标记更新
        for (const cfg of meshConfigs) {
          const mesh = meshRefs.current[cfg.key]
          if (!mesh) continue
          if (cfg.role === 'base') {
            const count = indices[cfg.key] ?? 0
            mesh.count = count
            // accent mesh 使用相同 count
            const aMesh = meshRefs.current[accentMeshKey(cfg.id, cfg.level)]
            if (aMesh) aMesh.count = count
            if (count > 0) {
              mesh.instanceMatrix.needsUpdate = true
              if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
              if (aMesh) {
                aMesh.instanceMatrix.needsUpdate = true
                if (aMesh.instanceColor) aMesh.instanceColor.needsUpdate = true
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

          const oldEntry = buildingInstanceMap.current.get(tileKey)

          // 移除旧实例（swap-and-pop）
          if (oldEntry) {
            const bk = oldEntry.baseKey
            const ak = oldEntry.accentKey
            const baseMesh = meshRefs.current[bk]
            const accentMesh = meshRefs.current[ak]
            if (baseMesh && accentMesh) {
              const lastIdx = (meshCounts.current[bk] ?? 1) - 1
              if (oldEntry.idx !== lastIdx) {
                // 把末尾实例的 matrix 和 color 复制到被移除的位置
                const tmpMatrix = new THREE.Matrix4()

                // base mesh
                baseMesh.getMatrixAt(lastIdx, tmpMatrix)
                baseMesh.setMatrixAt(oldEntry.idx, tmpMatrix)
                if (baseMesh.instanceColor) {
                  const tmpC = new THREE.Color()
                  baseMesh.getColorAt(lastIdx, tmpC)
                  baseMesh.setColorAt(oldEntry.idx, tmpC)
                }

                // accent mesh
                accentMesh.getMatrixAt(lastIdx, tmpMatrix)
                accentMesh.setMatrixAt(oldEntry.idx, tmpMatrix)
                if (accentMesh.instanceColor) {
                  const tmpC = new THREE.Color()
                  accentMesh.getColorAt(lastIdx, tmpC)
                  accentMesh.setColorAt(oldEntry.idx, tmpC)
                }

                // 更新被移动实例的反向映射
                const reverseMap = meshIdxToTile.current.get(bk)
                const movedTileKey = reverseMap?.get(lastIdx)
                if (reverseMap && movedTileKey !== undefined) {
                  const movedBuildingEntry =
                    buildingInstanceMap.current.get(movedTileKey)
                  if (movedBuildingEntry) {
                    movedBuildingEntry.idx = oldEntry.idx
                  }
                  reverseMap.set(oldEntry.idx, movedTileKey)

                  // 更新 instanceIndexMap 中被移动实例的 idx
                  const movedX = movedTileKey % MAP_WIDTH
                  const movedY = (movedTileKey - movedX) / MAP_WIDTH
                  const movedIndexEntry = instanceIndexMap.current.get(
                    `${movedX},${movedY}`
                  )
                  if (movedIndexEntry) {
                    movedIndexEntry.idx = oldEntry.idx
                  }
                }
              }
              meshCounts.current[bk]--
              meshIdxToTile.current.get(bk)?.delete(lastIdx)
              affectedBaseKeys.add(bk)
            }
            buildingInstanceMap.current.delete(tileKey)
            instanceIndexMap.current.delete(`${x},${y}`)
          }

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
          const baseMesh = meshRefs.current[bKey]
          const accentMesh = meshRefs.current[aKey]
          if (!baseMesh || !accentMesh) continue

          const idx = meshCounts.current[bKey] ?? 0
          meshCounts.current[bKey] = idx + 1

          setBuildingInstance(
            baseMesh,
            accentMesh,
            idx,
            x,
            y,
            tile,
            def,
            structures,
            effByType
          )

          buildingInstanceMap.current.set(tileKey, {
            baseKey: bKey,
            accentKey: aKey,
            idx,
            bid,
          })
          if (!meshIdxToTile.current.has(bKey)) {
            meshIdxToTile.current.set(bKey, new Map())
          }
          meshIdxToTile.current.get(bKey)?.set(idx, tileKey)

          if (EFFICIENCY_CATEGORIES.includes(def.category)) {
            instanceIndexMap.current.set(`${x},${y}`, {
              buildingId: bid,
              category: def.category,
              level,
              idx,
              connected: tile.connected,
            })
          }

          affectedBaseKeys.add(bKey)
        }

        // 更新受影响的 mesh
        for (const bk of affectedBaseKeys) {
          const baseMesh = meshRefs.current[bk]
          if (!baseMesh) continue
          const count = meshCounts.current[bk] ?? 0
          baseMesh.count = count
          baseMesh.instanceMatrix.needsUpdate = true
          if (baseMesh.instanceColor) baseMesh.instanceColor.needsUpdate = true

          // 从 bk 提取 accent key
          const ak = bk.replace('_base_', '_accent_')
          const accentMesh = meshRefs.current[ak]
          if (accentMesh) {
            accentMesh.count = count
            accentMesh.instanceMatrix.needsUpdate = true
            if (accentMesh.instanceColor)
              accentMesh.instanceColor.needsUpdate = true
          }
        }
      }
    }

    // 悬停高亮
    if (colorsRebuilt || hoverChanged) {
      // 取消之前的高亮（仅在颜色未重建时需要手动恢复）
      if (!colorsRebuilt && prevHoverRef.current) {
        const prev = prevHoverRef.current
        const baseMesh = meshRefs.current[prev.baseKey]
        const accentMesh = meshRefs.current[prev.accentKey]
        if (baseMesh) {
          baseMesh.setColorAt(prev.idx, prev.origBaseColor)
          if (baseMesh.instanceColor) baseMesh.instanceColor.needsUpdate = true
        }
        if (accentMesh) {
          accentMesh.setColorAt(prev.idx, prev.origAccentColor)
          if (accentMesh.instanceColor)
            accentMesh.instanceColor.needsUpdate = true
        }
      }

      prevHoverKeyRef.current = hoverGridKey
      prevHoverRef.current = null

      // 应用新的高亮
      if (hoverGridKey !== null) {
        const entry = buildingInstanceMap.current.get(hoverGridKey)
        if (entry) {
          const baseMesh = meshRefs.current[entry.baseKey]
          const accentMesh = meshRefs.current[entry.accentKey]
          if (baseMesh?.instanceColor && accentMesh?.instanceColor) {
            baseMesh.getColorAt(entry.idx, hoverOrigColor)
            accentMesh.getColorAt(entry.idx, hoverOrigAccentColor)
            prevHoverRef.current = {
              baseKey: entry.baseKey,
              accentKey: entry.accentKey,
              idx: entry.idx,
              origBaseColor: hoverOrigColor.clone(),
              origAccentColor: hoverOrigAccentColor.clone(),
            }
            tmpColor.copy(hoverOrigColor).lerp(hoverWhite, 0.35)
            baseMesh.setColorAt(entry.idx, tmpColor)
            baseMesh.instanceColor.needsUpdate = true

            tmpColor.copy(hoverOrigAccentColor).lerp(hoverWhite, 0.35)
            accentMesh.setColorAt(entry.idx, tmpColor)
            accentMesh.instanceColor.needsUpdate = true
          }
        }
      }
    }
  })

  return (
    <group>
      {meshConfigs.map(cfg => (
        <instancedMesh
          args={[cfg.geometry, cfg.material, cfg.maxCount]}
          castShadow
          frustumCulled={false}
          key={cfg.key}
          receiveShadow
          ref={el => {
            meshRefs.current[cfg.key] = el
          }}
        />
      ))}
    </group>
  )
}

/** 应用效率和连接状态到颜色 */
function applyEfficiencyColor(
  color: THREE.Color,
  entry: { connected: boolean; category: BuildingCategory },
  effByType: Record<string, number>
): void {
  if (!entry.connected) {
    color.multiplyScalar(0.4)
  } else if (EFFICIENCY_CATEGORIES.includes(entry.category)) {
    const eff = effByType[entry.category as keyof typeof effByType] ?? 1
    if (eff < 1) {
      const gray = (color.r + color.g + color.b) / 3
      const factor = (1 - eff) * 0.6
      color.r = color.r * (1 - factor) + gray * factor
      color.g = color.g * (1 - factor) + gray * factor
      color.b = color.b * (1 - factor) + gray * factor
    }
  }
}

/** 设置建筑实例的 matrix 和颜色（同时设置 base 和 accent） */
function setBuildingInstance(
  baseMesh: THREE.InstancedMesh,
  accentMesh: THREE.InstancedMesh,
  idx: number,
  x: number,
  y: number,
  tile: {
    terrain: TerrainType
    connected: boolean
    level: number
    structureId?: string
    buildingId: string
  },
  def: { footprint: Array<{ dx: number; dy: number }>; category: string },
  structures: {
    instances: Record<
      string,
      { rotation?: number; originX: number; originY: number }
    >
  },
  effByType: Record<string, number>
): void {
  // 多格建筑读取旋转值
  let buildingRotation = 0
  if (tile.structureId) {
    const inst = structures.instances[tile.structureId]
    if (inst) buildingRotation = inst.rotation ?? 0
  }

  // 计算多格建筑的包围盒中心（使用旋转后的 footprint）
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

  // 同一个 matrix 设到 base 和 accent
  baseMesh.setMatrixAt(idx, dummy.matrix)
  accentMesh.setMatrixAt(idx, dummy.matrix)

  // base 颜色
  const bid = tile.buildingId as BuildingId
  tmpColor.set(BUILDING_COLORS[bid].base)
  if (!tile.connected) {
    tmpColor.multiplyScalar(0.4)
  } else if (EFFICIENCY_CATEGORIES.includes(def.category as BuildingCategory)) {
    const eff = effByType[def.category as keyof typeof effByType] ?? 1
    if (eff < 1) {
      const gray = (tmpColor.r + tmpColor.g + tmpColor.b) / 3
      const factor = (1 - eff) * 0.6
      tmpColor.r = tmpColor.r * (1 - factor) + gray * factor
      tmpColor.g = tmpColor.g * (1 - factor) + gray * factor
      tmpColor.b = tmpColor.b * (1 - factor) + gray * factor
    }
  }
  baseMesh.setColorAt(idx, tmpColor)

  // accent 颜色
  tmpColor.set(BUILDING_COLORS[bid].accent)
  if (!tile.connected) {
    tmpColor.multiplyScalar(0.4)
  } else if (EFFICIENCY_CATEGORIES.includes(def.category as BuildingCategory)) {
    const eff = effByType[def.category as keyof typeof effByType] ?? 1
    if (eff < 1) {
      const gray = (tmpColor.r + tmpColor.g + tmpColor.b) / 3
      const factor = (1 - eff) * 0.6
      tmpColor.r = tmpColor.r * (1 - factor) + gray * factor
      tmpColor.g = tmpColor.g * (1 - factor) + gray * factor
      tmpColor.b = tmpColor.b * (1 - factor) + gray * factor
    }
  }
  accentMesh.setColorAt(idx, tmpColor)
}
