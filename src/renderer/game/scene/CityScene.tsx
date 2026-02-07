import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { TerrainGrid } from './TerrainGrid'
import { Buildings } from './Buildings'
import { RoadNetwork } from './RoadNetwork'
import { HoverIndicator } from './HoverIndicator'
import { InputPlane } from './InputPlane'
import { Effects } from './Effects'

export function CityScene() {
  return (
    <Canvas
      camera={{
        position: [30, 40, 30],
        fov: 45,
        near: 0.1,
        far: 500,
      }}
      gl={{
        antialias: true,
        toneMapping: 0, // 由 postprocessing 处理
        powerPreference: 'high-performance',
      }}
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
      <HoverIndicator />
      <InputPlane />

      <Effects />
    </Canvas>
  )
}
