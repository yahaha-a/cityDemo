export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight color="#87CEEB" groundColor="#4a7c59" intensity={0.3} />
      <directionalLight
        castShadow
        intensity={1.2}
        position={[30, 50, 20]}
        shadow-bias={-0.001}
        shadow-camera-bottom={-50}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-near={1}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
    </>
  )
}
