/**
 * 种子化随机数生成器和地形噪声
 */

/** mulberry32 PRNG — 返回 [0,1) 的随机数生成函数 */
export function createSeededRandom(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 生成 2D 值噪声（粗网格 + 双线性插值）
 * @returns width×height 的二维数组，值在 [0,1)
 */
export function generateTerrainNoise(
  width: number,
  height: number,
  seed: number,
  scale = 8
): number[][] {
  const rng = createSeededRandom(seed)

  // 粗网格
  const gridW = Math.ceil(width / scale) + 2
  const gridH = Math.ceil(height / scale) + 2
  const grid: number[][] = []
  for (let gy = 0; gy < gridH; gy++) {
    grid[gy] = []
    for (let gx = 0; gx < gridW; gx++) {
      grid[gy][gx] = rng()
    }
  }

  // 双线性插值到完整尺寸
  const result: number[][] = []
  for (let y = 0; y < height; y++) {
    result[y] = []
    const fy = y / scale
    const gy0 = Math.floor(fy)
    const gy1 = gy0 + 1
    const ty = fy - gy0

    for (let x = 0; x < width; x++) {
      const fx = x / scale
      const gx0 = Math.floor(fx)
      const gx1 = gx0 + 1
      const tx = fx - gx0

      const v00 = grid[gy0][gx0]
      const v10 = grid[gy0][gx1]
      const v01 = grid[gy1][gx0]
      const v11 = grid[gy1][gx1]

      const top = v00 * (1 - tx) + v10 * tx
      const bottom = v01 * (1 - tx) + v11 * tx
      result[y][x] = top * (1 - ty) + bottom * ty
    }
  }

  return result
}
