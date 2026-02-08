import { useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { TerrainGrid } from './TerrainGrid'
import { Buildings } from './Buildings'
import { RoadNetwork } from './RoadNetwork'
import { HoverIndicator } from './HoverIndicator'
import { BuildingPreview } from './BuildingPreview'
import { InputPlane } from './InputPlane'
import { Effects } from './Effects'
import { useGameStore } from '../stores/game-store'
import type { GameEngine } from '../engine/game-engine'

export function CityScene() {
  const handlePointerLeave = useCallback(() => {
    const { engine } = useGameStore.getState()
    if (!engine) return
    ;(engine as GameEngine).stateManager.setHoveredTile(null)
  }, [])

  return (
    <Canvas
      camera={{
        position: [30, 40, 30],
        fov: 45,
        near: 0.1,
        far: 500,
      }}
      gl={{
        antialias: false,
        toneMapping: 0, // 由 postprocessing 处理
        powerPreference: 'high-performance',
      }}
      onPointerLeave={handlePointerLeave}
      onPointerMissed={() => {
        // 点击空白区域不做额外处理
      }}
      shadows
      style={{ width: '100%', height: '100%' }}
    >
      <color args={['#1a1a2e']} attach="background" />
      <fog args={['#1a1a2e', 60, 120]} attach="fog" />

      <CameraRig />
      <Lighting />

      <TerrainGrid />
      <RoadNetwork />
      <Buildings />
      <BuildingPreview />
      <HoverIndicator />
      <InputPlane />

      <Effects />
    </Canvas>
  )
}
