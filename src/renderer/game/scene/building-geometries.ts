import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { BuildingId } from 'shared/types/building-defs'
import { getBuildingDef } from '../config/building-defs'

/** 几何体缓存: buildingId → level → geometry */
const cache = new Map<string, THREE.BufferGeometry>()

/** 几何体对缓存: buildingId → level → { base, accent } */
const pairCache = new Map<
  string,
  { base: THREE.BufferGeometry; accent: THREE.BufferGeometry }
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

  const geo = createBuildingGeometry(id, level)
  cache.set(key, geo)
  return geo
}

/** 获取建筑几何体对 (base + accent)（带缓存） */
export function getBuildingGeometryPair(
  id: BuildingId,
  level: number
): { base: THREE.BufferGeometry; accent: THREE.BufferGeometry } {
  const key = getCacheKey(id, level)
  const cached = pairCache.get(key)
  if (cached) return cached

  const pair = createBuildingGeometryPair(id, level)
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

// 辅助：创建底部对齐的半球
function hemisphere(
  r: number,
  ox = 0,
  oy = 0,
  oz = 0,
  segs = 8
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(
    r,
    segs,
    segs / 2,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  )
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

function createBuildingGeometry(
  id: BuildingId,
  level: number
): THREE.BufferGeometry {
  const def = getBuildingDef(id)
  const { hMult, deco } = levelScale(level)

  switch (id) {
    case 'house': {
      // 方体 + 三角尖顶
      const h = 0.5 * hMult
      const parts = [
        box(0.84, 0.03, 0.84), // 底座台阶
        box(0.8, h, 0.8, 0, 0.03), // 主体
      ]
      // 屋顶棱锥
      parts.push(cone(0.5, 0.25, 0, h + 0.03, 0, 4))
      // 门廊
      parts.push(box(0.2, 0.02, 0.08, 0, 0.03, -0.44))
      // 窗台
      parts.push(box(0.15, 0.02, 0.05, -0.2, h * 0.5 + 0.03, -0.42))
      parts.push(box(0.15, 0.02, 0.05, 0.2, h * 0.5 + 0.03, -0.42))
      if (deco >= 1) parts.push(box(0.15, 0.15, 0.15, 0.3, h + 0.03, 0.3)) // 烟囱
      if (deco >= 2) parts.push(box(0.1, 0.2, 0.1, -0.3, h + 0.03, -0.3))
      return merge(parts)
    }

    case 'apartment': {
      // 两段式方体 (1x2: 沿 X 轴扩展)
      const h = 0.8 * hMult
      const parts = [box(1.9, h, 0.9)]
      // 楼层分割线
      parts.push(box(1.94, 0.02, 0.94, 0, h * 0.33))
      parts.push(box(1.94, 0.02, 0.94, 0, h * 0.66))
      // 女儿墙
      parts.push(box(1.94, 0.04, 0.04, 0, h, -0.47))
      parts.push(box(1.94, 0.04, 0.04, 0, h, 0.47))
      // 阳台
      parts.push(box(0.3, 0.02, 0.1, -0.5, h * 0.33, -0.5))
      parts.push(box(0.3, 0.02, 0.1, 0.5, h * 0.66, -0.5))
      // 顶部水箱
      parts.push(box(0.3, 0.15, 0.3, 0.5, h, 0.2))
      if (deco >= 1) parts.push(box(0.2, 0.1, 0.2, -0.5, h, -0.2))
      if (deco >= 2) parts.push(box(0.15, 0.2, 0.15, 0, h + 0.15, 0))
      return merge(parts)
    }

    case 'residential_complex': {
      // 围合式 (2x2) 中央庭院
      const h = 0.7 * hMult
      const t = 0.35
      const parts = [
        box(1.9, h, t, 0, 0, -0.775), // 前
        box(1.9, h, t, 0, 0, 0.775), // 后
        box(t, h, 1.9 - 2 * t, -0.775, 0, 0), // 左
        box(t, h, 1.9 - 2 * t, 0.775, 0, 0), // 右
      ]
      // 庭院角柱
      parts.push(box(0.08, h * 1.1, 0.08, 0.775, 0, 0.775))
      parts.push(box(0.08, h * 1.1, 0.08, -0.775, 0, -0.775))
      parts.push(box(0.08, h * 1.1, 0.08, 0.775, 0, -0.775))
      parts.push(box(0.08, h * 1.1, 0.08, -0.775, 0, 0.775))
      // 入口拱门框
      parts.push(box(0.06, h * 0.5, 0.06, -0.15, h * 0.5, -0.775))
      parts.push(box(0.06, h * 0.5, 0.06, 0.15, h * 0.5, -0.775))
      parts.push(box(0.36, 0.04, 0.06, 0, h, -0.775))
      if (deco >= 1) {
        parts.push(box(0.2, 0.15, 0.2, 0.775, h * 1.1, 0.775)) // 角楼
        parts.push(box(0.2, 0.15, 0.2, -0.775, h * 1.1, -0.775))
      }
      return merge(parts)
    }

    case 'shop': {
      // 平顶方体 + 前方遮雨棚
      const h = 0.4 * hMult
      const parts = [box(0.8, h, 0.8)]
      // 凹入门廊
      parts.push(box(0.3, h * 0.7, 0.06, 0, 0, -0.44))
      // 展示窗台
      parts.push(box(0.2, 0.03, 0.05, -0.25, h * 0.3, -0.42))
      parts.push(box(0.2, 0.03, 0.05, 0.25, h * 0.3, -0.42))
      // 遮雨棚（更宽）
      parts.push(box(0.88, 0.03, 0.3, 0, h, -0.45))
      // 招牌
      parts.push(box(0.5, 0.1, 0.05, 0, h * 0.75, -0.42))
      if (deco >= 1) parts.push(box(0.15, 0.12, 0.05, 0.3, h, -0.42))
      return merge(parts)
    }

    case 'office': {
      // 窄高塔 (1x2: 沿 X 轴扩展) + 退台
      const h = 1.2 * hMult
      const parts = [
        box(1.9, h * 0.67, 0.85), // 下段
        box(1.6, h * 0.33, 0.7, 0, h * 0.67), // 上段退台
      ]
      // 每层水平带状线
      const floors = 4
      for (let i = 1; i < floors; i++) {
        const fy = (h * 0.67 * i) / floors
        parts.push(box(1.94, 0.02, 0.88, 0, fy))
      }
      // 退台露台边缘
      parts.push(box(1.94, 0.03, 0.03, 0, h * 0.67, -0.43))
      parts.push(box(1.94, 0.03, 0.03, 0, h * 0.67, 0.43))
      if (deco >= 1) parts.push(box(1.6, 0.05, 0.6, 0, h, 0)) // 顶部平台
      if (deco >= 2) parts.push(box(0.15, 0.25, 0.15, 0, h + 0.05, 0)) // 天线
      return merge(parts)
    }

    case 'mall': {
      // L形低矮体 + 转角塔
      const h = 0.6 * hMult
      const parts = [
        box(0.95, h, 0.95, -0.475, 0, -0.475), // 左前
        box(0.95, h, 0.95, 0.475, 0, -0.475), // 右前
        box(0.95, h, 0.95, -0.475, 0, 0.475), // 左后
      ]
      // 转角高塔
      parts.push(box(0.3, h * 1.3, 0.3, -0.475, 0, -0.475))
      // 入口雨棚
      parts.push(box(0.6, 0.03, 0.25, 0, h * 0.5, -0.95 - 0.12))
      // 角楼装饰
      parts.push(box(0.15, 0.08, 0.15, 0.475, h, -0.475))
      parts.push(box(0.15, 0.08, 0.15, -0.475, h, 0.475))
      if (deco >= 1) parts.push(box(0.15, 0.1, 0.15, -0.475, h * 1.3, -0.475))
      return merge(parts)
    }

    case 'factory': {
      // 方体 + 圆柱烟囱
      const h = 0.45 * hMult
      const parts = [box(0.8, h, 0.8)]
      // 装卸台
      parts.push(box(0.3, h * 0.3, 0.15, 0, 0, -0.48))
      // 屋脊线
      parts.push(box(0.84, 0.03, 0.06, 0, h))
      // 烟囱 + 烟囱盖
      parts.push(cylinder(0.08, 0.35, 0.25, h, 0.25))
      parts.push(box(0.2, 0.02, 0.2, 0.25, h + 0.35, 0.25))
      if (deco >= 1) {
        parts.push(cylinder(0.06, 0.3, -0.25, h, 0.25))
        parts.push(box(0.16, 0.02, 0.16, -0.25, h + 0.3, 0.25))
      }
      if (deco >= 2) parts.push(cylinder(0.05, 0.25, 0, h, -0.25))
      return merge(parts)
    }

    case 'heavy_industry': {
      // 大方体 (2x2) + 多烟囱
      const h = 0.55 * hMult
      const parts = [box(1.9, h, 1.9)]
      // 管道连接
      parts.push(cylinder(0.04, 1.2, 0, h * 0.6, 0.7, 6))
      parts.push(box(0.08, 0.08, 1.4, 0, h * 0.8, 0))
      // 龙门吊轮廓
      parts.push(box(0.06, h * 0.5, 0.06, -0.8, h, -0.8))
      parts.push(box(0.06, h * 0.5, 0.06, 0.8, h, -0.8))
      parts.push(box(1.66, 0.06, 0.06, 0, h * 1.5, -0.8))
      // 烟囱
      parts.push(cylinder(0.12, 0.5, 0.6, h, 0.6))
      parts.push(cylinder(0.1, 0.45, -0.6, h, 0.6))
      if (deco >= 1) {
        parts.push(cylinder(0.08, 0.4, 0.6, h, -0.6))
        parts.push(cylinder(0.08, 0.35, -0.6, h, -0.6))
      }
      return merge(parts)
    }

    case 'warehouse': {
      // 长条弧顶 (1x2: 沿 X 轴扩展)
      const h = 0.4 * hMult
      const parts = [box(1.9, h, 0.9)]
      // 弧顶用半圆柱近似（轴沿 X）
      const roofGeo = new THREE.CylinderGeometry(
        0.45,
        0.45,
        1.9,
        8,
        1,
        false,
        0,
        Math.PI
      )
      roofGeo.rotateZ(Math.PI / 2)
      roofGeo.translate(0, h, 0)
      parts.push(roofGeo)
      // 大型卷帘门
      parts.push(box(0.5, h * 0.8, 0.04, -0.45, 0, -0.47))
      parts.push(box(0.5, h * 0.8, 0.04, 0.45, 0, -0.47))
      // 门框
      parts.push(box(0.04, h * 0.85, 0.04, -0.21, 0, -0.47))
      parts.push(box(0.04, h * 0.85, 0.04, 0.21, 0, -0.47))
      return merge(parts)
    }

    case 'park': {
      // 平地 + 半球形树冠
      const parts = [
        box(0.9, 0.02, 0.9), // 草坪
        hemisphere(0.15, 0.15, 0.17, 0.15), // 树冠
        hemisphere(0.12, -0.2, 0.14, -0.1),
      ]
      // 树干
      parts.push(cylinder(0.03, 0.15, 0.15, 0.02, 0.15))
      parts.push(cylinder(0.03, 0.12, -0.2, 0.02, -0.1))
      // 长椅
      parts.push(box(0.2, 0.06, 0.08, 0.25, 0.02, -0.25))
      parts.push(box(0.03, 0.1, 0.08, 0.15, 0.02, -0.25))
      parts.push(box(0.03, 0.1, 0.08, 0.35, 0.02, -0.25))
      // 小径
      parts.push(box(0.08, 0.005, 0.6, 0, 0.02, -0.05))
      if (deco >= 1) {
        parts.push(hemisphere(0.1, -0.1, 0.12, 0.25))
        parts.push(cylinder(0.02, 0.1, -0.1, 0.02, 0.25))
      }
      return merge(parts)
    }

    case 'plaza': {
      // 铺装面 (2x2) + 中央喷泉
      const parts = [
        box(1.9, 0.05, 1.9), // 铺装
        // 铺装边框
        box(1.94, 0.03, 0.06, 0, 0.05, -0.95),
        box(1.94, 0.03, 0.06, 0, 0.05, 0.95),
        box(0.06, 0.03, 1.94, -0.95, 0.05),
        box(0.06, 0.03, 1.94, 0.95, 0.05),
        // 喷泉池
        cylinder(0.3, 0.08, 0, 0.05, 0, 12),
        cylinder(0.15, 0.35, 0, 0.13, 0), // 中央柱
        cylinder(0.25, 0.05, 0, 0.48, 0), // 顶部
      ]
      // 护柱
      parts.push(cylinder(0.04, 0.15, 0.7, 0.05, 0.7))
      parts.push(cylinder(0.04, 0.15, -0.7, 0.05, -0.7))
      parts.push(cylinder(0.04, 0.15, 0.7, 0.05, -0.7))
      parts.push(cylinder(0.04, 0.15, -0.7, 0.05, 0.7))
      if (deco >= 1) {
        parts.push(cylinder(0.08, 0.3, 0.5, 0.05, 0.5))
        parts.push(cylinder(0.08, 0.3, -0.5, 0.05, -0.5))
      }
      return merge(parts)
    }

    case 'school': {
      // T形主体 + 塔楼 (3x2: [{0,0},{1,0},{2,0},{1,1}])
      const h = 0.55 * hMult
      const parts = [
        box(0.95, h, 0.95, -1, 0, -0.475), // (0,0)
        box(0.95, h, 0.95, 0, 0, -0.475), // (1,0)
        box(0.95, h, 0.95, 1, 0, -0.475), // (2,0)
        box(0.95, h * 0.9, 0.95, 0, 0, 0.475), // (1,1) 稍矮
      ]
      // 塔楼 + 钟楼球顶
      parts.push(box(0.25, h * 0.5, 0.25, 0, h, -0.475))
      parts.push(hemisphere(0.14, 0, h * 1.5, -0.475))
      // 连廊
      parts.push(box(0.15, h * 0.6, 0.06, -0.5, 0, 0))
      parts.push(box(0.15, h * 0.6, 0.06, 0.5, 0, 0))
      if (deco >= 1) parts.push(cylinder(0.04, 0.15, 0, h * 1.5 + 0.14, -0.475))
      return merge(parts)
    }

    case 'hospital': {
      // 十字体 + 中央高塔 [{0,-1},{-1,0},{0,0},{1,0},{0,1}]
      const h = 0.6 * hMult
      const parts = [
        box(0.95, h, 0.95, 0, 0, -1), // (0,-1)
        box(0.95, h, 0.95, -1, 0, 0), // (-1,0)
        box(0.95, h * 1.2, 0.95, 0, 0, 0), // (0,0) 中央高
        box(0.95, h, 0.95, 1, 0, 0), // (1,0)
        box(0.95, h, 0.95, 0, 0, 1), // (0,1)
      ]
      // 停机坪（屋顶十字标记）
      parts.push(box(0.6, 0.01, 0.08, 0, h * 1.2, 0))
      parts.push(box(0.08, 0.01, 0.6, 0, h * 1.2, 0))
      // 入口雨棚
      parts.push(box(0.5, 0.03, 0.25, 0, h * 0.5, -1.48))
      // 入口柱
      parts.push(box(0.06, h * 0.5, 0.06, -0.2, 0, -1.48))
      parts.push(box(0.06, h * 0.5, 0.06, 0.2, 0, -1.48))
      if (deco >= 1) parts.push(box(0.2, 0.2, 0.2, 0, h * 1.2, 0))
      return merge(parts)
    }

    case 'fire_station': {
      // 方体 + 瞭望塔
      const h = 0.5 * hMult
      const parts = [box(0.8, h, 0.8)]
      // 车库门框
      parts.push(box(0.4, h * 0.75, 0.04, -0.1, 0, -0.42))
      parts.push(box(0.04, h * 0.8, 0.04, -0.31, 0, -0.42))
      parts.push(box(0.04, h * 0.8, 0.04, 0.11, 0, -0.42))
      // 塔
      parts.push(box(0.2, h * 0.8, 0.2, 0.25, h, 0.25))
      // 塔顶 + 栏杆
      parts.push(box(0.35, 0.03, 0.35, 0.25, h * 1.8, 0.25))
      parts.push(box(0.35, 0.06, 0.03, 0.25, h * 1.83, 0.08))
      parts.push(box(0.35, 0.06, 0.03, 0.25, h * 1.83, 0.42))
      parts.push(box(0.03, 0.06, 0.35, 0.08, h * 1.83, 0.25))
      parts.push(box(0.03, 0.06, 0.35, 0.42, h * 1.83, 0.25))
      if (deco >= 1) parts.push(cylinder(0.04, 0.15, 0.25, h * 1.89, 0.25))
      return merge(parts)
    }

    case 'police_station': {
      // 方体 + 穹顶
      const h = 0.5 * hMult
      const parts = [
        box(0.84, 0.04, 0.9, 0, 0, -0.03), // 台阶
        box(0.8, h, 0.8, 0, 0.04), // 主体
      ]
      // 前柱/壁柱
      parts.push(box(0.06, h, 0.06, -0.3, 0.04, -0.43))
      parts.push(box(0.06, h, 0.06, 0.3, 0.04, -0.43))
      // 穹顶
      const dome = new THREE.SphereGeometry(
        0.25,
        8,
        6,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      )
      dome.translate(0, h + 0.04, 0)
      parts.push(dome)
      if (deco >= 1) parts.push(cylinder(0.04, 0.15, 0, h + 0.29, 0))
      return merge(parts)
    }

    case 'power_plant': {
      // L形体 [{0,0},{1,0},{0,1}]: 主厂房 + 冷却塔 + 变电站
      const h = 0.55 * hMult
      const parts = [
        // (0,0) 主厂房 — 高大方体
        box(0.9, h * 1.1, 0.9, -0.475, 0, -0.475),
        // 厂房屋脊
        box(0.94, 0.04, 0.1, -0.475, h * 1.1, -0.475),
        // 烟囱（高耸）
        cylinder(0.1, h * 1.6, -0.7, 0, -0.7),
        cylinder(0.12, 0.04, -0.7, h * 1.6, -0.7), // 烟囱顶帽
        // (1,0) 变电站 — 矮方体 + 变压器 + 电塔
        box(0.9, h * 0.5, 0.9, 0.475, 0, -0.475),
        // 变压器设备
        box(0.25, h * 0.35, 0.2, 0.3, h * 0.5, -0.6),
        box(0.2, h * 0.3, 0.2, 0.6, h * 0.5, -0.35),
        // 高压电塔 — 四根柱 + 横臂
        cylinder(0.02, h * 1.3, 0.35, h * 0.5, -0.35),
        cylinder(0.02, h * 1.3, 0.6, h * 0.5, -0.35),
        box(0.35, 0.03, 0.03, 0.475, h * 1.8, -0.35),
        box(0.25, 0.03, 0.03, 0.475, h * 1.6, -0.35),
        // 绝缘子
        cylinder(0.015, 0.06, 0.35, h * 1.74, -0.35),
        cylinder(0.015, 0.06, 0.6, h * 1.74, -0.35),
        // (0,1) 冷却塔区域
        box(0.9, 0.04, 0.9, -0.475, 0, 0.475), // 底座平台
      ]
      // 冷却塔（双曲线轮廓：底宽-腰窄-顶略宽）
      // 下段
      parts.push(cylinder(0.28, h * 0.5, -0.475, 0.04, 0.475, 12))
      // 上段（略窄再展开）
      const towerGeo = new THREE.CylinderGeometry(
        0.22,
        0.2,
        h * 0.7,
        12,
        1,
        true
      )
      towerGeo.translate(-0.475, h * 0.5 + h * 0.35 + 0.04, 0.475)
      parts.push(towerGeo)
      // 冷却塔顶圈
      const ringGeo = new THREE.TorusGeometry(0.22, 0.02, 6, 12)
      ringGeo.rotateX(Math.PI / 2)
      ringGeo.translate(-0.475, h * 0.5 + h * 0.7 + 0.04, 0.475)
      parts.push(ringGeo)
      // 围栏柱
      parts.push(cylinder(0.02, h * 0.3, 0.0, 0, 0.0))
      parts.push(cylinder(0.02, h * 0.3, -0.95, 0, 0.0))
      if (deco >= 1) {
        // 第二根烟囱
        parts.push(cylinder(0.07, h * 1.2, -0.25, 0, -0.7))
        parts.push(cylinder(0.09, 0.03, -0.25, h * 1.2, -0.7))
        // 管道连接
        parts.push(box(0.04, 0.04, 0.8, -0.475, h * 0.4, 0))
      }
      if (deco >= 2) {
        // 额外变压器
        parts.push(box(0.2, h * 0.25, 0.15, 0.5, h * 0.5, -0.7))
      }
      return merge(parts)
    }

    default: {
      // 默认通用 box
      const footprint = def?.footprint ?? [{ dx: 0, dy: 0 }]
      const w = Math.max(...footprint.map(f => f.dx)) + 1
      const d = Math.max(...footprint.map(f => f.dy)) + 1
      const h = 0.5 * hMult
      const geo = box(w * 0.9, h, d * 0.9)
      return geo
    }
  }
}

/** 创建 base/accent 分离的几何体对 */
function createBuildingGeometryPair(
  id: BuildingId,
  level: number
): { base: THREE.BufferGeometry; accent: THREE.BufferGeometry } {
  const def = getBuildingDef(id)
  const { hMult, deco } = levelScale(level)

  switch (id) {
    case 'house': {
      const h = 0.5 * hMult
      const baseParts = [
        box(0.84, 0.03, 0.84), // 底座台阶
        box(0.8, h, 0.8, 0, 0.03), // 主体
        box(0.2, 0.02, 0.08, 0, 0.03, -0.44), // 门廊
        box(0.15, 0.02, 0.05, -0.2, h * 0.5 + 0.03, -0.42), // 窗台
        box(0.15, 0.02, 0.05, 0.2, h * 0.5 + 0.03, -0.42),
      ]
      const accentParts = [cone(0.5, 0.25, 0, h + 0.03, 0, 4)]
      if (deco >= 1) accentParts.push(box(0.15, 0.15, 0.15, 0.3, h + 0.03, 0.3))
      if (deco >= 2) accentParts.push(box(0.1, 0.2, 0.1, -0.3, h + 0.03, -0.3))
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'apartment': {
      const h = 0.8 * hMult
      const baseParts = [
        box(1.9, h, 0.9),
        box(1.94, 0.02, 0.94, 0, h * 0.33),
        box(1.94, 0.02, 0.94, 0, h * 0.66),
        box(0.3, 0.02, 0.1, -0.5, h * 0.33, -0.5),
        box(0.3, 0.02, 0.1, 0.5, h * 0.66, -0.5),
      ]
      const accentParts = [
        box(1.94, 0.04, 0.04, 0, h, -0.47),
        box(1.94, 0.04, 0.04, 0, h, 0.47),
        box(0.3, 0.15, 0.3, 0.5, h, 0.2),
      ]
      if (deco >= 1) accentParts.push(box(0.2, 0.1, 0.2, -0.5, h, -0.2))
      if (deco >= 2) accentParts.push(box(0.15, 0.2, 0.15, 0, h + 0.15, 0))
      return { base: merge(baseParts), accent: merge(accentParts) }
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
      ]
      const accentParts = [
        box(0.08, h * 1.1, 0.08, 0.775, 0, 0.775),
        box(0.08, h * 1.1, 0.08, -0.775, 0, -0.775),
        box(0.08, h * 1.1, 0.08, 0.775, 0, -0.775),
        box(0.08, h * 1.1, 0.08, -0.775, 0, 0.775),
      ]
      if (deco >= 1) {
        accentParts.push(box(0.2, 0.15, 0.2, 0.775, h * 1.1, 0.775))
        accentParts.push(box(0.2, 0.15, 0.2, -0.775, h * 1.1, -0.775))
      }
      return { base: merge(baseParts), accent: merge(accentParts) }
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
        box(0.88, 0.03, 0.3, 0, h, -0.45),
        box(0.5, 0.1, 0.05, 0, h * 0.75, -0.42),
      ]
      if (deco >= 1) accentParts.push(box(0.15, 0.12, 0.05, 0.3, h, -0.42))
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'office': {
      const h = 1.2 * hMult
      const baseParts = [
        box(1.9, h * 0.67, 0.85),
        box(1.6, h * 0.33, 0.7, 0, h * 0.67),
      ]
      const floors = 4
      for (let i = 1; i < floors; i++) {
        const fy = (h * 0.67 * i) / floors
        baseParts.push(box(1.94, 0.02, 0.88, 0, fy))
      }
      const accentParts = [
        box(1.94, 0.03, 0.03, 0, h * 0.67, -0.43),
        box(1.94, 0.03, 0.03, 0, h * 0.67, 0.43),
      ]
      if (deco >= 1) accentParts.push(box(1.6, 0.05, 0.6, 0, h, 0))
      if (deco >= 2) accentParts.push(box(0.15, 0.25, 0.15, 0, h + 0.05, 0))
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'mall': {
      const h = 0.6 * hMult
      const baseParts = [
        box(0.95, h, 0.95, -0.475, 0, -0.475),
        box(0.95, h, 0.95, 0.475, 0, -0.475),
        box(0.95, h, 0.95, -0.475, 0, 0.475),
      ]
      const accentParts = [
        box(0.3, h * 1.3, 0.3, -0.475, 0, -0.475),
        box(0.6, 0.03, 0.25, 0, h * 0.5, -0.95 - 0.12),
        box(0.15, 0.08, 0.15, 0.475, h, -0.475),
        box(0.15, 0.08, 0.15, -0.475, h, 0.475),
      ]
      if (deco >= 1)
        accentParts.push(box(0.15, 0.1, 0.15, -0.475, h * 1.3, -0.475))
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'factory': {
      const h = 0.45 * hMult
      const baseParts = [
        box(0.8, h, 0.8),
        box(0.3, h * 0.3, 0.15, 0, 0, -0.48),
        box(0.84, 0.03, 0.06, 0, h),
      ]
      const accentParts = [
        cylinder(0.08, 0.35, 0.25, h, 0.25),
        box(0.2, 0.02, 0.2, 0.25, h + 0.35, 0.25),
      ]
      if (deco >= 1) {
        accentParts.push(cylinder(0.06, 0.3, -0.25, h, 0.25))
        accentParts.push(box(0.16, 0.02, 0.16, -0.25, h + 0.3, 0.25))
      }
      if (deco >= 2) accentParts.push(cylinder(0.05, 0.25, 0, h, -0.25))
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'heavy_industry': {
      const h = 0.55 * hMult
      const baseParts = [
        box(1.9, h, 1.9),
        box(0.06, h * 0.5, 0.06, -0.8, h, -0.8),
        box(0.06, h * 0.5, 0.06, 0.8, h, -0.8),
        box(1.66, 0.06, 0.06, 0, h * 1.5, -0.8),
      ]
      const accentParts = [
        cylinder(0.04, 1.2, 0, h * 0.6, 0.7, 6),
        box(0.08, 0.08, 1.4, 0, h * 0.8, 0),
        cylinder(0.12, 0.5, 0.6, h, 0.6),
        cylinder(0.1, 0.45, -0.6, h, 0.6),
      ]
      if (deco >= 1) {
        accentParts.push(cylinder(0.08, 0.4, 0.6, h, -0.6))
        accentParts.push(cylinder(0.08, 0.35, -0.6, h, -0.6))
      }
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'warehouse': {
      const h = 0.4 * hMult
      const baseParts = [
        box(1.9, h, 0.9),
        box(0.5, h * 0.8, 0.04, -0.45, 0, -0.47),
        box(0.5, h * 0.8, 0.04, 0.45, 0, -0.47),
        box(0.04, h * 0.85, 0.04, -0.21, 0, -0.47),
        box(0.04, h * 0.85, 0.04, 0.21, 0, -0.47),
      ]
      const roofGeo = new THREE.CylinderGeometry(
        0.45,
        0.45,
        1.9,
        8,
        1,
        false,
        0,
        Math.PI
      )
      roofGeo.rotateZ(Math.PI / 2)
      roofGeo.translate(0, h, 0)
      const accentParts = [roofGeo]
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'park': {
      const baseParts = [
        box(0.9, 0.02, 0.9),
        cylinder(0.03, 0.15, 0.15, 0.02, 0.15),
        cylinder(0.03, 0.12, -0.2, 0.02, -0.1),
        box(0.2, 0.06, 0.08, 0.25, 0.02, -0.25),
        box(0.03, 0.1, 0.08, 0.15, 0.02, -0.25),
        box(0.03, 0.1, 0.08, 0.35, 0.02, -0.25),
        box(0.08, 0.005, 0.6, 0, 0.02, -0.05),
      ]
      const accentParts: THREE.BufferGeometry[] = [
        hemisphere(0.15, 0.15, 0.17, 0.15),
        hemisphere(0.12, -0.2, 0.14, -0.1),
      ]
      if (deco >= 1) {
        accentParts.push(hemisphere(0.1, -0.1, 0.12, 0.25))
        baseParts.push(cylinder(0.02, 0.1, -0.1, 0.02, 0.25))
      }
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'plaza': {
      const baseParts = [
        box(1.9, 0.05, 1.9),
        box(1.94, 0.03, 0.06, 0, 0.05, -0.95),
        box(1.94, 0.03, 0.06, 0, 0.05, 0.95),
        box(0.06, 0.03, 1.94, -0.95, 0.05),
        box(0.06, 0.03, 1.94, 0.95, 0.05),
        cylinder(0.04, 0.15, 0.7, 0.05, 0.7),
        cylinder(0.04, 0.15, -0.7, 0.05, -0.7),
        cylinder(0.04, 0.15, 0.7, 0.05, -0.7),
        cylinder(0.04, 0.15, -0.7, 0.05, 0.7),
      ]
      const accentParts = [
        cylinder(0.3, 0.08, 0, 0.05, 0, 12),
        cylinder(0.15, 0.35, 0, 0.13, 0),
        cylinder(0.25, 0.05, 0, 0.48, 0),
      ]
      if (deco >= 1) {
        accentParts.push(cylinder(0.08, 0.3, 0.5, 0.05, 0.5))
        accentParts.push(cylinder(0.08, 0.3, -0.5, 0.05, -0.5))
      }
      return { base: merge(baseParts), accent: merge(accentParts) }
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
      ]
      const accentParts = [
        box(0.25, h * 0.5, 0.25, 0, h, -0.475),
        hemisphere(0.14, 0, h * 1.5, -0.475),
      ]
      if (deco >= 1)
        accentParts.push(cylinder(0.04, 0.15, 0, h * 1.5 + 0.14, -0.475))
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'hospital': {
      const h = 0.6 * hMult
      const baseParts = [
        box(0.95, h, 0.95, 0, 0, -1),
        box(0.95, h, 0.95, -1, 0, 0),
        box(0.95, h * 1.2, 0.95, 0, 0, 0),
        box(0.95, h, 0.95, 1, 0, 0),
        box(0.95, h, 0.95, 0, 0, 1),
        box(0.06, h * 0.5, 0.06, -0.2, 0, -1.48),
        box(0.06, h * 0.5, 0.06, 0.2, 0, -1.48),
      ]
      const accentParts = [
        box(0.6, 0.01, 0.08, 0, h * 1.2, 0),
        box(0.08, 0.01, 0.6, 0, h * 1.2, 0),
        box(0.5, 0.03, 0.25, 0, h * 0.5, -1.48),
      ]
      if (deco >= 1) accentParts.push(box(0.2, 0.2, 0.2, 0, h * 1.2, 0))
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'fire_station': {
      const h = 0.5 * hMult
      const baseParts = [
        box(0.8, h, 0.8),
        box(0.4, h * 0.75, 0.04, -0.1, 0, -0.42),
        box(0.04, h * 0.8, 0.04, -0.31, 0, -0.42),
        box(0.04, h * 0.8, 0.04, 0.11, 0, -0.42),
      ]
      const accentParts = [
        box(0.2, h * 0.8, 0.2, 0.25, h, 0.25),
        box(0.35, 0.03, 0.35, 0.25, h * 1.8, 0.25),
        box(0.35, 0.06, 0.03, 0.25, h * 1.83, 0.08),
        box(0.35, 0.06, 0.03, 0.25, h * 1.83, 0.42),
        box(0.03, 0.06, 0.35, 0.08, h * 1.83, 0.25),
        box(0.03, 0.06, 0.35, 0.42, h * 1.83, 0.25),
      ]
      if (deco >= 1)
        accentParts.push(cylinder(0.04, 0.15, 0.25, h * 1.89, 0.25))
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    case 'police_station': {
      const h = 0.5 * hMult
      const baseParts = [
        box(0.84, 0.04, 0.9, 0, 0, -0.03),
        box(0.8, h, 0.8, 0, 0.04),
        box(0.06, h, 0.06, -0.3, 0.04, -0.43),
        box(0.06, h, 0.06, 0.3, 0.04, -0.43),
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
      dome.translate(0, h + 0.04, 0)
      const accentParts: THREE.BufferGeometry[] = [dome]
      if (deco >= 1) accentParts.push(cylinder(0.04, 0.15, 0, h + 0.29, 0))
      return { base: merge(baseParts), accent: merge(accentParts) }
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
        true
      )
      towerGeo.translate(-0.475, h * 0.5 + h * 0.35 + 0.04, 0.475)
      baseParts.push(towerGeo)
      // 冷却塔顶圈
      const ringGeo = new THREE.TorusGeometry(0.22, 0.02, 6, 12)
      ringGeo.rotateX(Math.PI / 2)
      ringGeo.translate(-0.475, h * 0.5 + h * 0.7 + 0.04, 0.475)
      baseParts.push(ringGeo)

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
      ]
      if (deco >= 1) {
        accentParts.push(cylinder(0.07, h * 1.2, -0.25, 0, -0.7))
        accentParts.push(cylinder(0.09, 0.03, -0.25, h * 1.2, -0.7))
        accentParts.push(box(0.04, 0.04, 0.8, -0.475, h * 0.4, 0))
      }
      if (deco >= 2) {
        accentParts.push(box(0.2, h * 0.25, 0.15, 0.5, h * 0.5, -0.7))
      }
      return { base: merge(baseParts), accent: merge(accentParts) }
    }

    default: {
      const footprint = def?.footprint ?? [{ dx: 0, dy: 0 }]
      const w = Math.max(...footprint.map(f => f.dx)) + 1
      const d = Math.max(...footprint.map(f => f.dy)) + 1
      const h = 0.5 * hMult
      // default: base 是主体，accent 是顶面的薄片
      return {
        base: box(w * 0.9, h, d * 0.9),
        accent: box(w * 0.9, 0.03, d * 0.9, 0, h),
      }
    }
  }
}
