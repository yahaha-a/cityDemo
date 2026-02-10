import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { BuildingId } from 'shared/types/building-defs'
import { getBuildingDef } from '../config/building-defs'

/** 几何体缓存: buildingId → level → geometry */
const cache = new Map<string, THREE.BufferGeometry>()

/** 几何体三元组缓存: buildingId → level → { base, accent, windows } */
const pairCache = new Map<
  string,
  {
    base: THREE.BufferGeometry
    accent: THREE.BufferGeometry
    windows: THREE.BufferGeometry
  }
>()

function getCacheKey(id: BuildingId, level: number): string {
  return `${id}:${level}`
}

/** 获取建筑几何体（带缓存，单色合并版，供 BuildingPreview 使用） */
export function getBuildingGeometry(
  id: BuildingId,
  level: number
): THREE.BufferGeometry {
  const key = getCacheKey(id, level)
  const cached = cache.get(key)
  if (cached) return cached

  const parts = createBuildingParts(id, level)
  const geo = merge([
    ...parts.baseParts,
    ...parts.accentParts,
    ...parts.windowParts,
  ])
  cache.set(key, geo)
  return geo
}

/** 获取建筑几何体三元组 (base + accent + windows)（带缓存） */
export function getBuildingGeometryPair(
  id: BuildingId,
  level: number
): {
  base: THREE.BufferGeometry
  accent: THREE.BufferGeometry
  windows: THREE.BufferGeometry
} {
  const key = getCacheKey(id, level)
  const cached = pairCache.get(key)
  if (cached) return cached

  const parts = createBuildingParts(id, level)
  const pair = {
    base: merge(parts.baseParts),
    accent: merge(parts.accentParts),
    windows:
      parts.windowParts.length > 0
        ? merge(parts.windowParts)
        : new THREE.BufferGeometry(),
  }
  pairCache.set(key, pair)
  return pair
}

/** 清理缓存（dispose 时调用） */
export function disposeBuildingGeometries(): void {
  for (const geo of cache.values()) geo.dispose()
  cache.clear()
  for (const pair of pairCache.values()) {
    pair.base.dispose()
    pair.accent.dispose()
    pair.windows.dispose()
  }
  pairCache.clear()
}

// 辅助：创建底部对齐的 Box
function box(
  w: number,
  h: number,
  d: number,
  ox = 0,
  oy = 0,
  oz = 0
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(w, h, d)
  geo.translate(ox, oy + h / 2, oz)
  return geo
}

// 辅助：创建底部对齐的圆柱
function cylinder(
  r: number,
  h: number,
  ox = 0,
  oy = 0,
  oz = 0,
  segs = 8
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(r, r, h, segs)
  geo.translate(ox, oy + h / 2, oz)
  return geo
}

// 辅助：创建底部对齐的半球（含底面封盖）
function hemisphere(
  r: number,
  ox = 0,
  oy = 0,
  oz = 0,
  segs = 8
): THREE.BufferGeometry {
  const dome = new THREE.SphereGeometry(
    r,
    segs,
    segs / 2,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  )
  // 底面封盖
  const cap = new THREE.CircleGeometry(r, segs)
  cap.rotateX(-Math.PI / 2)
  const geo = mergeGeometries([dome, cap])
  dome.dispose()
  cap.dispose()
  geo.translate(ox, oy, oz)
  return geo
}

// 辅助：创建底部对齐的锥体
function cone(
  r: number,
  h: number,
  ox = 0,
  oy = 0,
  oz = 0,
  segs = 8
): THREE.BufferGeometry {
  const geo = new THREE.ConeGeometry(r, h, segs)
  geo.translate(ox, oy + h / 2, oz)
  return geo
}

function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (parts.length === 0) return new THREE.BufferGeometry()
  const result = mergeGeometries(parts)
  for (const p of parts) p.dispose()
  return result
}

/** 升级高度和装饰缩放 */
function levelScale(level: number): { hMult: number; deco: number } {
  switch (level) {
    case 2:
      return { hMult: 1.5, deco: 1 }
    case 3:
      return { hMult: 2.2, deco: 2 }
    default:
      return { hMult: 1, deco: 0 }
  }
}

/**
 * 窗户面板辅助函数（薄 box 贴在墙面上）
 * face: 'front'(-Z), 'back'(+Z), 'left'(-X), 'right'(+X)
 */
function windowPane(
  w: number,
  h: number,
  ox: number,
  oy: number,
  oz: number,
  face: 'front' | 'back' | 'left' | 'right'
): THREE.BufferGeometry {
  const depth = 0.02
  switch (face) {
    case 'front':
      return box(w, h, depth, ox, oy, oz - depth / 2)
    case 'back':
      return box(w, h, depth, ox, oy, oz + depth / 2)
    case 'left':
      return box(depth, h, w, ox - depth / 2, oy, oz)
    case 'right':
      return box(depth, h, w, ox + depth / 2, oy, oz)
  }
}

/** 生成窗户网格：在墙面上均匀分布窗户 */
function windowGrid(
  cols: number,
  rows: number,
  winW: number,
  winH: number,
  wallW: number,
  wallH: number,
  face: 'front' | 'back' | 'left' | 'right',
  wallOx: number,
  wallOy: number,
  wallOz: number
): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = []
  const spacingX = wallW / (cols + 1)
  const spacingY = wallH / (rows + 1)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lx = -wallW / 2 + spacingX * (c + 1)
      const ly = spacingY * (r + 1)
      if (face === 'front' || face === 'back') {
        parts.push(
          windowPane(winW, winH, wallOx + lx, wallOy + ly, wallOz, face)
        )
      } else {
        parts.push(
          windowPane(winW, winH, wallOx, wallOy + ly, wallOz + lx, face)
        )
      }
    }
  }
  return parts
}

/** 创建 base/accent/windows 分离的几何体部件数组（未合并） */
function createBuildingParts(
  id: BuildingId,
  level: number
): {
  baseParts: THREE.BufferGeometry[]
  accentParts: THREE.BufferGeometry[]
  windowParts: THREE.BufferGeometry[]
} {
  const def = getBuildingDef(id)
  const { hMult, deco } = levelScale(level)

  switch (id) {
    case 'house': {
      const h = 0.5 * hMult
      const roofH = 0.2
      const baseParts = [
        box(0.84, 0.03, 0.84), // 底座台阶
        box(0.8, h, 0.8, 0, 0.03), // 主体
        box(0.2, 0.02, 0.08, 0, 0.03, -0.44), // 门廊
        box(0.15, 0.02, 0.05, -0.2, h * 0.5 + 0.03, -0.42), // 窗台
        box(0.15, 0.02, 0.05, 0.2, h * 0.5 + 0.03, -0.42),
      ]
      const accentParts = [
        // 人字形山墙屋顶
        cone(0.52, roofH, 0, h + 0.03, 0, 4),
        // 老虎窗
        box(0.12, 0.1, 0.12, 0.15, h + 0.03 + roofH * 0.35, -0.2),
        cone(0.09, 0.06, 0.15, h + 0.03 + roofH * 0.35 + 0.1, -0.2, 4),
        // 烟囱管
        cylinder(0.05, 0.18, 0.25, h + 0.03 + roofH * 0.3, 0.2),
        box(0.12, 0.02, 0.12, 0.25, h + 0.03 + roofH * 0.3 + 0.18, 0.2),
      ]
      if (deco >= 1) {
        // 窗台花箱
        accentParts.push(box(0.14, 0.04, 0.04, -0.2, h * 0.5 + 0.05, -0.44))
        accentParts.push(box(0.14, 0.04, 0.04, 0.2, h * 0.5 + 0.05, -0.44))
      }
      if (deco >= 2) {
        // 第二个老虎窗
        accentParts.push(
          box(0.12, 0.1, 0.12, -0.15, h + 0.03 + roofH * 0.35, -0.2)
        )
        accentParts.push(
          cone(0.09, 0.06, -0.15, h + 0.03 + roofH * 0.35 + 0.1, -0.2, 4)
        )
      }
      // 窗户：正面 2 个小窗 + 侧面各 1 个
      const winParts = [
        windowPane(0.12, 0.14, -0.2, h * 0.5 + 0.03, -0.41, 'front'),
        windowPane(0.12, 0.14, 0.2, h * 0.5 + 0.03, -0.41, 'front'),
        windowPane(0.12, 0.14, 0, h * 0.5 + 0.03, -0.41, 'left'),
        windowPane(0.12, 0.14, 0, h * 0.5 + 0.03, 0.41, 'right'),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'apartment': {
      const h = 0.8 * hMult
      const baseParts = [
        box(1.9, h, 0.9),
        box(1.94, 0.02, 0.94, 0, h * 0.33),
        box(1.94, 0.02, 0.94, 0, h * 0.66),
        // 底层入口门柱
        box(0.06, h * 0.4, 0.06, -0.15, 0, -0.48),
        box(0.06, h * 0.4, 0.06, 0.15, 0, -0.48),
        box(0.36, 0.04, 0.06, 0, h * 0.4, -0.48),
        // 每层阳台栏杆
        box(0.3, 0.03, 0.12, -0.5, h * 0.33, -0.5),
        box(0.3, 0.06, 0.02, -0.5, h * 0.33, -0.56),
        box(0.3, 0.03, 0.12, 0.5, h * 0.66, -0.5),
        box(0.3, 0.06, 0.02, 0.5, h * 0.66, -0.56),
      ]
      const accentParts = [
        box(1.94, 0.04, 0.04, 0, h, -0.47),
        box(1.94, 0.04, 0.04, 0, h, 0.47),
        box(0.3, 0.15, 0.3, 0.5, h, 0.2),
      ]
      if (deco >= 1) {
        // 侧面空调外机
        accentParts.push(box(0.12, 0.08, 0.1, -0.96, h * 0.5, -0.2))
        accentParts.push(box(0.12, 0.08, 0.1, -0.96, h * 0.8, 0.1))
        accentParts.push(box(0.2, 0.1, 0.2, -0.5, h, -0.2))
      }
      if (deco >= 2) {
        // 天线阵列
        accentParts.push(cylinder(0.02, 0.2, 0.3, h + 0.15, 0))
        accentParts.push(cylinder(0.02, 0.15, 0.5, h + 0.15, 0.2))
        accentParts.push(box(0.15, 0.02, 0.02, 0.4, h + 0.3, 0.1))
      }
      // 窗户：每层 4 个窗户，3 层，前后两面
      const winParts = [
        ...windowGrid(4, 3, 0.15, 0.1, 1.9, h, 'front', 0, 0, -0.46),
        ...windowGrid(4, 3, 0.15, 0.1, 1.9, h, 'back', 0, 0, 0.46),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'residential_complex': {
      const h = 0.7 * hMult
      const t = 0.35
      const baseParts = [
        box(1.9, h, t, 0, 0, -0.775),
        box(1.9, h, t, 0, 0, 0.775),
        box(t, h, 1.9 - 2 * t, -0.775, 0, 0),
        box(t, h, 1.9 - 2 * t, 0.775, 0, 0),
        box(0.06, h * 0.5, 0.06, -0.15, h * 0.5, -0.775),
        box(0.06, h * 0.5, 0.06, 0.15, h * 0.5, -0.775),
        box(0.36, 0.04, 0.06, 0, h, -0.775),
        // 内院角落阳台
        box(0.2, 0.03, 0.2, 0.6, h * 0.5, 0.6),
        box(0.2, 0.03, 0.2, -0.6, h * 0.5, -0.6),
        // 屋顶栏杆条
        box(1.94, 0.05, 0.02, 0, h, -0.6),
        box(1.94, 0.05, 0.02, 0, h, 0.6),
      ]
      const accentParts = [
        box(0.08, h * 1.1, 0.08, 0.775, 0, 0.775),
        box(0.08, h * 1.1, 0.08, -0.775, 0, -0.775),
        box(0.08, h * 1.1, 0.08, 0.775, 0, -0.775),
        box(0.08, h * 1.1, 0.08, -0.775, 0, 0.775),
        // 拱形顶部
        hemisphere(0.18, 0, h, -0.775, 6),
      ]
      if (deco >= 1) {
        // 角楼加锥形帽
        accentParts.push(box(0.2, 0.15, 0.2, 0.775, h * 1.1, 0.775))
        accentParts.push(cone(0.14, 0.1, 0.775, h * 1.1 + 0.15, 0.775, 4))
        accentParts.push(box(0.2, 0.15, 0.2, -0.775, h * 1.1, -0.775))
        accentParts.push(cone(0.14, 0.1, -0.775, h * 1.1 + 0.15, -0.775, 4))
      }
      // 窗户：四面都有窗户网格（外立面）
      const winParts = [
        ...windowGrid(5, 3, 0.12, 0.1, 1.9, h, 'front', 0, 0, -0.96),
        ...windowGrid(5, 3, 0.12, 0.1, 1.9, h, 'back', 0, 0, 0.96),
        ...windowGrid(3, 3, 0.12, 0.1, 1.2, h, 'left', -0.96, 0, 0),
        ...windowGrid(3, 3, 0.12, 0.1, 1.2, h, 'right', 0.96, 0, 0),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'shop': {
      const h = 0.4 * hMult
      const baseParts = [
        box(0.8, h, 0.8),
        box(0.3, h * 0.7, 0.06, 0, 0, -0.44),
        box(0.2, 0.03, 0.05, -0.25, h * 0.3, -0.42),
        box(0.2, 0.03, 0.05, 0.25, h * 0.3, -0.42),
      ]
      const accentParts = [
        // 倾斜楔形遮雨棚
        box(0.88, 0.02, 0.25, 0, h, -0.5),
        box(0.88, 0.04, 0.02, 0, h - 0.02, -0.62),
        // 招牌
        box(0.5, 0.1, 0.05, 0, h * 0.75, -0.42),
        // 招牌立柱
        cylinder(0.02, h * 0.3, 0.3, h, -0.42),
        box(0.15, 0.1, 0.02, 0.3, h + h * 0.3, -0.42),
      ]
      if (deco >= 1) {
        // 侧面展示柜
        accentParts.push(box(0.06, h * 0.4, 0.2, -0.43, 0, -0.2))
        accentParts.push(box(0.02, h * 0.35, 0.18, -0.45, 0, -0.2))
      }
      if (deco >= 2) {
        // 第二个招牌 + 盆栽
        accentParts.push(box(0.12, 0.08, 0.02, -0.25, h * 0.8, -0.42))
        accentParts.push(cylinder(0.04, 0.08, 0.3, 0, -0.5, 6))
        accentParts.push(hemisphere(0.05, 0.3, 0.08, -0.5))
      }
      // 窗户：底层大橱窗 + 上层小窗
      const winParts = [
        windowPane(0.28, 0.18, -0.25, h * 0.25, -0.41, 'front'),
        windowPane(0.28, 0.18, 0.25, h * 0.25, -0.41, 'front'),
        windowPane(0.12, 0.1, -0.2, h * 0.7, -0.41, 'front'),
        windowPane(0.12, 0.1, 0.2, h * 0.7, -0.41, 'front'),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'office': {
      const h = 1.2 * hMult
      const baseParts = [
        box(1.9, h * 0.67, 0.85),
        box(1.6, h * 0.33, 0.7, 0, h * 0.67),
        // 底层大厅凹入段
        box(1.6, h * 0.15, 0.75, 0, 0),
        box(0.06, h * 0.15, 0.06, -0.85, 0, -0.38),
        box(0.06, h * 0.15, 0.06, 0.85, 0, -0.38),
      ]
      const floors = 4
      for (let i = 1; i < floors; i++) {
        const fy = (h * 0.67 * i) / floors
        baseParts.push(box(1.94, 0.02, 0.88, 0, fy))
      }
      // 上段遮阳百叶条
      for (let i = 0; i < 3; i++) {
        const by = h * 0.67 + (h * 0.33 * (i + 1)) / 4
        baseParts.push(box(1.64, 0.01, 0.04, 0, by, -0.37))
        baseParts.push(box(1.64, 0.01, 0.04, 0, by, 0.37))
      }
      const accentParts = [
        box(1.94, 0.03, 0.03, 0, h * 0.67, -0.43),
        box(1.94, 0.03, 0.03, 0, h * 0.67, 0.43),
        // 顶部设备间
        box(0.4, 0.08, 0.3, 0.4, h, 0),
      ]
      if (deco >= 1) {
        accentParts.push(box(0.3, 0.06, 0.25, -0.4, h, 0))
        accentParts.push(cylinder(0.06, 0.04, -0.4, h + 0.06, 0, 6))
      }
      if (deco >= 2) {
        accentParts.push(cylinder(0.03, 0.3, 0, h + 0.08, 0))
        accentParts.push(box(0.15, 0.02, 0.02, 0, h + 0.25, 0))
      }
      // 窗户：密集玻璃幕墙式窗户网格（下段 + 上段）
      const winParts = [
        ...windowGrid(6, 4, 0.12, 0.08, 1.9, h * 0.67, 'front', 0, 0, -0.43),
        ...windowGrid(6, 4, 0.12, 0.08, 1.9, h * 0.67, 'back', 0, 0, 0.43),
        ...windowGrid(
          4,
          2,
          0.1,
          0.08,
          1.6,
          h * 0.33,
          'front',
          0,
          h * 0.67,
          -0.36
        ),
        ...windowGrid(
          4,
          2,
          0.1,
          0.08,
          1.6,
          h * 0.33,
          'back',
          0,
          h * 0.67,
          0.36
        ),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'mall': {
      const h = 0.6 * hMult
      const baseParts = [
        box(0.95, h, 0.95, -0.475, 0, -0.475),
        box(0.95, h, 0.95, 0.475, 0, -0.475),
        box(0.95, h, 0.95, -0.475, 0, 0.475),
      ]
      const accentParts = [
        // 转角高塔 + 半球顶
        box(0.3, h * 1.2, 0.3, -0.475, 0, -0.475),
        hemisphere(0.18, -0.475, h * 1.2, -0.475),
        // 大型入口雨棚（带柱子）
        box(0.7, 0.04, 0.35, 0, h * 0.55, -0.95 - 0.17),
        cylinder(0.03, h * 0.55, -0.25, 0, -1.12),
        cylinder(0.03, h * 0.55, 0.25, 0, -1.12),
        // 角楼装饰
        box(0.15, 0.08, 0.15, 0.475, h, -0.475),
        box(0.15, 0.08, 0.15, -0.475, h, 0.475),
        // 后方卸货台
        box(0.5, h * 0.3, 0.15, -0.475, 0, 0.95 + 0.07),
        box(0.55, 0.03, 0.2, -0.475, h * 0.3, 0.95 + 0.1),
      ]
      if (deco >= 1)
        accentParts.push(box(0.15, 0.1, 0.15, -0.475, h * 1.2 + 0.18, -0.475))
      // 窗户：大面积橱窗
      const winParts = [
        windowPane(0.5, h * 0.5, -0.475, h * 0.3, -0.96, 'front'),
        windowPane(0.5, h * 0.5, 0.475, h * 0.3, -0.96, 'front'),
        ...windowGrid(2, 2, 0.2, 0.15, 0.95, h, 'left', -0.96, 0, -0.475),
        ...windowGrid(2, 2, 0.2, 0.15, 0.95, h, 'left', -0.96, 0, 0.475),
        ...windowGrid(2, 2, 0.2, 0.15, 0.95, h, 'right', 0.96, 0, -0.475),
        windowPane(0.5, h * 0.4, -0.475, h * 0.35, 0.96, 'back'),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'factory': {
      const h = 0.45 * hMult
      const baseParts = [
        box(0.8, h, 0.8),
        box(0.3, h * 0.3, 0.15, 0, 0, -0.48),
        box(0.35, 0.02, 0.12, 0, h * 0.3, -0.54),
      ]
      // 锯齿形屋顶轮廓
      for (let i = 0; i < 3; i++) {
        const zOff = -0.25 + i * 0.25
        baseParts.push(box(0.84, 0.04, 0.08, 0, h, zOff))
        baseParts.push(box(0.84, 0.02, 0.06, 0, h + 0.04, zOff - 0.04))
      }
      const accentParts = [
        cylinder(0.08, 0.35, 0.25, h, 0.25),
        box(0.2, 0.02, 0.2, 0.25, h + 0.35, 0.25),
        // 管道连接
        cylinder(0.03, 0.5, -0.35, h * 0.6, 0, 6),
        box(0.04, 0.04, 0.6, -0.35, h * 0.6, 0.1),
      ]
      if (deco >= 1) {
        accentParts.push(cylinder(0.06, 0.3, -0.25, h, 0.25))
        accentParts.push(box(0.16, 0.02, 0.16, -0.25, h + 0.3, 0.25))
      }
      if (deco >= 2) accentParts.push(cylinder(0.05, 0.25, 0, h, -0.25))
      // 窗户：高处小窗
      const winParts = [
        windowPane(0.15, 0.08, -0.2, h * 0.75, -0.41, 'front'),
        windowPane(0.15, 0.08, 0.2, h * 0.75, -0.41, 'front'),
        windowPane(0.15, 0.08, 0, h * 0.75, 0.41, 'back'),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'heavy_industry': {
      const h = 0.55 * hMult
      const baseParts = [
        box(1.9, h, 1.9),
        box(0.06, h * 0.5, 0.06, -0.8, h, -0.8),
        box(0.06, h * 0.5, 0.06, 0.8, h, -0.8),
        box(1.66, 0.06, 0.06, 0, h * 1.5, -0.8),
        // 龙门吊小车
        box(0.15, 0.08, 0.1, 0.2, h * 1.5 - 0.06, -0.8),
      ]
      const accentParts = [
        // 传送带结构
        box(0.08, 0.06, 1.4, 0.5, h, 0),
        box(0.06, h * 0.3, 0.06, 0.5, h, -0.65),
        box(0.06, h * 0.3, 0.06, 0.5, h, 0.65),
        // 冷却风扇
        cylinder(0.15, 0.06, -0.5, h, 0.5, 8),
        cylinder(0.15, 0.06, 0.5, h, -0.5, 8),
        // 管道
        cylinder(0.04, 1.2, 0, h * 0.6, 0.7, 6),
        box(0.08, 0.08, 1.4, 0, h * 0.8, 0),
        // 烟囱
        cylinder(0.12, 0.5, 0.6, h, 0.6),
        cylinder(0.1, 0.45, -0.6, h, 0.6),
      ]
      if (deco >= 1) {
        accentParts.push(cylinder(0.08, 0.4, 0.6, h, -0.6))
        accentParts.push(cylinder(0.08, 0.35, -0.6, h, -0.6))
      }
      // 窗户：少量工业窗
      const winParts = [
        windowPane(0.2, 0.1, -0.5, h * 0.8, -0.96, 'front'),
        windowPane(0.2, 0.1, 0.5, h * 0.8, -0.96, 'front'),
        windowPane(0.2, 0.1, 0, h * 0.8, 0.96, 'back'),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'warehouse': {
      const h = 0.4 * hMult
      const baseParts = [
        box(1.9, h, 0.9),
        box(0.5, h * 0.8, 0.04, -0.45, 0, -0.47),
        box(0.5, h * 0.8, 0.04, 0.45, 0, -0.47),
        box(0.04, h * 0.85, 0.04, -0.21, 0, -0.47),
        box(0.04, h * 0.85, 0.04, 0.21, 0, -0.47),
        // 叉车装卸平台
        box(0.6, 0.06, 0.3, 0, 0, -0.6),
        box(0.04, 0.06, 0.3, -0.3, 0, -0.6),
        box(0.04, 0.06, 0.3, 0.3, 0, -0.6),
      ]
      // 侧面通风百叶
      for (let i = 0; i < 4; i++) {
        const ly = h * 0.3 + (h * 0.5 * i) / 4
        baseParts.push(box(0.02, 0.02, 0.2, 0.96, ly, 0.2))
        baseParts.push(box(0.02, 0.02, 0.2, -0.96, ly, 0.2))
      }
      const roofGeo = new THREE.CylinderGeometry(
        0.45,
        0.45,
        1.9,
        12,
        1,
        false,
        0,
        Math.PI
      )
      roofGeo.rotateZ(Math.PI / 2)
      roofGeo.translate(0, h, 0)
      const accentParts = [roofGeo]
      // 窗户：顶部天窗条
      const winParts = [
        windowPane(0.6, 0.06, -0.4, h * 0.85, -0.46, 'front'),
        windowPane(0.6, 0.06, 0.4, h * 0.85, -0.46, 'front'),
        windowPane(0.6, 0.06, 0, h * 0.85, 0.46, 'back'),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'park': {
      const baseParts = [
        box(0.9, 0.02, 0.9),
        // 花坛
        cylinder(0.1, 0.04, -0.3, 0.02, 0.3, 8),
        cylinder(0.08, 0.03, 0.3, 0.02, -0.3, 8),
        // 树干（高瘦树 + 矮胖树）
        cylinder(0.03, 0.2, 0.15, 0.02, 0.15),
        cylinder(0.03, 0.1, -0.2, 0.02, -0.1),
        // 路灯
        cylinder(0.015, 0.3, 0.35, 0.02, 0),
        hemisphere(0.03, 0.35, 0.32, 0),
        // 长椅
        box(0.2, 0.06, 0.08, 0.25, 0.02, -0.25),
        box(0.03, 0.1, 0.08, 0.15, 0.02, -0.25),
        box(0.03, 0.1, 0.08, 0.35, 0.02, -0.25),
        box(0.08, 0.005, 0.6, 0, 0.02, -0.05),
      ]
      const accentParts: THREE.BufferGeometry[] = [
        // 高瘦树冠
        hemisphere(0.13, 0.15, 0.22, 0.15),
        // 矮胖树冠
        hemisphere(0.16, -0.2, 0.12, -0.1),
      ]
      if (deco >= 1) {
        // 第三棵树
        accentParts.push(hemisphere(0.1, -0.1, 0.17, 0.25))
        baseParts.push(cylinder(0.025, 0.15, -0.1, 0.02, 0.25))
        // 第二盏路灯
        baseParts.push(cylinder(0.015, 0.28, -0.35, 0.02, 0.15))
        baseParts.push(hemisphere(0.03, -0.35, 0.3, 0.15))
      }
      return { baseParts, accentParts, windowParts: [] }
    }

    case 'plaza': {
      const baseParts = [
        box(1.9, 0.05, 1.9),
        box(1.94, 0.03, 0.06, 0, 0.05, -0.95),
        box(1.94, 0.03, 0.06, 0, 0.05, 0.95),
        box(0.06, 0.03, 1.94, -0.95, 0.05),
        box(0.06, 0.03, 1.94, 0.95, 0.05),
        // 十字步道线
        box(1.9, 0.01, 0.08, 0, 0.05),
        box(0.08, 0.01, 1.9, 0, 0.05),
        // 4 个长椅
        box(0.25, 0.06, 0.08, 0.55, 0.05, 0),
        box(0.25, 0.06, 0.08, -0.55, 0.05, 0),
        box(0.08, 0.06, 0.25, 0, 0.05, 0.55),
        box(0.08, 0.06, 0.25, 0, 0.05, -0.55),
        // 护柱
        cylinder(0.04, 0.15, 0.7, 0.05, 0.7),
        cylinder(0.04, 0.15, -0.7, 0.05, -0.7),
        cylinder(0.04, 0.15, 0.7, 0.05, -0.7),
        cylinder(0.04, 0.15, -0.7, 0.05, 0.7),
      ]
      const accentParts = [
        // 喷泉池
        cylinder(0.3, 0.08, 0, 0.05, 0, 12),
        // 喷泉第一层
        cylinder(0.15, 0.3, 0, 0.13, 0),
        cylinder(0.22, 0.04, 0, 0.43, 0),
        // 喷泉第二层
        cylinder(0.08, 0.15, 0, 0.47, 0),
        cylinder(0.12, 0.03, 0, 0.62, 0),
      ]
      if (deco >= 1) {
        accentParts.push(cylinder(0.08, 0.3, 0.5, 0.05, 0.5))
        accentParts.push(cylinder(0.08, 0.3, -0.5, 0.05, -0.5))
      }
      return { baseParts, accentParts, windowParts: [] }
    }

    case 'school': {
      const h = 0.55 * hMult
      const baseParts = [
        box(0.95, h, 0.95, -1, 0, -0.475),
        box(0.95, h, 0.95, 0, 0, -0.475),
        box(0.95, h, 0.95, 1, 0, -0.475),
        box(0.95, h * 0.9, 0.95, 0, 0, 0.475),
        box(0.15, h * 0.6, 0.06, -0.5, 0, 0),
        box(0.15, h * 0.6, 0.06, 0.5, 0, 0),
        // 操场器材轮廓（单杠）
        cylinder(0.015, 0.2, -0.7, 0, 0.6),
        cylinder(0.015, 0.2, -0.4, 0, 0.6),
        box(0.3, 0.015, 0.015, -0.55, 0.2, 0.6),
      ]
      const accentParts = [
        box(0.25, h * 0.5, 0.25, 0, h, -0.475),
        hemisphere(0.14, 0, h * 1.5, -0.475),
        // 钟楼时钟盘面
        box(0.12, 0.12, 0.02, 0, h * 1.3, -0.475 - 0.14),
        // 旗杆
        cylinder(0.015, h * 1.8, 1, 0, -0.95),
        box(0.08, 0.05, 0.01, 1, h * 1.8, -0.95),
      ]
      if (deco >= 1)
        accentParts.push(cylinder(0.04, 0.15, 0, h * 1.5 + 0.14, -0.475))
      // 窗户：每个教室段正面规则窗户
      const winParts = [
        ...windowGrid(3, 2, 0.12, 0.12, 0.95, h, 'front', -1, 0, -0.96),
        ...windowGrid(3, 2, 0.12, 0.12, 0.95, h, 'front', 0, 0, -0.96),
        ...windowGrid(3, 2, 0.12, 0.12, 0.95, h, 'front', 1, 0, -0.96),
        ...windowGrid(3, 2, 0.12, 0.1, 0.95, h * 0.9, 'back', 0, 0, 0.96),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'hospital': {
      const h = 0.6 * hMult
      const baseParts = [
        box(0.95, h, 0.95, 0, 0, -1),
        box(0.95, h, 0.95, -1, 0, 0),
        box(0.95, h * 1.2, 0.95, 0, 0, 0),
        box(0.95, h, 0.95, 1, 0, 0),
        box(0.95, h, 0.95, 0, 0, 1),
        // 入口柱
        box(0.06, h * 0.5, 0.06, -0.3, 0, -1.48),
        box(0.06, h * 0.5, 0.06, 0.3, 0, -1.48),
        // 救护车停靠区
        box(0.5, 0.02, 0.3, 0, 0, -1.7),
        box(0.04, 0.08, 0.04, -0.25, 0, -1.85),
        box(0.04, 0.08, 0.04, 0.25, 0, -1.85),
      ]
      // 停机坪圆圈
      const helipad = new THREE.TorusGeometry(0.25, 0.015, 6, 16)
      helipad.rotateX(Math.PI / 2)
      helipad.translate(0, h * 1.2 + 0.01, 0)
      const accentParts: THREE.BufferGeometry[] = [
        box(0.6, 0.01, 0.08, 0, h * 1.2, 0),
        box(0.08, 0.01, 0.6, 0, h * 1.2, 0),
        helipad,
        // 入口雨棚（加宽）
        box(0.7, 0.03, 0.35, 0, h * 0.5, -1.48),
      ]
      if (deco >= 1) accentParts.push(box(0.2, 0.2, 0.2, 0, h * 1.2, 0))
      // 窗户：密集窗户网格（十字体各臂）
      const winParts = [
        ...windowGrid(3, 3, 0.1, 0.1, 0.95, h, 'front', 0, 0, -1.48),
        ...windowGrid(3, 3, 0.1, 0.1, 0.95, h * 1.2, 'left', -0.48, 0, 0),
        ...windowGrid(3, 3, 0.1, 0.1, 0.95, h * 1.2, 'right', 0.48, 0, 0),
        ...windowGrid(3, 3, 0.1, 0.1, 0.95, h, 'back', 0, 0, 1.48),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'fire_station': {
      const h = 0.5 * hMult
      const baseParts = [
        box(0.8, h, 0.8),
        box(0.4, h * 0.75, 0.04, -0.1, 0, -0.42),
        box(0.04, h * 0.8, 0.04, -0.31, 0, -0.42),
        box(0.04, h * 0.8, 0.04, 0.11, 0, -0.42),
      ]
      // 卷帘横条
      for (let i = 0; i < 4; i++) {
        const ly = h * 0.15 * (i + 1)
        baseParts.push(box(0.38, 0.01, 0.02, -0.1, ly, -0.43))
      }
      const accentParts = [
        box(0.2, h * 0.8, 0.2, 0.25, h, 0.25),
        box(0.35, 0.03, 0.35, 0.25, h * 1.8, 0.25),
        box(0.35, 0.06, 0.03, 0.25, h * 1.83, 0.08),
        box(0.35, 0.06, 0.03, 0.25, h * 1.83, 0.42),
        box(0.03, 0.06, 0.35, 0.08, h * 1.83, 0.25),
        box(0.03, 0.06, 0.35, 0.42, h * 1.83, 0.25),
        // 塔顶警笛灯
        cylinder(0.03, 0.06, 0.25, h * 1.89, 0.25),
        hemisphere(0.04, 0.25, h * 1.95, 0.25),
        // 晾晒水带架
        box(0.04, h * 0.6, 0.04, -0.35, 0, 0.35),
        box(0.04, h * 0.6, 0.04, -0.35, 0, 0.15),
        box(0.04, 0.02, 0.24, -0.35, h * 0.6, 0.25),
      ]
      if (deco >= 1)
        accentParts.push(cylinder(0.04, 0.15, 0.25, h * 1.95 + 0.04, 0.25))
      // 窗户：车库门上方 + 塔楼窗
      const winParts = [
        windowPane(0.3, 0.1, -0.1, h * 0.8, -0.41, 'front'),
        windowPane(0.1, 0.12, 0.25, h * 1.3, 0.07, 'front'),
        windowPane(0.1, 0.12, 0.25, h * 1.3, 0.43, 'back'),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'police_station': {
      const h = 0.5 * hMult
      const baseParts = [
        // 三层台阶
        box(0.88, 0.015, 0.94, 0, 0, -0.03),
        box(0.86, 0.015, 0.92, 0, 0.015, -0.03),
        box(0.84, 0.015, 0.9, 0, 0.03, -0.03),
        box(0.8, h, 0.8, 0, 0.045),
        box(0.06, h, 0.06, -0.3, 0.045, -0.43),
        box(0.06, h, 0.06, 0.3, 0.045, -0.43),
        // 徽章浮雕
        cylinder(0.06, 0.03, 0, h * 0.75 + 0.045, -0.42, 8),
      ]
      const dome = new THREE.SphereGeometry(
        0.25,
        8,
        6,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      )
      dome.translate(0, h + 0.045, 0)
      const accentParts: THREE.BufferGeometry[] = [
        dome,
        // 穹顶通讯天线 + 横臂
        cylinder(0.02, 0.2, 0, h + 0.295, 0),
        box(0.15, 0.02, 0.02, 0, h + 0.4, 0),
        box(0.02, 0.02, 0.1, 0, h + 0.35, 0),
      ]
      if (deco >= 1) accentParts.push(cylinder(0.04, 0.1, 0, h + 0.495, 0))
      // 窗户：正面规则窗户
      const winParts = [
        ...windowGrid(3, 2, 0.12, 0.12, 0.8, h, 'front', 0, 0.045, -0.41),
        windowPane(0.12, 0.12, 0, h * 0.5 + 0.045, 0.41, 'back'),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    case 'power_plant': {
      const h = 0.55 * hMult
      const baseParts = [
        // (0,0) 主厂房
        box(0.9, h * 1.1, 0.9, -0.475, 0, -0.475),
        box(0.94, 0.04, 0.1, -0.475, h * 1.1, -0.475),
        // (1,0) 变电站
        box(0.9, h * 0.5, 0.9, 0.475, 0, -0.475),
        // (0,1) 冷却塔底座
        box(0.9, 0.04, 0.9, -0.475, 0, 0.475),
        // 围栏柱
        cylinder(0.02, h * 0.3, 0.0, 0, 0.0),
        cylinder(0.02, h * 0.3, -0.95, 0, 0.0),
      ]

      // 冷却塔下段
      baseParts.push(cylinder(0.28, h * 0.5, -0.475, 0.04, 0.475, 12))
      // 冷却塔上段
      const towerGeo = new THREE.CylinderGeometry(
        0.22,
        0.2,
        h * 0.7,
        12,
        1,
        false
      )
      towerGeo.translate(-0.475, h * 0.5 + h * 0.35 + 0.04, 0.475)
      baseParts.push(towerGeo)
      // 冷却塔顶圈
      const ringGeo = new THREE.TorusGeometry(0.22, 0.02, 6, 12)
      ringGeo.rotateX(Math.PI / 2)
      ringGeo.translate(-0.475, h * 0.5 + h * 0.7 + 0.04, 0.475)
      baseParts.push(ringGeo)
      // 冷却塔底部围栏
      baseParts.push(cylinder(0.02, h * 0.25, -0.25, 0.04, 0.475))
      baseParts.push(cylinder(0.02, h * 0.25, -0.7, 0.04, 0.475))
      baseParts.push(cylinder(0.02, h * 0.25, -0.475, 0.04, 0.25))
      baseParts.push(cylinder(0.02, h * 0.25, -0.475, 0.04, 0.7))

      const accentParts: THREE.BufferGeometry[] = [
        // 烟囱
        cylinder(0.1, h * 1.6, -0.7, 0, -0.7),
        cylinder(0.12, 0.04, -0.7, h * 1.6, -0.7),
        // 变压器设备
        box(0.25, h * 0.35, 0.2, 0.3, h * 0.5, -0.6),
        box(0.2, h * 0.3, 0.2, 0.6, h * 0.5, -0.35),
        // 高压电塔
        cylinder(0.02, h * 1.3, 0.35, h * 0.5, -0.35),
        cylinder(0.02, h * 1.3, 0.6, h * 0.5, -0.35),
        box(0.35, 0.03, 0.03, 0.475, h * 1.8, -0.35),
        box(0.25, 0.03, 0.03, 0.475, h * 1.6, -0.35),
        // 绝缘子
        cylinder(0.015, 0.06, 0.35, h * 1.74, -0.35),
        cylinder(0.015, 0.06, 0.6, h * 1.74, -0.35),
        // 高压线缆
        box(0.25, 0.01, 0.01, 0.475, h * 1.82, -0.35),
        // 塔顶蒸汽排气管
        cylinder(0.04, 0.06, -0.475, h * 0.5 + h * 0.7 + 0.06, 0.475),
      ]
      if (deco >= 1) {
        accentParts.push(cylinder(0.07, h * 1.2, -0.25, 0, -0.7))
        accentParts.push(cylinder(0.09, 0.03, -0.25, h * 1.2, -0.7))
        accentParts.push(box(0.04, 0.04, 0.8, -0.475, h * 0.4, 0))
      }
      if (deco >= 2) {
        accentParts.push(box(0.2, h * 0.25, 0.15, 0.5, h * 0.5, -0.7))
      }
      // 窗户：厂房高窗
      const winParts = [
        windowPane(0.2, 0.12, -0.475, h * 0.8, -0.93, 'front'),
        windowPane(0.15, 0.1, -0.475, h * 0.5, -0.93, 'front'),
        windowPane(0.15, 0.08, 0.475, h * 0.35, -0.93, 'front'),
      ]
      return { baseParts, accentParts, windowParts: winParts }
    }

    default: {
      const footprint = def?.footprint ?? [{ dx: 0, dy: 0 }]
      const w = Math.max(...footprint.map(f => f.dx)) + 1
      const d = Math.max(...footprint.map(f => f.dy)) + 1
      const h = 0.5 * hMult
      return {
        baseParts: [box(w * 0.9, h, d * 0.9)],
        accentParts: [box(w * 0.9, 0.03, d * 0.9, 0, h)],
        windowParts: [],
      }
    }
  }
}
