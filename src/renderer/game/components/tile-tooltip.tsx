import { useRef, useEffect, useCallback } from 'react'
import {
  TILE_LABELS,
  TERRAIN_LABELS,
  TERRAIN_BUILD_COST_MULTIPLIER,
  BUILDING_COSTS,
  UPGRADE_COST_MULTIPLIER,
  MAX_BUILDING_LEVEL,
} from '../config'
import { TileType, TerrainType } from 'shared/types'
import { useHoveredTile, useMap, useEconomy } from '../hooks/use-game-selector'

function terrainEffectText(terrain: TerrainType): string | null {
  switch (terrain) {
    case TerrainType.Hill:
      return '建造成本 x2'
    case TerrainType.Water:
      return '不可建造，相邻住宅+满意度'
    case TerrainType.Fertile:
      return '工业产出 x1.5'
    case TerrainType.Rocky:
      return '建造成本 x1.3'
    default:
      return null
  }
}

export function TileTooltip() {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const hoveredTile = useHoveredTile()
  const map = useMap()
  const economy = useEconomy()

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = tooltipRef.current
    if (!el) return
    el.style.left = `${e.clientX + 16}px`
    el.style.top = `${e.clientY + 16}px`
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  if (!hoveredTile) return null

  const tileData = map.tiles[hoveredTile.y]?.[hoveredTile.x]
  if (!tileData) return null

  const { efficiencyByType } = economy
  const effect = terrainEffectText(tileData.terrain)

  return (
    <div
      className="fixed z-50 pointer-events-none px-2 py-1.5 rounded-[var(--game-radius-sm)] game-parchment-bg border border-[var(--game-wood)] shadow-[0_2px_8px_oklch(0.2_0.05_55/0.2)] text-xs text-[var(--game-text)] space-y-0.5 max-w-[200px]"
      ref={tooltipRef}
      style={{ left: 0, top: 0 }}
    >
      <div className="text-[var(--game-text-muted)]">
        ({hoveredTile.x}, {hoveredTile.y})
      </div>
      <div>类型: {TILE_LABELS[tileData.type]}</div>
      <div className="text-[var(--game-text-muted)]">
        地形: {TERRAIN_LABELS[tileData.terrain]}
      </div>
      {effect && (
        <div className="text-[var(--game-gold)] text-[10px]">{effect}</div>
      )}
      {tileData.type !== TileType.Empty && tileData.type !== TileType.Road && (
        <>
          <div className="text-[var(--game-text-muted)]">
            等级: Lv{tileData.level}
          </div>
          <div
            className={
              tileData.connected
                ? 'text-[var(--game-green)]'
                : 'text-[var(--game-red)]'
            }
          >
            {tileData.connected ? '已连接道路' : '未连接道路'}
          </div>
          {tileData.connected && (
            <div className="text-[var(--game-text-muted)]">
              效率:{' '}
              {Math.round(
                (tileData.type === TileType.Residential
                  ? efficiencyByType.residential
                  : tileData.type === TileType.Commercial
                    ? efficiencyByType.commercial
                    : efficiencyByType.industrial) * 100
              )}
              %
            </div>
          )}
          {tileData.level < MAX_BUILDING_LEVEL && (
            <div className="text-[var(--game-text-muted)] text-[10px]">
              升级费用: $
              {Math.ceil(
                (BUILDING_COSTS[tileData.type as keyof typeof BUILDING_COSTS] ??
                  0) *
                  (Number.isFinite(
                    TERRAIN_BUILD_COST_MULTIPLIER[tileData.terrain]
                  )
                    ? TERRAIN_BUILD_COST_MULTIPLIER[tileData.terrain]
                    : 1) *
                  UPGRADE_COST_MULTIPLIER[tileData.level]
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
