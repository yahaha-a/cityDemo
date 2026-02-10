import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import type { BuildingId } from 'shared/types/building-defs'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { useGameStore } from '../stores/game-store'

interface PlazaPos {
  x: number
  z: number
}

export function FountainSparkles() {
  const [plazas, setPlazas] = useState<PlazaPos[]>([])
  const prevMapRef = useRef<unknown>(null)

  useFrame(() => {
    const state = useGameStore.getState().state
    if (!state) return

    const { map } = state
    if (map === prevMapRef.current) return
    prevMapRef.current = map

    const found: PlazaPos[] = []
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        if (
          (tile.buildingId as BuildingId) !== 'plaza' ||
          tile.structureRole === 'part'
        )
          continue
        found.push({
          x: x - MAP_WIDTH / 2 + 0.5,
          z: y - MAP_HEIGHT / 2 + 0.5,
        })
      }
    }

    // 仅在数量变化时更新 React 状态
    if (found.length !== plazas.length) {
      setPlazas(found)
    } else {
      for (let i = 0; i < found.length; i++) {
        if (found[i].x !== plazas[i].x || found[i].z !== plazas[i].z) {
          setPlazas(found)
          break
        }
      }
    }
  })

  return (
    <>
      {plazas.map((p, i) => (
        <Sparkles
          color="#a0e0f0"
          count={12}
          key={`fountain_${i}_${p.x}_${p.z}`}
          opacity={0.7}
          position={[p.x, 0.6, p.z]}
          scale={[0.8, 0.6, 0.8]}
          size={3}
          speed={0.4}
        />
      ))}
    </>
  )
}
