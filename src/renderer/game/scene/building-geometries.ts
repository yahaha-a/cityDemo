import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { BuildingId } from 'shared/types/building-defs'
import { getBuildingDef } from '../config/building-defs'

/** 几何体缓存: buildingId → level → geometry */
const cache = new Map<string, THREE.BufferGeometry>()

function getCacheKey(id: BuildingId, level: number): string {
  return `${id}:${level}`
}

/** 获取建筑几何体（带缓存） */
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

/** 清理缓存（dispose 时调用） */
export function disposeBuildingGeometries(): void {
  for (const geo of cache.values()) geo.dispose()
  cache.clear()
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
      const parts = [box(0.8, h, 0.8)]
      // 屋顶棱锥
      parts.push(cone(0.5, 0.25, 0, h, 0, 4))
      if (deco >= 1) parts.push(box(0.15, 0.15, 0.15, 0.3, h, 0.3)) // 烟囱
      if (deco >= 2) parts.push(box(0.1, 0.2, 0.1, -0.3, h, -0.3))
      return merge(parts)
    }

    case 'apartment': {
      // 两段式方体 (1x2)
      const h = 0.8 * hMult
      const parts = [box(0.9, h, 1.9)]
      // 顶部水箱
      parts.push(box(0.3, 0.15, 0.3, 0.2, h, 0.5))
      if (deco >= 1) parts.push(box(0.2, 0.1, 0.2, -0.2, h, -0.5))
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
      if (deco >= 1) {
        parts.push(box(0.2, 0.15, 0.2, 0.775, h, 0.775)) // 角楼
        parts.push(box(0.2, 0.15, 0.2, -0.775, h, -0.775))
      }
      return merge(parts)
    }

    case 'shop': {
      // 平顶方体 + 前方遮雨棚
      const h = 0.4 * hMult
      const parts = [box(0.8, h, 0.8)]
      parts.push(box(0.85, 0.03, 0.3, 0, h, -0.45)) // 遮雨棚
      if (deco >= 1) parts.push(box(0.4, 0.1, 0.05, 0, h * 0.7, -0.4)) // 招牌
      return merge(parts)
    }

    case 'office': {
      // 窄高塔 (1x2)
      const h = 1.2 * hMult
      const parts = [box(0.85, h, 1.9)]
      if (deco >= 1) parts.push(box(0.6, 0.05, 1.6, 0, h, 0)) // 顶部平台
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
      if (deco >= 1) parts.push(box(0.15, 0.1, 0.15, -0.475, h * 1.3, -0.475))
      return merge(parts)
    }

    case 'factory': {
      // 方体 + 圆柱烟囱
      const h = 0.45 * hMult
      const parts = [box(0.8, h, 0.8)]
      parts.push(cylinder(0.08, 0.35, 0.25, h, 0.25))
      if (deco >= 1) parts.push(cylinder(0.06, 0.3, -0.25, h, 0.25))
      if (deco >= 2) parts.push(cylinder(0.05, 0.25, 0, h, -0.25))
      return merge(parts)
    }

    case 'heavy_industry': {
      // 大方体 (2x2) + 多烟囱
      const h = 0.55 * hMult
      const parts = [box(1.9, h, 1.9)]
      parts.push(cylinder(0.12, 0.5, 0.6, h, 0.6))
      parts.push(cylinder(0.1, 0.45, -0.6, h, 0.6))
      if (deco >= 1) {
        parts.push(cylinder(0.08, 0.4, 0.6, h, -0.6))
        parts.push(cylinder(0.08, 0.35, -0.6, h, -0.6))
      }
      return merge(parts)
    }

    case 'warehouse': {
      // 长条弧顶 (1x2)
      const h = 0.4 * hMult
      const parts = [box(0.9, h, 1.9)]
      // 弧顶用半圆柱近似
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
      roofGeo.rotateY(Math.PI / 2)
      roofGeo.translate(0, h, 0)
      parts.push(roofGeo)
      return merge(parts)
    }

    case 'park': {
      // 平地 + 锥形树
      const parts = [
        box(0.9, 0.02, 0.9), // 草坪
        cone(0.15, 0.35, 0.15, 0.02, 0.15), // 树
        cone(0.12, 0.3, -0.2, 0.02, -0.1),
      ]
      // 树干
      parts.push(cylinder(0.03, 0.15, 0.15, 0.02, 0.15))
      parts.push(cylinder(0.03, 0.12, -0.2, 0.02, -0.1))
      if (deco >= 1) {
        parts.push(cone(0.1, 0.25, -0.1, 0.02, 0.25))
        parts.push(cylinder(0.02, 0.1, -0.1, 0.02, 0.25))
      }
      return merge(parts)
    }

    case 'plaza': {
      // 铺装面 (2x2) + 中央雕塑
      const parts = [
        box(1.9, 0.05, 1.9), // 铺装
        cylinder(0.15, 0.5, 0, 0.05, 0), // 中央柱
        cylinder(0.25, 0.05, 0, 0.55, 0), // 顶部
      ]
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
      // 塔楼
      parts.push(box(0.25, h * 0.5, 0.25, 0, h, -0.475))
      if (deco >= 1) parts.push(box(0.15, 0.1, 0.15, 0, h * 1.5, -0.475))
      return merge(parts)
    }

    case 'hospital': {
      // 十字体 + 中央高塔 [{1,0},{0,1},{1,1},{2,1},{1,2}]
      const h = 0.6 * hMult
      const parts = [
        box(0.95, h, 0.95, 0, 0, -1), // (1,0)
        box(0.95, h, 0.95, -1, 0, 0), // (0,1)
        box(0.95, h * 1.2, 0.95, 0, 0, 0), // (1,1) 中央高
        box(0.95, h, 0.95, 1, 0, 0), // (2,1)
        box(0.95, h, 0.95, 0, 0, 1), // (1,2)
      ]
      if (deco >= 1) parts.push(box(0.2, 0.2, 0.2, 0, h * 1.2, 0))
      return merge(parts)
    }

    case 'fire_station': {
      // 方体 + 瞭望塔
      const h = 0.5 * hMult
      const parts = [box(0.8, h, 0.8)]
      parts.push(box(0.2, h * 0.8, 0.2, 0.25, h, 0.25)) // 塔
      parts.push(box(0.35, 0.03, 0.35, 0.25, h * 1.8, 0.25)) // 塔顶
      if (deco >= 1) parts.push(cylinder(0.04, 0.15, 0.25, h * 1.83, 0.25))
      return merge(parts)
    }

    case 'police_station': {
      // 方体 + 穹顶
      const h = 0.5 * hMult
      const parts = [box(0.8, h, 0.8)]
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
      dome.translate(0, h, 0)
      parts.push(dome)
      if (deco >= 1) parts.push(cylinder(0.04, 0.15, 0, h + 0.25, 0))
      return merge(parts)
    }

    case 'power_plant': {
      // L形体 + 冷却塔 [{0,0},{1,0},{0,1}]
      const h = 0.55 * hMult
      const parts = [
        box(0.95, h, 0.95, -0.475, 0, -0.475), // (0,0)
        box(0.95, h, 0.95, 0.475, 0, -0.475), // (1,0)
        box(0.95, h, 0.95, -0.475, 0, 0.475), // (0,1)
      ]
      // 冷却塔
      parts.push(cylinder(0.2, h * 0.8, 0.475, h, 0.475, 12))
      if (deco >= 1) parts.push(cylinder(0.15, h * 0.6, -0.475, h, -0.475, 12))
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
