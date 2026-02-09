import { useCallback, memo } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { Sky } from './Sky'
import { TerrainGrid } from './TerrainGrid'
import { GridLines } from './GridLines'
import { Buildings } from './Buildings'
import { RoadNetwork } from './RoadNetwork'
import { HoverIndicator } from './HoverIndicator'
import { BuildingPreview } from './BuildingPreview'
import { InputPlane } from './InputPlane'
import { Effects } from './Effects'
import { SmokeParticles } from './SmokeParticles'
import { FountainSparkles } from './FountainSparkles'
import { useGameStore } from '../stores/game-store'
import type { GameEngine } from '../engine/game-engine'

const MemoTerrainGrid = memo(TerrainGrid)
const MemoRoadNetwork = memo(RoadNetwork)
const MemoBuildings = memo(Buildings)
const MemoBuildingPreview = memo(BuildingPreview)
const MemoHoverIndicator = memo(HoverIndicator)

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
        fov: 36,
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
      <fog args={['#e8dcd0', 50, 140]} attach="fog" />

      <CameraRig />
      <Lighting />
      <Sky />

      <MemoTerrainGrid />
      <GridLines />
      <MemoRoadNetwork />
      <MemoBuildings />
      <SmokeParticles />
      <FountainSparkles />
      <MemoBuildingPreview />
      <MemoHoverIndicator />
      <InputPlane />

      <Effects />
    </Canvas>
  )
}
