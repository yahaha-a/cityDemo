import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { getTimeOfDay, getDayNightParams } from './day-night-cycle'
import type { DayNightParams } from './day-night-cycle'
import { useGameStore } from '../stores/game-store'

const params: DayNightParams = {
  ambientIntensity: 0.6,
  dirIntensity: 0.9,
  skyTopColor: new THREE.Color('#80b8d8'),
  skyBottomColor: new THREE.Color('#f0e0c8'),
  fogColor: new THREE.Color('#e8dcd0'),
  sunPosition: new THREE.Vector3(25, 45, 30),
}

export function Lighting() {
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const hemiRef = useRef<THREE.HemisphereLight>(null)
  const dirRef = useRef<THREE.DirectionalLight>(null)
  const prevDayRef = useRef<number>(-1)
  const scene = useThree(s => s.scene)

  useFrame(() => {
    const state = useGameStore.getState().state
    if (!state) return

    const day = state.time.day
    if (day === prevDayRef.current) return
    prevDayRef.current = day

    const t = getTimeOfDay(day)
    getDayNightParams(t, params)

    if (ambientRef.current) {
      ambientRef.current.intensity = params.ambientIntensity
    }

    if (hemiRef.current) {
      hemiRef.current.intensity = params.ambientIntensity * 0.9
    }

    if (dirRef.current) {
      dirRef.current.intensity = params.dirIntensity
      dirRef.current.position.copy(params.sunPosition)
    }

    // 更新 fog
    const fog = scene.fog as THREE.Fog | null
    if (fog) {
      fog.color.copy(params.fogColor)
      // 夜晚缩短雾距
      const nightFactor = 1.0 - params.ambientIntensity / 0.6
      fog.near = 50 - nightFactor * 20
      fog.far = 140 - nightFactor * 40
    }
  })

  return (
    <>
      <ambientLight intensity={0.6} ref={ambientRef} />
      <hemisphereLight
        color="#ffe8c8"
        groundColor="#a0d098"
        intensity={0.55}
        ref={hemiRef}
      />
      <directionalLight
        castShadow
        color="#fff0d8"
        intensity={0.9}
        position={[25, 45, 30]}
        ref={dirRef}
        shadow-camera-bottom={-40}
        shadow-camera-far={150}
        shadow-camera-left={-40}
        shadow-camera-near={1}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
    </>
  )
}
