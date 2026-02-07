import { useState, useMemo } from 'react'
import { TileType, DemandLevel } from 'shared/types'
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
import { ProgressBar } from './ui/progress-bar'
import {
  DEMAND_TEXT_COLORS,
  satisfactionColor,
  satisfactionBarColor,
  ratioBarColor,
} from './ui/theme'
import { Coins, Users, SmilePlus, BarChart3, ChevronDown } from 'lucide-react'
import { cn } from 'renderer/lib/utils'

const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  residential: '住宅',
  commercial: '商业',
  industrial: '工业',
  service: '服务',
}

const DEMAND_LABELS: Record<DemandLevel, string> = {
  [DemandLevel.Low]: '充足',
  [DemandLevel.Balanced]: '平衡',
  [DemandLevel.High]: '紧缺',
  [DemandLevel.Critical]: '严重不足',
}

function ResourceBar({
  label,
  supply,
  demand,
  ratio,
}: {
  label: string
  supply: number
  demand: number
  ratio: number
}) {
  const pct = Math.round(ratio * 100)

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs text-[var(--game-text)]">
        <span>{label}</span>
        <span>
          {supply.toFixed(0)}/{demand.toFixed(0)} ({pct}%)
        </span>
      </div>
      <ProgressBar barColor={ratioBarColor(ratio)} percent={pct} />
    </div>
  )
}

function AccordionSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        className="w-full flex items-center justify-between text-xs text-[var(--game-text-muted)] cursor-pointer py-0.5 hover:text-[var(--game-text)] transition-colors"
        onClick={() => setOpen(prev => !prev)}
        type="button"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={cn(
            'transition-transform',
            open ? 'rotate-0' : '-rotate-90'
          )}
          size={12}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  )
}

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

  const res = buildingEffects.resources

  const { resources, satisfaction, population, populationCapacity } = economy

  const popTrend =
    satisfaction >= 50
      ? population < populationCapacity
        ? '+'
        : '='
      : population > 0
        ? '-'
        : '='

  return (
    <GamePanel
      className="relative h-full rounded-none overflow-y-auto"
      size="md"
    >
      {/* 城市财务 */}
      <AccordionSection
        defaultOpen
        icon={<Coins className="text-[var(--game-gold)]" size={14} />}
        title="城市财务"
      >
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--game-green)]">
            ${money.toLocaleString()}
          </span>
          {economy.lastDayRevenue !== 0 && (
            <span
              className={cn(
                'text-xs font-bold',
                economy.lastDayRevenue > 0
                  ? 'text-[var(--game-green)]'
                  : 'text-[var(--game-red)]'
              )}
            >
              {economy.lastDayRevenue > 0 ? '+' : ''}
              {economy.lastDayRevenue}/日
            </span>
          )}
        </div>
      </AccordionSection>

      {/* 市民状态 */}
      <GamePanelDivider />
      <AccordionSection
        defaultOpen
        icon={<Users className="text-[var(--game-text-muted)]" size={14} />}
        title="市民状态"
      >
        <div className="text-xs text-[var(--game-text)] space-y-1">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <SmilePlus size={12} />
              满意度
            </span>
            <span className={satisfactionColor(satisfaction)}>
              {Math.round(satisfaction)}%
            </span>
          </div>
          <ProgressBar
            barColor={satisfactionBarColor(satisfaction)}
            percent={Math.round(satisfaction)}
          />
          <div className="flex justify-between">
            <span>人口</span>
            <span>
              {population}/{populationCapacity}{' '}
              <span
                className={
                  popTrend === '+'
                    ? 'text-[var(--game-green)]'
                    : popTrend === '-'
                      ? 'text-[var(--game-red)]'
                      : 'text-[var(--game-text-muted)]'
                }
              >
                {popTrend}
              </span>
            </span>
          </div>
        </div>
      </AccordionSection>

      {/* 当前事件 */}
      {events.activeEvents.length > 0 && (
        <>
          <GamePanelDivider />
          <AccordionSection defaultOpen title="当前事件">
            {events.activeEvents.map(event => (
              <div
                className="text-xs text-[var(--game-blue)] mb-1"
                key={event.id}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{event.name}</span>
                  <span className="text-[var(--game-text-muted)]">
                    {event.remainingDays}天
                  </span>
                </div>
                <div className="text-[10px] text-[var(--game-text-muted)]">
                  {event.description}
                </div>
              </div>
            ))}
          </AccordionSection>
        </>
      )}

      {/* 资源市场 */}
      <GamePanelDivider />
      <AccordionSection
        icon={<BarChart3 className="text-[var(--game-text-muted)]" size={14} />}
        title="资源市场"
      >
        <div className="space-y-1.5">
          <ResourceBar
            demand={res.laborDemand}
            label="劳动力"
            ratio={res.laborFulfillment}
            supply={res.laborSupply}
          />
          <ResourceBar
            demand={res.goodsDemand}
            label="货物"
            ratio={res.goodsFulfillment}
            supply={res.goodsSupply}
          />
          <ResourceBar
            demand={res.servicesDemand}
            label="服务"
            ratio={res.servicesFulfillment}
            supply={res.servicesSupply}
          />
        </div>
      </AccordionSection>

      {/* 建设需求 */}
      <GamePanelDivider />
      <AccordionSection title="建设需求">
        <div className="text-xs text-[var(--game-text)] space-y-0.5">
          <div className="flex justify-between">
            <span>住宅</span>
            <span
              className={
                DEMAND_TEXT_COLORS[economy.demandIndicators.residential]
              }
            >
              {DEMAND_LABELS[economy.demandIndicators.residential]}
            </span>
          </div>
          <div className="flex justify-between">
            <span>商业</span>
            <span
              className={
                DEMAND_TEXT_COLORS[economy.demandIndicators.commercial]
              }
            >
              {DEMAND_LABELS[economy.demandIndicators.commercial]}
            </span>
          </div>
          <div className="flex justify-between">
            <span>工业</span>
            <span
              className={
                DEMAND_TEXT_COLORS[economy.demandIndicators.industrial]
              }
            >
              {DEMAND_LABELS[economy.demandIndicators.industrial]}
            </span>
          </div>
        </div>
      </AccordionSection>

      {/* 城市概况 */}
      <GamePanelDivider />
      <AccordionSection title="城市概况">
        <div className="text-xs text-[var(--game-text)] space-y-0.5">
          <div className="flex justify-between">
            <span>道路</span>
            <span>{counts[TileType.Road]}</span>
          </div>
          {(
            [
              'residential',
              'commercial',
              'industrial',
              'service',
            ] as BuildingCategory[]
          ).map(cat => (
            <div className="flex justify-between" key={cat}>
              <span>{CATEGORY_LABELS[cat]}</span>
              <span>{categoryCounts[cat]}</span>
            </div>
          ))}
          <GamePanelDivider className="my-1 opacity-30" />
          <div className="flex justify-between">
            <span>土地利用</span>
            <span>{usage}%</span>
          </div>
        </div>
      </AccordionSection>

      {/* 道路连接 */}
      {connectionStats.total > 0 && (
        <>
          <GamePanelDivider />
          <AccordionSection title="道路连接">
            <div className="text-xs text-[var(--game-text)] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-[var(--game-green)]">已连接</span>
                <span>{connectionStats.connected}</span>
              </div>
              {connectionStats.disconnected > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--game-red)]">未连接</span>
                  <span>{connectionStats.disconnected}</span>
                </div>
              )}
            </div>
          </AccordionSection>
        </>
      )}
    </GamePanel>
  )
}
