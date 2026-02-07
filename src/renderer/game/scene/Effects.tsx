import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

export function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.15}
        luminanceSmoothing={0.9}
        luminanceThreshold={0.8}
        mipmapBlur
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
