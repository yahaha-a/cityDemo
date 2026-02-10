import { useRef, useMemo, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TerrainType } from 'shared/types'
import { TERRAIN_COLORS, MAP_WIDTH, MAP_HEIGHT } from '../config'
import { getGradientMap3 } from './toon-materials'
import { useGameStore } from '../stores/game-store'
import { TERRAIN_Y_MAP, TERRAIN_THICKNESS } from './scene-constants'

const TILE_UNIT = 1

// 所有地形类型
const TERRAIN_TYPES = [
  TerrainType.Plain,
  TerrainType.Hill,
  TerrainType.Water,
  TerrainType.Fertile,
  TerrainType.Rocky,
] as const

// 模块级复用 Object3D，避免每帧分配
const dummy = new THREE.Object3D()

// 水面 shader
const waterVertexShader = /* glsl */ `
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vec4 worldPos = instanceMatrix * vec4(position, 1.0);

  // 3 层叠加 sin 波
  float wx = worldPos.x;
  float wz = worldPos.z;
  float wave1 = sin(wx * 3.0 + uTime * 1.2) * 0.015;
  float wave2 = sin(wz * 2.5 + uTime * 0.9) * 0.012;
  float wave3 = sin((wx + wz) * 4.0 + uTime * 1.5) * 0.008;
  worldPos.y += wave1 + wave2 + wave3;

  vWorldPos = worldPos.xyz;

  // 偏导数近似法线
  float eps = 0.05;
  float hx1 = sin((wx + eps) * 3.0 + uTime * 1.2) * 0.015
            + sin(wz * 2.5 + uTime * 0.9) * 0.012
            + sin((wx + eps + wz) * 4.0 + uTime * 1.5) * 0.008;
  float hx0 = sin((wx - eps) * 3.0 + uTime * 1.2) * 0.015
            + sin(wz * 2.5 + uTime * 0.9) * 0.012
            + sin((wx - eps + wz) * 4.0 + uTime * 1.5) * 0.008;
  float hz1 = sin(wx * 3.0 + uTime * 1.2) * 0.015
            + sin((wz + eps) * 2.5 + uTime * 0.9) * 0.012
            + sin((wx + wz + eps) * 4.0 + uTime * 1.5) * 0.008;
  float hz0 = sin(wx * 3.0 + uTime * 1.2) * 0.015
            + sin((wz - eps) * 2.5 + uTime * 0.9) * 0.012
            + sin((wx + wz - eps) * 4.0 + uTime * 1.5) * 0.008;

  float dhdx = (hx1 - hx0) / (2.0 * eps);
  float dhdz = (hz1 - hz0) / (2.0 * eps);
  vNormal = normalize(vec3(-dhdx, 1.0, -dhdz));

  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;
}
`

const waterFragmentShader = /* glsl */ `
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  // 浅色/深色根据法线 y 分量混合
  vec3 shallowColor = vec3(0.44, 0.78, 0.88);
  vec3 deepColor = vec3(0.22, 0.55, 0.72);
  float blend = clamp(vNormal.y, 0.0, 1.0);
  vec3 baseColor = mix(deepColor, shallowColor, blend);

  // Blinn-Phong 高光
  vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(vNormal, halfDir), 0.0), 64.0);

  // sparkle 闪烁
  float sparkle = sin(vWorldPos.x * 15.0 + uTime * 3.0)
                * sin(vWorldPos.z * 12.0 + uTime * 2.5);
  sparkle = max(0.0, sparkle);
  sparkle = pow(sparkle, 8.0) * 0.5;

  vec3 finalColor = baseColor + vec3(1.0, 0.98, 0.9) * (spec * 0.6 + sparkle);

  gl_FragColor = vec4(finalColor, 0.75);
}
`

export function TerrainGrid() {
  const meshRefs = useRef<Record<string, THREE.InstancedMesh | null>>({})
  // 脏标记：地形在地形改造时也会变化，通过 map 引用比较检测
  const prevMapRef = useRef<unknown>(null)

  // 水面 ShaderMaterial
  const waterMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: waterVertexShader,
        fragmentShader: waterFragmentShader,
        uniforms: {
          uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      }),
    []
  )

  // 为每种地形创建材质
  const materials = useMemo(() => {
    const gradientMap = getGradientMap3()
    const mats: Record<string, THREE.Material> = {}
    for (const t of TERRAIN_TYPES) {
      if (t === TerrainType.Water) {
        mats[t] = waterMaterial
      } else {
        mats[t] = new THREE.MeshToonMaterial({
          color: new THREE.Color(TERRAIN_COLORS[t].top),
          gradientMap,
        })
      }
    }
    return mats
  }, [waterMaterial])

  // 共享几何
  const geometry = useMemo(
    () => new THREE.BoxGeometry(TILE_UNIT, TERRAIN_THICKNESS, TILE_UNIT),
    []
  )

  // 地形更新逻辑：事件驱动，仅在 mount 和存档加载时执行
  const updateTerrain = useCallback(() => {
    const state = useGameStore.getState().state
    if (!state) return

    const { map } = state

    // 引用比较：map 未变则跳过
    if (map === prevMapRef.current) return
    prevMapRef.current = map

    // 单次遍历：统计 + 设置矩阵
    const counts: Record<string, number> = {}
    const indices: Record<string, number> = {}
    for (const t of TERRAIN_TYPES) {
      counts[t] = 0
      indices[t] = 0
    }

    // 先统计
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        counts[tile.terrain]++
      }
    }

    // 设置 count
    for (const t of TERRAIN_TYPES) {
      const mesh = meshRefs.current[t]
      if (mesh && mesh.count !== counts[t]) {
        mesh.count = counts[t]
      }
    }

    // 设置矩阵
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        const t = tile.terrain
        const mesh = meshRefs.current[t]
        if (!mesh) continue

        const idx = indices[t]++
        const worldX = x - MAP_WIDTH / 2 + 0.5
        const worldZ = y - MAP_HEIGHT / 2 + 0.5
        const terrainY = TERRAIN_Y_MAP[t]

        dummy.position.set(worldX, terrainY, worldZ)
        dummy.updateMatrix()
        mesh.setMatrixAt(idx, dummy.matrix)
      }
    }

    // 标记更新
    for (const t of TERRAIN_TYPES) {
      const mesh = meshRefs.current[t]
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true
      }
    }
  }, [])

  useEffect(() => {
    // 延迟一帧确保 mesh ref 已挂载
    const raf = requestAnimationFrame(() => updateTerrain())
    const unsub = useGameStore.subscribe(() => updateTerrain())
    return () => {
      cancelAnimationFrame(raf)
      unsub()
    }
  }, [updateTerrain])

  // 每帧更新水面 uTime
  useFrame(({ clock }) => {
    waterMaterial.uniforms.uTime.value = clock.elapsedTime
  })

  const maxCount = MAP_WIDTH * MAP_HEIGHT

  return (
    <group>
      {TERRAIN_TYPES.map(t => (
        <instancedMesh
          args={[geometry, materials[t], maxCount]}
          frustumCulled={false}
          key={t}
          receiveShadow
          ref={el => {
            meshRefs.current[t] = el
          }}
        />
      ))}
    </group>
  )
}
