import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TileType, TerrainType, RoadType } from 'shared/types'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'

const dummy = new THREE.Object3D()
const ROAD_HEIGHT = 0.02

// 地形高度偏移（与 TerrainGrid / Buildings 保持一致）
const TERRAIN_Y_MAP: Record<TerrainType, number> = {
  [TerrainType.Plain]: 0,
  [TerrainType.Hill]: 0.15,
  [TerrainType.Water]: -0.08,
  [TerrainType.Fertile]: 0,
  [TerrainType.Rocky]: 0.05,
}

// 各道路类型颜色
const ROAD_TYPE_COLORS: Record<RoadType, string> = {
  [RoadType.Normal]: '#9ca3af',
  [RoadType.Highway]: '#fbbf24',
  [RoadType.Bridge]: '#60a5fa',
  [RoadType.Tunnel]: '#a78bfa',
}

// 各道路类型的 Y 偏移调整
const ROAD_TYPE_Y_OFFSET: Record<RoadType, number> = {
  [RoadType.Normal]: 0.06,
  [RoadType.Highway]: 0.08,
  [RoadType.Bridge]: 0.15, // 高于水面
  [RoadType.Tunnel]: -0.05, // 低于地面
}

const ROAD_TYPES = [
  RoadType.Normal,
  RoadType.Highway,
  RoadType.Bridge,
  RoadType.Tunnel,
] as const

export function RoadNetwork() {
  const meshRefs = useRef<Record<string, THREE.InstancedMesh | null>>({})
  // 脏标记：道路只在建造/拆除时变化
  const prevMapRef = useRef<unknown>(null)

  const materials = useMemo(() => {
    const mats: Record<string, THREE.MeshStandardMaterial> = {}
    for (const rt of ROAD_TYPES) {
      mats[rt] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(ROAD_TYPE_COLORS[rt]),
        roughness: 0.9,
        metalness: 0.05,
      })
    }
    return mats
  }, [])

  const geometries = useMemo(() => {
    const geos: Record<string, THREE.BoxGeometry> = {}
    // 普通和桥梁使用标准宽度
    geos[RoadType.Normal] = new THREE.BoxGeometry(0.98, ROAD_HEIGHT, 0.98)
    // 高速公路稍宽
    geos[RoadType.Highway] = new THREE.BoxGeometry(
      0.98,
      ROAD_HEIGHT * 1.5,
      0.98
    )
    geos[RoadType.Bridge] = new THREE.BoxGeometry(0.98, ROAD_HEIGHT, 0.98)
    geos[RoadType.Tunnel] = new THREE.BoxGeometry(0.98, ROAD_HEIGHT * 2, 0.98)
    return geos
  }, [])

  useFrame(() => {
    const state = useGameStore.getState().state
    if (!state) return

    const { map } = state

    // 引用比较：map 未变则跳过
    if (map === prevMapRef.current) return
    prevMapRef.current = map

    // 初始化计数
    const counts: Record<string, number> = {}
    for (const rt of ROAD_TYPES) counts[rt] = 0

    // 遍历地图，按道路类型分组
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        if (tile.type !== TileType.Road) continue

        const roadType = tile.roadType ?? RoadType.Normal
        const mesh = meshRefs.current[roadType]
        if (!mesh) continue

        const idx = counts[roadType]++
        const worldX = x - MAP_WIDTH / 2 + 0.5
        const worldZ = y - MAP_HEIGHT / 2 + 0.5
        const terrainY = TERRAIN_Y_MAP[tile.terrain] ?? 0
        const yOffset = ROAD_TYPE_Y_OFFSET[roadType]

        dummy.position.set(worldX, terrainY + yOffset, worldZ)
        dummy.updateMatrix()
        mesh.setMatrixAt(idx, dummy.matrix)
      }
    }

    // 更新各 mesh
    for (const rt of ROAD_TYPES) {
      const mesh = meshRefs.current[rt]
      if (!mesh) continue
      mesh.count = counts[rt]
      mesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {ROAD_TYPES.map(rt => (
        <instancedMesh
          args={[geometries[rt], materials[rt], 1024]}
          frustumCulled={false}
          key={rt}
          receiveShadow
          ref={el => {
            meshRefs.current[rt] = el
          }}
        />
      ))}
    </group>
  )
}
