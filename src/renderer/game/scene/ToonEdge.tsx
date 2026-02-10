import { forwardRef, useContext, useMemo } from 'react'
import type { Uniform } from 'three'
import { EffectComposerContext } from '@react-three/postprocessing'
import { ToonEdgeEffect } from './ToonEdgeEffect'

interface ToonEdgeProps {
  edgeStrength?: number
  depthThreshold?: number
  edgeColor?: [number, number, number]
  normalThreshold?: number
  normalEdgeStrength?: number
  lineThickness?: number
}

export const ToonEdge = forwardRef<ToonEdgeEffect, ToonEdgeProps>(
  function ToonEdge(
    {
      edgeStrength,
      depthThreshold,
      edgeColor,
      normalThreshold,
      normalEdgeStrength,
      lineThickness,
    },
    ref
  ) {
    const { normalPass } = useContext(EffectComposerContext)
    const normalTexture = normalPass?.texture ?? null

    const effect = useMemo(
      () =>
        new ToonEdgeEffect({
          edgeStrength,
          depthThreshold,
          edgeColor,
          normalBuffer: normalTexture,
          normalThreshold,
          normalEdgeStrength,
          lineThickness,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [normalTexture]
    )

    // 同步 uniform 值
    const uniforms = effect.uniforms
    if (edgeStrength !== undefined)
      (uniforms.get('edgeStrength') as Uniform).value = edgeStrength
    if (depthThreshold !== undefined)
      (uniforms.get('depthThreshold') as Uniform).value = depthThreshold
    if (edgeColor !== undefined)
      (uniforms.get('edgeColor') as Uniform).value = edgeColor
    if (normalThreshold !== undefined)
      (uniforms.get('normalThreshold') as Uniform).value = normalThreshold
    if (normalEdgeStrength !== undefined)
      (uniforms.get('normalEdgeStrength') as Uniform).value = normalEdgeStrength
    if (lineThickness !== undefined)
      (uniforms.get('lineThickness') as Uniform).value = lineThickness

      // 确保 normalBuffer 始终是最新的
    ;(uniforms.get('normalBuffer') as Uniform).value = normalTexture

    if (typeof ref === 'function') ref(effect)
    else if (ref) ref.current = effect

    return <primitive object={effect} />
  }
)
