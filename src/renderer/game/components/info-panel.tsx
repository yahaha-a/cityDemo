import { useState } from 'react'
import { TILE_LABELS, BUILDING_COSTS } from '../constants'
import { TileType, DemandLevel } from 'shared/game-types'
import { useEngine } from '../context/game-engine-context'
import { useMoney, useEconomy, useEvents } from '../hooks/use-game-selector'
import { GamePanel, GamePanelHeader, GamePanelDivider } from './ui/game-panel'
import { ProgressBar } from './ui/progress-bar'
import {
  DEMAND_TEXT_COLORS,
  satisfactionColor,
  satisfactionBarColor,
  ratioBarColor,
} from './ui/theme'
import { Coins, Users, SmilePlus, BarChart3, ChevronDown } from 'lucide-react'
import { cn } from 'renderer/lib/utils'

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
  const engine = useEngine()
  const money = useMoney()
  const economy = useEconomy()
  const events = useEvents()

  const counts = engine.mapSystem.countTiles()
  const usage = engine.mapSystem.getUsagePercent()
  const connectionStats = engine.roadSystem.getConnectionStats()

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
            demand={resources.labor.demand}
            label="劳动力"
            ratio={resources.labor.ratio}
            supply={resources.labor.supply}
          />
          <ResourceBar
            demand={resources.goods.demand}
            label="货物"
            ratio={resources.goods.ratio}
            supply={resources.goods.supply}
          />
          <ResourceBar
            demand={resources.services.demand}
            label="服务"
            ratio={resources.services.ratio}
            supply={resources.services.supply}
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
          <div className="flex justify-between">
            <span>住宅</span>
            <span>{counts[TileType.Residential]}</span>
          </div>
          <div className="flex justify-between">
            <span>商业</span>
            <span>{counts[TileType.Commercial]}</span>
          </div>
          <div className="flex justify-between">
            <span>工业</span>
            <span>{counts[TileType.Industrial]}</span>
          </div>
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
