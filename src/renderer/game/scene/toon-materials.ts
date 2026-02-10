import * as THREE from 'three'

/** 3 阶梯渐变贴图单例（所有 MeshToonMaterial 共享） */
let gradientMap3: THREE.DataTexture | null = null

export function getGradientMap3(): THREE.DataTexture {
  if (gradientMap3) return gradientMap3

  const data = new Uint8Array([80, 160, 255])
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RedFormat)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.needsUpdate = true

  gradientMap3 = tex
  return gradientMap3
}

/** 4 阶梯渐变贴图单例（accent 部件用，比 3-step 柔和但保持阴影深度） */
let gradientMap4: THREE.DataTexture | null = null

export function getGradientMap4(): THREE.DataTexture {
  if (gradientMap4) return gradientMap4

  const data = new Uint8Array([70, 140, 210, 255])
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RedFormat)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.needsUpdate = true

  gradientMap4 = tex
  return gradientMap4
}

/** 5 阶梯渐变贴图单例（Townscaper 平滑风，阶梯间距极小近似连续光照） */
let gradientMap5: THREE.DataTexture | null = null

export function getGradientMap5(): THREE.DataTexture {
  if (gradientMap5) return gradientMap5

  const data = new Uint8Array([100, 145, 190, 230, 255])
  const tex = new THREE.DataTexture(data, 5, 1, THREE.RedFormat)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.needsUpdate = true

  gradientMap5 = tex
  return gradientMap5
}
