import { useMemo } from 'react'
import * as THREE from 'three'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform float gridSize;
uniform float lineWidth;
uniform float opacity;

void main() {
  vec2 coord = vUv * gridSize;
  vec2 grid = abs(fract(coord - 0.5) - 0.5);
  vec2 dGrid = fwidth(coord);
  vec2 lines = smoothstep(dGrid * lineWidth, vec2(0.0), grid);
  float line = max(lines.x, lines.y);
  gl_FragColor = vec4(0.9, 0.85, 0.75, line * opacity);
}
`

export function GridLines() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          gridSize: { value: Math.max(MAP_WIDTH, MAP_HEIGHT) },
          lineWidth: { value: 1.0 },
          opacity: { value: 0.04 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  )

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT),
    []
  )

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, 0.06, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  )
}
