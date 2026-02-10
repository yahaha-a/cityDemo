import * as THREE from 'three'

const DAY_NIGHT_CYCLE_DAYS = 30

export interface DayNightParams {
  ambientIntensity: number
  dirIntensity: number
  skyTopColor: THREE.Color
  skyBottomColor: THREE.Color
  fogColor: THREE.Color
  sunPosition: THREE.Vector3
}

/** 将游戏日数映射到 [0, 1) 的时刻 */
export function getTimeOfDay(day: number): number {
  return (day % DAY_NIGHT_CYCLE_DAYS) / DAY_NIGHT_CYCLE_DAYS
}

// 8 个关键帧
interface Keyframe {
  t: number
  ambient: number
  dir: number
  skyTop: string
  skyBottom: string
  fog: string
}

const KEYFRAMES: Keyframe[] = [
  {
    t: 0.0,
    ambient: 0.4,
    dir: 0.6,
    skyTop: '#e8a060',
    skyBottom: '#f0c888',
    fog: '#f0d8b8',
  },
  {
    t: 0.125,
    ambient: 0.55,
    dir: 0.85,
    skyTop: '#80b8d8',
    skyBottom: '#f0e0c8',
    fog: '#e8dcd0',
  },
  {
    t: 0.25,
    ambient: 0.6,
    dir: 0.9,
    skyTop: '#80b8d8',
    skyBottom: '#f0e0c8',
    fog: '#e8dcd0',
  },
  {
    t: 0.375,
    ambient: 0.55,
    dir: 0.85,
    skyTop: '#90b0d0',
    skyBottom: '#e8d8c0',
    fog: '#e0d4c8',
  },
  {
    t: 0.5,
    ambient: 0.35,
    dir: 0.5,
    skyTop: '#d87848',
    skyBottom: '#e8a060',
    fog: '#d8a880',
  },
  {
    t: 0.625,
    ambient: 0.2,
    dir: 0.15,
    skyTop: '#384878',
    skyBottom: '#684868',
    fog: '#584060',
  },
  {
    t: 0.75,
    ambient: 0.12,
    dir: 0.05,
    skyTop: '#182848',
    skyBottom: '#283050',
    fog: '#283040',
  },
  {
    t: 0.875,
    ambient: 0.15,
    dir: 0.1,
    skyTop: '#283858',
    skyBottom: '#384058',
    fog: '#384050',
  },
]

// 预计算 Color 对象避免每次分配
const kfColors = KEYFRAMES.map(kf => ({
  skyTop: new THREE.Color(kf.skyTop),
  skyBottom: new THREE.Color(kf.skyBottom),
  fog: new THREE.Color(kf.fog),
}))

function lerpKeyframe(t: number, out: DayNightParams): void {
  // 找到 t 所在的两个关键帧
  let i0 = KEYFRAMES.length - 1
  for (let i = 0; i < KEYFRAMES.length; i++) {
    if (KEYFRAMES[i].t > t) {
      i0 = i - 1
      break
    }
  }
  if (i0 < 0) i0 = KEYFRAMES.length - 1
  const i1 = (i0 + 1) % KEYFRAMES.length

  const t0 = KEYFRAMES[i0].t
  let t1 = KEYFRAMES[i1].t
  if (t1 <= t0) t1 += 1.0 // 跨午夜

  let localT = t
  if (localT < t0) localT += 1.0
  const alpha = t1 === t0 ? 0 : (localT - t0) / (t1 - t0)

  const kf0 = KEYFRAMES[i0]
  const kf1 = KEYFRAMES[i1]

  out.ambientIntensity = kf0.ambient + (kf1.ambient - kf0.ambient) * alpha
  out.dirIntensity = kf0.dir + (kf1.dir - kf0.dir) * alpha

  out.skyTopColor.copy(kfColors[i0].skyTop).lerp(kfColors[i1].skyTop, alpha)
  out.skyBottomColor
    .copy(kfColors[i0].skyBottom)
    .lerp(kfColors[i1].skyBottom, alpha)
  out.fogColor.copy(kfColors[i0].fog).lerp(kfColors[i1].fog, alpha)
}

/** 根据 [0,1) 时刻计算完整昼夜参数 */
export function getDayNightParams(
  t: number,
  out?: DayNightParams
): DayNightParams {
  const result: DayNightParams = out ?? {
    ambientIntensity: 0.6,
    dirIntensity: 0.9,
    skyTopColor: new THREE.Color(),
    skyBottomColor: new THREE.Color(),
    fogColor: new THREE.Color(),
    sunPosition: new THREE.Vector3(),
  }

  lerpKeyframe(t, result)

  // 太阳位置随 t 旋转
  const sunAngle = t * Math.PI * 2 - Math.PI / 2
  const sy = Math.sin(sunAngle) * 45
  const sx = Math.cos(sunAngle) * 25
  result.sunPosition.set(sx, Math.max(sy, -10), 30)

  return result
}

/** 计算夜间因子 [0,1]：0=白天, 1=夜晚，基于 ambient 强度平滑过渡 */
export function getNightFactor(t: number): number {
  // 用一个临时对象获取 ambient intensity
  const params = getDayNightParams(t, tmpDayNightParams)
  const ambient = params.ambientIntensity
  if (ambient >= 0.35) return 0
  if (ambient <= 0.15) return 1
  return 1 - (ambient - 0.15) / (0.35 - 0.15)
}

// 复用临时对象避免每帧分配
const tmpDayNightParams: DayNightParams = {
  ambientIntensity: 0.6,
  dirIntensity: 0.9,
  skyTopColor: new THREE.Color(),
  skyBottomColor: new THREE.Color(),
  fogColor: new THREE.Color(),
  sunPosition: new THREE.Vector3(),
}
