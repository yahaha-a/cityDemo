import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getTimeOfDay, getDayNightParams } from './day-night-cycle'
import type { DayNightParams } from './day-night-cycle'
import { useGameStore } from '../stores/game-store'

const vertexShader = /* glsl */ `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float uTime;
uniform float uCloudDensity;
uniform float uCloudSpeed;
varying vec3 vWorldPosition;

// 2D gradient noise
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}

float gradientNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 4; i++) {
    v += a * gradientNoise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  float h = normalize(vWorldPosition).y;
  float t = h * 0.5 + 0.5;
  vec3 skyColor = mix(bottomColor, topColor, t);

  // 云层: 仅在上半球 h > 0.05
  if (h > 0.05) {
    vec2 uv = vWorldPosition.xz / 80.0;
    float drift = uTime * uCloudSpeed;
    float n = fbm(uv + vec2(drift, drift * 0.7));
    float cloud = smoothstep(0.0, uCloudDensity, n);

    // 地平线 fade out
    float horizonFade = smoothstep(0.05, 0.25, h);
    cloud *= horizonFade;

    // 云层颜色: 暖白混合少量 skyTop
    vec3 cloudColor = mix(vec3(1.0, 0.98, 0.95), topColor, 0.15);
    skyColor = mix(skyColor, cloudColor, cloud * 0.6);
  }

  gl_FragColor = vec4(skyColor, 1.0);
}
`

const skyParams: DayNightParams = {
  ambientIntensity: 0.6,
  dirIntensity: 0.9,
  skyTopColor: new THREE.Color('#80b8d8'),
  skyBottomColor: new THREE.Color('#f0e0c8'),
  fogColor: new THREE.Color('#e8dcd0'),
  sunPosition: new THREE.Vector3(),
}

export function Sky() {
  const prevDayRef = useRef<number>(-1)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          topColor: { value: new THREE.Color('#80b8d8') },
          bottomColor: { value: new THREE.Color('#f0e0c8') },
          uTime: { value: 0 },
          uCloudDensity: { value: 0.35 },
          uCloudSpeed: { value: 0.02 },
        },
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  )

  const geometry = useMemo(() => new THREE.SphereGeometry(200, 16, 12), [])

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime

    const state = useGameStore.getState().state
    if (!state) return

    const day = state.time.day
    if (day === prevDayRef.current) return
    prevDayRef.current = day

    const t = getTimeOfDay(day)
    getDayNightParams(t, skyParams)

    material.uniforms.topColor.value.copy(skyParams.skyTopColor)
    material.uniforms.bottomColor.value.copy(skyParams.skyBottomColor)
  })

  return <mesh geometry={geometry} material={material} />
}
