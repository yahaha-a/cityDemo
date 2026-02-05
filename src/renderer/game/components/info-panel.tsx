import type { GameState } from 'shared/game-types'
import { TILE_LABELS } from '../constants'
import { TileType } from 'shared/game-types'
import type { MapSystem } from '../systems/map-system'
import type { RoadSystem } from '../systems/road-system'

interface InfoPanelProps {
  state: GameState
  mapSystem: MapSystem
  roadSystem: RoadSystem
}

export function InfoPanel({ state, mapSystem, roadSystem }: InfoPanelProps) {
  const { money, hoveredTile, map } = state
  const counts = mapSystem.countTiles()
  const usage = mapSystem.getUsagePercent()
  const connectionStats = roadSystem.getConnectionStats()

  const hoveredTileData = hoveredTile
    ? map.tiles[hoveredTile.y]?.[hoveredTile.x]
    : null

  return (
    <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg p-3 border border-gray-700 select-none min-w-[180px]">
      {/* 资金 */}
      <div className="pb-2 mb-2 border-b border-gray-700">
        <div className="text-xs text-gray-400">资金</div>
        <div className="text-xl font-bold text-green-400">
          ${money.toLocaleString()}
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
            {hoveredTileData.type !== TileType.Empty &&
              hoveredTileData.type !== TileType.Road && (
                <div
                  className={
                    hoveredTileData.connected
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {hoveredTileData.connected ? '已连接道路' : '未连接道路'}
                </div>
              )}
          </div>
        ) : (
          <div className="text-xs text-gray-500">无</div>
        )}
      </div>
    </div>
  )
}
