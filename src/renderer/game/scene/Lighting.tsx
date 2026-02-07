export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight color="#87CEEB" groundColor="#4a7c59" intensity={0.3} />
      <directionalLight
        castShadow
        intensity={1.2}
        position={[30, 50, 20]}
        shadow-camera-bottom={-34}
        shadow-camera-far={150}
        shadow-camera-left={-34}
        shadow-camera-near={1}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
        shadow-normalBias={0.02}
      />
    </>
  )
}
