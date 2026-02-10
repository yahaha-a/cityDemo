import type * as THREE from 'three'
import type { BuildingId } from 'shared/types/building-defs'

/** 动画定义 */
interface AnimationDef {
  uniform: string
  defaultValue: number
  vertexPrefix: string
  vertexInject: string
  update: (t: number) => number
}

/** 各建筑动画定义表 */
export const BUILDING_ANIMATIONS: Partial<Record<BuildingId, AnimationDef>> = {
  park: {
    uniform: 'uBreathScale',
    defaultValue: 1.0,
    vertexPrefix: 'uniform float uBreathScale;',
    vertexInject: 'transformed *= uBreathScale;',
    update: (t) => 1.0 + Math.sin(t * 0.8) * 0.06,
  },
  shop: {
    uniform: 'uAwningSway',
    defaultValue: 0.0,
    vertexPrefix: 'uniform float uAwningSway;',
    vertexInject: 'transformed.x += uAwningSway;',
    update: (t) => Math.sin(t * 1.2) * 0.015,
  },
  factory: {
    uniform: 'uChimneyPulse',
    defaultValue: 1.0,
    vertexPrefix: 'uniform float uChimneyPulse;',
    vertexInject: 'transformed.y *= uChimneyPulse;',
    update: (t) => 1 + Math.sin(t * 2.5) * 0.02,
  },
  power_plant: {
    uniform: 'uTowerHaze',
    defaultValue: 1.0,
    vertexPrefix: 'uniform float uTowerHaze;',
    vertexInject: 'transformed.y *= uTowerHaze;',
    update: (t) => 1 + Math.sin(t * 0.5) * 0.015,
  },
  plaza: {
    uniform: 'uFountainBob',
    defaultValue: 0.0,
    vertexPrefix: 'uniform float uFountainBob;',
    vertexInject: 'transformed.y += uFountainBob;',
    update: (t) => Math.sin(t * 1.5) * 0.01,
  },
  hospital: {
    uniform: 'uBeaconPulse',
    defaultValue: 1.0,
    vertexPrefix: 'uniform float uBeaconPulse;',
    vertexInject:
      'transformed.x *= uBeaconPulse;\ntransformed.z *= uBeaconPulse;',
    update: (t) => 1 + Math.sin(t * 3.0) * 0.03,
  },
  fire_station: {
    uniform: 'uSirenFlash',
    defaultValue: 1.0,
    vertexPrefix: 'uniform float uSirenFlash;',
    vertexInject: 'transformed *= uSirenFlash;',
    update: (t) => 1 + Math.sin(t * 4.0) * 0.025,
  },
}

export type ShaderRefMap = Map<
  BuildingId,
  THREE.WebGLProgramParametersWithUniforms
>

/** 为材质注入动画 shader（在 useMemo 创建材质时调用） */
export function injectBuildingAnimation(
  id: BuildingId,
  material: THREE.MeshToonMaterial,
  shaderRefs: ShaderRefMap
): void {
  const animDef = BUILDING_ANIMATIONS[id]
  if (!animDef) return

  material.onBeforeCompile = (shader) => {
    shader.uniforms[animDef.uniform] = { value: animDef.defaultValue }
    shader.vertexShader = `${animDef.vertexPrefix}\n${shader.vertexShader}`
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n${animDef.vertexInject}`
    )
    shaderRefs.set(id, shader)
  }
}

/** 每帧更新所有动画 uniform */
export function updateBuildingAnimations(
  elapsedTime: number,
  shaderRefs: ShaderRefMap
): void {
  for (const [id, shader] of shaderRefs) {
    const animDef = BUILDING_ANIMATIONS[id]
    if (!animDef) continue
    shader.uniforms[animDef.uniform].value = animDef.update(elapsedTime)
  }
}
