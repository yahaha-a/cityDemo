export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight color="#87CEEB" groundColor="#4a7c59" intensity={0.3} />
      <directionalLight
        castShadow
        intensity={1.2}
        position={[30, 50, 20]}
        shadow-normalBias={0.02}
        shadow-camera-bottom={-40}
        shadow-camera-far={150}
        shadow-camera-left={-40}
        shadow-camera-near={1}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
    </>
  )
}
