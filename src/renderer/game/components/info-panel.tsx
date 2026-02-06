import {
  TILE_LABELS,
  TERRAIN_LABELS,
  TERRAIN_BUILD_COST_MULTIPLIER,
  BUILDING_COSTS,
  UPGRADE_COST_MULTIPLIER,
  MAX_BUILDING_LEVEL,
} from '../constants'
import { TileType, TerrainType, DemandLevel } from 'shared/game-types'
import { useEngine } from '../context/game-engine-context'
import {
  useMoney,
  useHoveredTile,
  useMap,
  useEconomy,
  useEvents,
} from '../hooks/use-game-selector'
import { GamePanel } from './ui/game-panel'
import { ProgressBar } from './ui/progress-bar'
import {
  DEMAND_TEXT_COLORS,
  satisfactionColor,
  satisfactionBarColor,
  ratioBarColor,
} from './ui/theme'

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
      <div className="flex justify-between text-xs text-gray-300">
        <span>{label}</span>
        <span>
          {supply.toFixed(0)}/{demand.toFixed(0)} ({pct}%)
        </span>
      </div>
      <ProgressBar barColor={ratioBarColor(ratio)} percent={pct} />
    </div>
  )
}

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

export function InfoPanel() {
  const engine = useEngine()
  const money = useMoney()
  const hoveredTile = useHoveredTile()
  const map = useMap()
  const economy = useEconomy()
  const events = useEvents()

  const counts = engine.mapSystem.countTiles()
  const usage = engine.mapSystem.getUsagePercent()
  const connectionStats = engine.roadSystem.getConnectionStats()

  const hoveredTileData = hoveredTile
    ? map.tiles[hoveredTile.y]?.[hoveredTile.x]
    : null

  const {
    resources,
    satisfaction,
    population,
    populationCapacity,
    efficiencyByType,
  } = economy

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
      className="min-w-[200px] max-h-[calc(100vh-2rem)] overflow-y-auto"
      position="top-right"
    >
      {/* 资金 */}
      <div className="pb-2 mb-2 border-b border-gray-700">
        <div className="text-xs text-gray-400">资金</div>
        <div className="text-xl font-bold text-green-400">
          ${money.toLocaleString()}
        </div>
      </div>

      {/* 当前事件 */}
      {events.activeEvents.length > 0 && (
        <div className="pb-2 mb-2 border-b border-gray-700">
          <div className="text-xs text-gray-400 mb-1">当前事件</div>
          {events.activeEvents.map(event => (
            <div className="text-xs text-blue-300 mb-1" key={event.id}>
              <div className="flex justify-between">
                <span className="font-medium">{event.name}</span>
                <span className="text-gray-500">{event.remainingDays}天</span>
              </div>
              <div className="text-[10px] text-gray-400">
                {event.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 满意度 & 人口 */}
      <div className="pb-2 mb-2 border-b border-gray-700">
        <div className="text-xs text-gray-400 mb-1">市民状态</div>
        <div className="text-xs text-gray-300 space-y-1">
          <div className="flex justify-between items-center">
            <span>满意度</span>
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
                    ? 'text-green-400'
                    : popTrend === '-'
                      ? 'text-red-400'
                      : 'text-gray-500'
                }
              >
                {popTrend}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 资源市场 */}
      <div className="pb-2 mb-2 border-b border-gray-700">
        <div className="text-xs text-gray-400 mb-1">资源市场</div>
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
      </div>

      {/* 建设建议 */}
      <div className="pb-2 mb-2 border-b border-gray-700">
        <div className="text-xs text-gray-400 mb-1">建设需求</div>
        <div className="text-xs text-gray-300 space-y-0.5">
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
      </div>

      {/* 地图统计 */}
      <div className="pb-2 mb-2 border-b border-gray-700">
        <div className="text-xs text-gray-400 mb-1">城市概况</div>
        <div className="text-xs text-gray-300 space-y-0.5">
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
          <div className="flex justify-between pt-1 border-t border-gray-700/50">
            <span>土地利用</span>
            <span>{usage}%</span>
          </div>
        </div>
      </div>

      {/* 道路连接 */}
      {connectionStats.total > 0 && (
        <div className="pb-2 mb-2 border-b border-gray-700">
          <div className="text-xs text-gray-400 mb-1">道路连接</div>
          <div className="text-xs text-gray-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-green-400">已连接</span>
              <span>{connectionStats.connected}</span>
            </div>
            {connectionStats.disconnected > 0 && (
              <div className="flex justify-between">
                <span className="text-red-400">未连接</span>
                <span>{connectionStats.disconnected}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 悬停信息 */}
      <div>
        <div className="text-xs text-gray-400 mb-1">当前位置</div>
        {hoveredTile && hoveredTileData ? (
          <div className="text-xs text-gray-300">
            <div>
              坐标: ({hoveredTile.x}, {hoveredTile.y})
            </div>
            <div>类型: {TILE_LABELS[hoveredTileData.type]}</div>
            <div className="text-gray-400">
              地形: {TERRAIN_LABELS[hoveredTileData.terrain]}
            </div>
            {terrainEffectText(hoveredTileData.terrain) && (
              <div className="text-yellow-400 text-[10px]">
                {terrainEffectText(hoveredTileData.terrain)}
              </div>
            )}
            {hoveredTileData.type !== TileType.Empty &&
              hoveredTileData.type !== TileType.Road && (
                <>
                  <div className="text-gray-400">
                    等级: Lv{hoveredTileData.level}
                  </div>
                  <div
                    className={
                      hoveredTileData.connected
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {hoveredTileData.connected ? '已连接道路' : '未连接道路'}
                  </div>
                  {hoveredTileData.connected && (
                    <div className="text-gray-400">
                      效率:{' '}
                      {Math.round(
                        (hoveredTileData.type === TileType.Residential
                          ? efficiencyByType.residential
                          : hoveredTileData.type === TileType.Commercial
                            ? efficiencyByType.commercial
                            : efficiencyByType.industrial) * 100
                      )}
                      %
                    </div>
                  )}
                  {hoveredTileData.level < MAX_BUILDING_LEVEL && (
                    <div className="text-gray-500 text-[10px]">
                      升级费用: $
                      {Math.ceil(
                        (BUILDING_COSTS[
                          hoveredTileData.type as keyof typeof BUILDING_COSTS
                        ] ?? 0) *
                          (Number.isFinite(
                            TERRAIN_BUILD_COST_MULTIPLIER[
                              hoveredTileData.terrain
                            ]
                          )
                            ? TERRAIN_BUILD_COST_MULTIPLIER[
                                hoveredTileData.terrain
                              ]
                            : 1) *
                          UPGRADE_COST_MULTIPLIER[hoveredTileData.level]
                      )}
                    </div>
                  )}
                </>
              )}
          </div>
        ) : (
          <div className="text-xs text-gray-500">无</div>
        )}
      </div>
    </GamePanel>
  )
}
