import { useEffect, useRef } from 'react'
import { MapControls } from '@react-three/drei'
import { MOUSE } from 'three'

export function CameraRig() {
  const controlsRef = useRef<React.ComponentRef<typeof MapControls>>(null)

  useEffect(() => {
    const controls = controlsRef.current
    if (controls) {
      controls.mouseButtons = {
        LEFT: -1 as unknown as MOUSE, // 禁用左键相机操作（留给 InputPlane 处理建造）
        MIDDLE: MOUSE.PAN,
        RIGHT: MOUSE.ROTATE,
      }
    }
  }, [])

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
      ref={controlsRef}
      screenSpacePanning={false}
      target={[0, 0, 0]}
      zoomSpeed={1.2}
    />
  )
}
