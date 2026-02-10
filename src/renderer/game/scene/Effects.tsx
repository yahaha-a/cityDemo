import {
  EffectComposer,
  Bloom,
  BrightnessContrast,
  HueSaturation,
  Vignette,
  ToneMapping,
  SSAO,
} from '@react-three/postprocessing'
import { ToneMappingMode, BlendFunction } from 'postprocessing'
import { ToonEdge } from './ToonEdge'

export function Effects() {
  return (
    <EffectComposer enableNormalPass>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        intensity={1.5}
        luminanceInfluence={0.7}
        radius={0.08}
        resolutionScale={0.5}
        rings={3}
        samples={9}
      />
      <ToonEdge
        depthThreshold={0.001}
        edgeColor={[0.22, 0.16, 0.12]}
        edgeStrength={0.8}
        lineThickness={1.2}
        normalEdgeStrength={0.5}
        normalThreshold={0.4}
      />
      <Bloom
        intensity={0.15}
        luminanceSmoothing={0.3}
        luminanceThreshold={0.65}
      />
      <BrightnessContrast brightness={0.03} contrast={0.06} />
      <HueSaturation hue={0.02} saturation={0.12} />
      <Vignette darkness={0.15} offset={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
