import { useEngine } from '../../context/game-engine-context'
import {
  useEconomy,
  useMoney,
  useTimeState,
  useMilestones,
  useTechState,
  usePolicies,
  useSpecialization,
} from '../../hooks/use-game-selector'
import { MILESTONES } from '../../config/milestones'
import { TECH_TREE } from '../../config/tech'
import { TILE_LABELS } from '../../config/ui'
import { TileType } from 'shared/game-types'
import { GameButton } from '../ui/game-button'
import { GamePanelDivider } from '../ui/game-panel'
import { ProgressBar } from '../ui/progress-bar'
import { satisfactionColor, satisfactionBarColor } from '../ui/theme'

interface MenuStatsViewProps {
  onBack: () => void
}

function StatRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string | number
  valueClass?: string
}) {
  return (
    <div className="flex justify-between text-xs text-[var(--game-text)]">
      <span>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}

const BUILDING_TYPES = [
  TileType.Road,
  TileType.Residential,
  TileType.Commercial,
  TileType.Industrial,
  TileType.Park,
  TileType.School,
  TileType.Hospital,
  TileType.FireStation,
  TileType.PoliceStation,
  TileType.PowerPlant,
] as const

export function MenuStatsView({ onBack }: MenuStatsViewProps) {
  const engine = useEngine()
  const money = useMoney()
  const economy = useEconomy()
  const time = useTimeState()
  const milestones = useMilestones()
  const tech = useTechState()
  const policies = usePolicies()
  const specialization = useSpecialization()

  const counts = engine.mapSystem.countTiles()
  const usage = engine.mapSystem.getUsagePercent()

  const { satisfaction, population, populationCapacity, lastDayRevenue } =
    economy

  return (
    <div className="p-3 max-h-[60vh] overflow-y-auto space-y-1">
      {/* 城市概览 */}
      <div className="text-xs font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] mb-1">
        城市概览
      </div>
      <StatRow label="天数" value={`第 ${time.day} 天`} />
      <StatRow
        label="资金"
        value={`$${money.toLocaleString()}`}
        valueClass="text-[var(--game-green)]"
      />
      <StatRow
        label="每日收支"
        value={`${lastDayRevenue >= 0 ? '+' : ''}${lastDayRevenue}/日`}
        valueClass={
          lastDayRevenue >= 0
            ? 'text-[var(--game-green)]'
            : 'text-[var(--game-red)]'
        }
      />

      <GamePanelDivider />

      {/* 人口与满意度 */}
      <div className="text-xs font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] mb-1">
        人口与满意度
      </div>
      <StatRow
        label="人口 / 容量"
        value={`${population} / ${populationCapacity}`}
      />
      <div className="space-y-0.5">
        <div className="flex justify-between text-xs text-[var(--game-text)]">
          <span>满意度</span>
          <span className={satisfactionColor(satisfaction)}>
            {Math.round(satisfaction)}%
          </span>
        </div>
        <ProgressBar
          barColor={satisfactionBarColor(satisfaction)}
          percent={Math.round(satisfaction)}
        />
      </div>
      <StatRow
        label="满意度连续天数"
        value={`${milestones.satisfactionStreak} 天`}
      />

      <GamePanelDivider />

      {/* 建筑统计 */}
      <div className="text-xs font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] mb-1">
        建筑统计
      </div>
      {BUILDING_TYPES.map(type => {
        const count = counts[type] ?? 0
        if (count === 0) return null
        return <StatRow key={type} label={TILE_LABELS[type]} value={count} />
      })}
      <StatRow label="土地利用率" value={`${usage}%`} />

      <GamePanelDivider />

      {/* 科技与政策 */}
      <div className="text-xs font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] mb-1">
        科技与政策
      </div>
      <StatRow
        label="已研究科技"
        value={`${tech.researched.length} / ${TECH_TREE.length}`}
      />
      <StatRow label="每日研究点" value={tech.dailyRP} />
      <StatRow label="活跃政策" value={policies.activePolicies.length} />
      {specialization.chosen && (
        <StatRow label="城市特色" value={specialization.chosen} />
      )}

      <GamePanelDivider />

      {/* 里程碑 */}
      <div className="text-xs font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] mb-1">
        里程碑
      </div>
      <StatRow
        label="已达成"
        value={`${milestones.achieved.length} / ${MILESTONES.length}`}
      />
      <StatRow
        label="累计收入"
        value={`$${milestones.cumulativeIncome.toLocaleString()}`}
      />

      <GameButton
        className="w-full mt-3"
        intent="secondary"
        onClick={onBack}
        variant="action"
      >
        返回
      </GameButton>
    </div>
  )
}
