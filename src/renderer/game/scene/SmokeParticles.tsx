import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TerrainType } from 'shared/types'
import type { BuildingId } from 'shared/types/building-defs'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'

const MAX_SMOKE_PARTICLES = 1024
const SMOKE_BUILDINGS: BuildingId[] = [
  'factory',
  'heavy_industry',
  'power_plant',
]

// 地形高度偏移（与 TerrainGrid / Buildings 保持一致）
const TERRAIN_Y: Record<TerrainType, number> = {
  [TerrainType.Plain]: 0,
  [TerrainType.Hill]: 0.15,
  [TerrainType.Water]: -0.08,
  [TerrainType.Fertile]: 0,
  [TerrainType.Rocky]: 0.05,
}

// 烟囱偏移（相对 origin tile 世界坐标）
// off.x/z = 几何体内烟囱 xz + 包围盒中心偏移(cx, cy)
// off.yScaled = 建筑体高度基数（随等级缩放：× hMult）
// off.yFixed = 烟囱自身高度（固定不随等级变）
// 最终 y = yScaled * hMult + yFixed
interface ChimneyOffset {
  x: number
  z: number
  yScaled: number
  yFixed: number
}

// hMult: Lv1=1.0, Lv2=1.5, Lv3=2.2
function getHMult(level: number): number {
  if (level === 2) return 1.5
  if (level >= 3) return 2.2
  return 1
}

const CHIMNEY_OFFSETS: Partial<
  Record<BuildingId, ChimneyOffset[]>
> = {
  // factory (1x1): cx=0, cy=0
  // chimney: cylinder(0.08, 0.35, 0.25, h, 0.25) → top = h + 0.35
  factory: [{ x: 0.25, z: 0.25, yScaled: 0.45, yFixed: 0.35 }],
  // heavy_industry (2x2): cx=0.5, cy=0.5
  // chimney1: cylinder(0.12, 0.5, 0.6, h, 0.6) → top = h + 0.5
  // chimney2: cylinder(0.1, 0.45, -0.6, h, 0.6) → top = h + 0.45
  heavy_industry: [
    { x: 1.1, z: 1.1, yScaled: 0.55, yFixed: 0.5 },
    { x: -0.1, z: 1.1, yScaled: 0.55, yFixed: 0.45 },
  ],
  // power_plant (L形): cx=0.5, cy=0.5
  // chimney: cylinder(0.1, h*1.6, -0.7, 0, -0.7) → top = h * 1.6
  // h*1.6 全部是 scaled 部分，无 fixed
  power_plant: [
    { x: -0.2, z: -0.2, yScaled: 0.55 * 1.6, yFixed: 0 },
  ],
}

const vertexShader = /* glsl */ `
attribute float aAge;
attribute float aLifetime;
attribute float aSize;

varying float vAlpha;

void main() {
  float progress = aAge / aLifetime;
  // 刚出生时 alpha 最高，逐渐消散
  vAlpha = (1.0 - progress) * 0.5;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  // 初始就足够大，随时间膨胀
  float scale = aSize * (1.0 + progress * 3.0);
  gl_PointSize = scale * (600.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = /* glsl */ `
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float alpha = vAlpha * smoothstep(0.5, 0.15, d);
  gl_FragColor = vec4(0.85, 0.82, 0.78, alpha);
}
`

interface Emitter {
  wx: number
  wy: number
  wz: number
}

export function SmokeParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const prevMapRef = useRef<unknown>(null)
  const emittersRef = useRef<Emitter[]>([])
  const emitTimerRef = useRef(0)

  // 粒子数据
  const data = useMemo(() => {
    const positions = new Float32Array(MAX_SMOKE_PARTICLES * 3)
    const ages = new Float32Array(MAX_SMOKE_PARTICLES)
    const lifetimes = new Float32Array(MAX_SMOKE_PARTICLES)
    const sizes = new Float32Array(MAX_SMOKE_PARTICLES)
    const velocities = new Float32Array(MAX_SMOKE_PARTICLES * 3)
    const alive = new Uint8Array(MAX_SMOKE_PARTICLES)

    // 初始化所有粒子为死亡状态
    for (let i = 0; i < MAX_SMOKE_PARTICLES; i++) {
      ages[i] = 999
      lifetimes[i] = 1
    }

    return { positions, ages, lifetimes, sizes, velocities, alive }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(data.positions, 3)
    )
    geo.setAttribute('aAge', new THREE.BufferAttribute(data.ages, 1))
    geo.setAttribute(
      'aLifetime',
      new THREE.BufferAttribute(data.lifetimes, 1)
    )
    geo.setAttribute('aSize', new THREE.BufferAttribute(data.sizes, 1))
    return geo
  }, [data])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    []
  )

  useFrame((_, delta) => {
    const state = useGameStore.getState().state
    if (!state) return

    const { map } = state

    // 地图变化时重新扫描发射器
    if (map !== prevMapRef.current) {
      prevMapRef.current = map
      const emitters: Emitter[] = []

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tile = map.tiles[y][x]
          if (
            !SMOKE_BUILDINGS.includes(tile.buildingId as BuildingId) ||
            tile.structureRole === 'part'
          )
            continue

          const bid = tile.buildingId as BuildingId
          const offsets = CHIMNEY_OFFSETS[bid]
          if (!offsets) continue
          const wx = x - MAP_WIDTH / 2 + 0.5
          const wz = y - MAP_HEIGHT / 2 + 0.5
          // 读取实际地形高度
          const terrainY = TERRAIN_Y[tile.terrain] ?? 0
          const baseTerrainTop = terrainY + 0.05
          const hMult = getHMult(tile.level || 1)

          for (const off of offsets) {
            emitters.push({
              wx: wx + off.x,
              wy: baseTerrainTop + off.yScaled * hMult + off.yFixed,
              wz: wz + off.z,
            })
          }
        }
      }

      emittersRef.current = emitters
    }

    const emitters = emittersRef.current
    if (emitters.length === 0) return

    const { positions, ages, lifetimes, sizes, velocities, alive } = data

    // 更新已有粒子
    for (let i = 0; i < MAX_SMOKE_PARTICLES; i++) {
      if (!alive[i]) continue
      ages[i] += delta
      if (ages[i] >= lifetimes[i]) {
        alive[i] = 0
        positions[i * 3 + 1] = -999 // 隐藏
        continue
      }

      positions[i * 3] += velocities[i * 3] * delta
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta
    }

    // 发射新粒子
    emitTimerRef.current += delta
    if (emitTimerRef.current >= 0.06) {
      emitTimerRef.current = 0

      for (const em of emitters) {
        // 每个发射器每次发射 2-3 个粒子
        const count = 2 + (Math.random() > 0.5 ? 1 : 0)
        for (let p = 0; p < count; p++) {
          // 找一个死亡粒子
          let slot = -1
          for (let i = 0; i < MAX_SMOKE_PARTICLES; i++) {
            if (!alive[i]) {
              slot = i
              break
            }
          }
          if (slot === -1) break

          positions[slot * 3] =
            em.wx + (Math.random() - 0.5) * 0.08
          positions[slot * 3 + 1] = em.wy
          positions[slot * 3 + 2] =
            em.wz + (Math.random() - 0.5) * 0.08

          velocities[slot * 3] = (Math.random() - 0.5) * 0.1
          velocities[slot * 3 + 1] = 0.15 + Math.random() * 0.1
          velocities[slot * 3 + 2] = (Math.random() - 0.5) * 0.1

          ages[slot] = 0
          lifetimes[slot] = 2.0 + Math.random() * 2.0
          sizes[slot] = 0.15 + Math.random() * 0.1
          alive[slot] = 1
        }
      }
    }

    // 更新 GPU buffers
    const posAttr = geometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute
    posAttr.needsUpdate = true
    const ageAttr = geometry.getAttribute(
      'aAge'
    ) as THREE.BufferAttribute
    ageAttr.needsUpdate = true
    const ltAttr = geometry.getAttribute(
      'aLifetime'
    ) as THREE.BufferAttribute
    ltAttr.needsUpdate = true
    const sizeAttr = geometry.getAttribute(
      'aSize'
    ) as THREE.BufferAttribute
    sizeAttr.needsUpdate = true
  })

  return (
    <points
      frustumCulled={false}
      geometry={geometry}
      material={material}
      ref={pointsRef}
    />
  )
}
