import { MapControls } from '@react-three/drei'

export function CameraRig() {
  return (
    <MapControls
      dampingFactor={0.15}
      enableDamping
      makeDefault
      maxDistance={80}
      maxPolarAngle={Math.PI / 2.5}
      minDistance={10}
      minPolarAngle={Math.PI / 6}
      panSpeed={1.5}
      screenSpacePanning={false}
      target={[0, 0, 0]}
      zoomSpeed={1.2}
    />
  )
}
