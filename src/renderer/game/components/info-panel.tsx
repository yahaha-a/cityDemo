import { useMemo } from 'react'
import type { TileType } from 'shared/types'
import type { BuildingCategory } from 'shared/types/building-defs'
import { getTileBuildingId } from 'shared/types/building-compat'
import { getBuildingDef } from '../config/building-defs'
import {
  useMoney,
  useEconomy,
  useEvents,
  useMapStats,
  useGameSelector,
} from '../hooks/use-game-selector'
import { GamePanel, GamePanelDivider } from './ui/game-panel'
import { FinanceSection } from './info-sections/finance-section'
import { CitizenSection } from './info-sections/citizen-section'
import { EventsSection } from './info-sections/events-section'
import { ResourceMarketSection } from './info-sections/resource-market-section'
import { DemandSection } from './info-sections/demand-section'
import { CityOverviewSection } from './info-sections/city-overview-section'
import { ConnectionSection } from './info-sections/connection-section'

export function InfoPanel() {
  const money = useMoney()
  const economy = useEconomy()
  const events = useEvents()
  const mapStats = useMapStats()
  const buildingEffects = useGameSelector(s => s.buildingEffects, {
    keys: ['buildingEffects'],
  })
  const map = useGameSelector(s => s.map, { keys: ['map'] })

  const counts =
    mapStats?.tileCounts ?? ({} as Partial<Record<TileType, number>>)
  const usage = mapStats?.usagePercent ?? 0
  const connectionStats = mapStats?.connectionStats ?? {
    total: 0,
    connected: 0,
    disconnected: 0,
  }

  // 按建筑分类统计数量
  const categoryCounts = useMemo(() => {
    const result: Record<BuildingCategory, number> = {
      residential: 0,
      commercial: 0,
      industrial: 0,
      service: 0,
    }
    if (!map) return result
    for (const row of map.tiles) {
      for (const tile of row) {
        const bid = getTileBuildingId(tile)
        if (bid === 'empty' || bid === 'road') continue
        const def = getBuildingDef(bid)
        if (def) result[def.category]++
      }
    }
    return result
  }, [map])

  const { satisfaction, population, populationCapacity } = economy

  return (
    <GamePanel
      className="relative h-full rounded-none overflow-y-auto"
      size="md"
    >
      <FinanceSection lastDayRevenue={economy.lastDayRevenue} money={money} />

      <GamePanelDivider />
      <CitizenSection
        population={population}
        populationCapacity={populationCapacity}
        satisfaction={satisfaction}
      />

      {events.activeEvents.length > 0 && (
        <>
          <GamePanelDivider />
          <EventsSection events={events.activeEvents} />
        </>
      )}

      <GamePanelDivider />
      <ResourceMarketSection resources={buildingEffects.resources} />

      <GamePanelDivider />
      <DemandSection demandIndicators={economy.demandIndicators} />

      <GamePanelDivider />
      <CityOverviewSection
        categoryCounts={categoryCounts}
        counts={counts}
        usage={usage}
      />

      {connectionStats.total > 0 && (
        <>
          <GamePanelDivider />
          <ConnectionSection connectionStats={connectionStats} />
        </>
      )}
    </GamePanel>
  )
}
