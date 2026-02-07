import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TerrainType } from 'shared/types'
import type { BuildingId, BuildingCategory } from 'shared/types/building-defs'
import { getTileBuildingId } from 'shared/types/building-compat'
import { getBuildingDef } from '../config/building-defs'
import { BUILDING_COLORS, MAP_WIDTH, MAP_HEIGHT } from '../config'
import { getBuildingGeometry } from './building-geometries'
import { useGameStore } from '../stores/game-store'

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

/** 每种建筑的等级 */
const _MAX_LEVEL = 3

const dummy = new THREE.Object3D()
const tmpColor = new THREE.Color()

/** 生成 mesh key: buildingId_level */
function meshKey(id: BuildingId, level: number): string {
  return `${id}_${level}`
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

  // 为每种建筑创建材质
  const materials = useMemo(() => {
    const mats: Record<string, THREE.MeshStandardMaterial> = {}
    for (const id of RENDERABLE_IDS) {
      mats[id] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(BUILDING_COLORS[id].base),
        roughness: 0.6,
        metalness: 0.2,
      })
    }
    return mats
  }, [])

  // 建立 mesh 配置列表: 每种建筑 × 每个等级
  const meshConfigs = useMemo(() => {
    const configs: Array<{
      key: string
      id: BuildingId
      level: number
      geometry: THREE.BufferGeometry
      material: THREE.MeshStandardMaterial
      maxCount: number
    }> = []

    for (const id of RENDERABLE_IDS) {
      const def = getBuildingDef(id)
      if (!def) continue
      const maxLvl = def.maxLevel
      for (let lvl = 1; lvl <= maxLvl; lvl++) {
        configs.push({
          key: meshKey(id, lvl),
          id,
          level: lvl,
          geometry: getBuildingGeometry(id, lvl),
          material: materials[id],
          maxCount: MAX_INSTANCES[id] ?? 256,
        })
      }
    }
    return configs
  }, [materials])

  useFrame(() => {
    const state = useGameStore.getState().state
    if (!state) return

    const { map, economy, buildingEffects } = state
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

    if (!mapChanged && !effChanged) return
    prevMapRef.current = map
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
        const key = meshKey(entry.buildingId, entry.level)
        const mesh = meshRefs.current[key]
        if (!mesh) continue

        tmpColor.set(BUILDING_COLORS[entry.buildingId].base)
        if (!entry.connected) {
          tmpColor.multiplyScalar(0.4)
        } else {
          const eff = effByType[entry.category as keyof typeof effByType] ?? 1
          if (eff < 1) {
            const gray = (tmpColor.r + tmpColor.g + tmpColor.b) / 3
            const factor = (1 - eff) * 0.6
            tmpColor.r = tmpColor.r * (1 - factor) + gray * factor
            tmpColor.g = tmpColor.g * (1 - factor) + gray * factor
            tmpColor.b = tmpColor.b * (1 - factor) + gray * factor
          }
        }
        mesh.setColorAt(entry.idx, tmpColor)
        updatedMeshKeys.add(key)
      }
      for (const key of updatedMeshKeys) {
        const mesh = meshRefs.current[key]
        if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true
      }
      return
    }

    // 全量更新
    instanceIndexMap.current.clear()
    const indices: Record<string, number> = {}
    for (const cfg of meshConfigs) indices[cfg.key] = 0

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        const bid = getTileBuildingId(tile)
        if (bid === 'empty' || bid === 'road') continue

        // 多格建筑只在 origin 格渲染
        if (tile.structureRole === 'part') continue

        const def = getBuildingDef(bid)
        if (!def) continue

        const level = tile.level || 1
        const key = meshKey(bid, level)
        const mesh = meshRefs.current[key]
        if (!mesh) continue

        const idx = indices[key]++

        // 计算多格建筑的几何中心
        const footprint = def.footprint
        let cx = 0
        let cy = 0
        for (const f of footprint) {
          cx += f.dx
          cy += f.dy
        }
        cx /= footprint.length
        cy /= footprint.length

        const worldX = x + cx - MAP_WIDTH / 2 + 0.5
        const worldZ = y + cy - MAP_HEIGHT / 2 + 0.5
        const terrainY = TERRAIN_Y_MAP[tile.terrain] ?? 0
        const baseTerrainTop = terrainY + 0.05

        dummy.position.set(worldX, baseTerrainTop, worldZ)
        dummy.scale.set(1, 1, 1)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(idx, dummy.matrix)

        // 颜色
        tmpColor.set(BUILDING_COLORS[bid].base)
        if (!tile.connected) {
          tmpColor.multiplyScalar(0.4)
        } else if (EFFICIENCY_CATEGORIES.includes(def.category)) {
          const eff = effByType[def.category as keyof typeof effByType] ?? 1
          if (eff < 1) {
            const gray = (tmpColor.r + tmpColor.g + tmpColor.b) / 3
            const factor = (1 - eff) * 0.6
            tmpColor.r = tmpColor.r * (1 - factor) + gray * factor
            tmpColor.g = tmpColor.g * (1 - factor) + gray * factor
            tmpColor.b = tmpColor.b * (1 - factor) + gray * factor
          }
        }
        mesh.setColorAt(idx, tmpColor)

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

    // 设 count 并标记更新
    for (const cfg of meshConfigs) {
      const mesh = meshRefs.current[cfg.key]
      if (!mesh) continue
      const count = indices[cfg.key] ?? 0
      mesh.count = count
      if (count > 0) {
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
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
