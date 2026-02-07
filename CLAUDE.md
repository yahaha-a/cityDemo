# CLAUDE.md

## 命令

```bash
pnpm dev              # 启动开发服务器（含热重载）
pnpm build            # 构建可分发应用
pnpm lint             # 代码检查（Biome）
pnpm lint:fix         # 自动修复 lint 问题
pnpm typecheck        # TypeScript 类型检查
```

## 代码规范

Biome（配置在 `biome.json`）：单引号、无分号、2 空格缩进、80 字符行宽、trailing commas (es5)。

## 项目结构

City Demo —— 基于 Electron + React + TypeScript 的城市建造模拟游戏。

```
src/main/                  # 主进程 - 应用生命周期、窗口管理
src/preload/               # 预加载脚本 - Context Bridge（window.App）
src/renderer/              # 渲染进程 - React UI + 游戏引擎
  ├── game/engine/         # 核心引擎（GameEngine, SystemRegistry, GameStateManager, GameLoop）
  ├── game/systems/        # 13 个游戏系统（实现 IGameSystem 接口）
  ├── game/renderer/       # 等距 2D Canvas 渲染器
  ├── game/input/          # 输入处理 + 坐标转换（等距投影）
  ├── game/context/        # React Context（GameEngineFacade 接口）
  ├── game/config/         # 游戏配置常量（建筑、经济、地图、时间等）
  ├── game/components/     # 游戏 UI 组件（HUD、工具栏、面板、对话框）
  ├── game/hooks/          # useGameSelector（基于 useSyncExternalStore）
  └── components/ui/       # shadcn/ui 通用组件
src/shared/types/          # 共享类型定义（core, state, economy, events 等）
src/lib/electron-app/      # Electron 工厂模式（窗口创建、IPC 注册、应用生命周期）
```

## 游戏引擎架构

### Facade 模式

`GameEngine` 实现 `GameEngineFacade` 接口（定义在 `game/context/engine-facade.ts`），对 React 组件只暴露高层 API（setTool, togglePolicy 等），隐藏内部系统细节。React 通过 `GameEngineProvider` + `useEngine()` 获取 Facade 实例。

### SystemRegistry

所有游戏系统实现 `IGameSystem` 接口，注册到 `SystemRegistry`：

```typescript
interface IGameSystem {
  readonly id: string
  init?(registry: SystemRegistry): void      // 解析跨系统依赖
  processDailyTick?(): void                  // 每日逻辑
  dispose?(): void                           // 清理
}
```

每日 Tick 顺序：`event → policy → facility → synergy → tech → crisis → economy → milestone`

### 添加新系统

1. 在 `game/systems/` 创建实现 `IGameSystem` 的类，构造函数接收 `GameStateManager`
2. 在 `GameEngine` 构造函数中实例化并 `registry.register(system)`
3. 如需参与每日 Tick，在 `setTickOrder()` 调用中添加 system id
4. 如需被其他系统引用，在其他系统的 `init()` 中通过 `registry.get<T>(id)` 获取
5. 如需暴露给 UI，在 `GameEngineFacade` 接口和 `GameEngine` 中添加对应方法

### 状态管理

`GameStateManager`（`game/engine/game-state.ts`）实现发布/订阅模式，兼容 React `useSyncExternalStore`。支持 `subscribeKeys()` 按 key 精确订阅以减少重渲染，支持 `batch()` 合并多次更新。

组件中使用：
```typescript
const value = useGameSelector(engine, (state) => state.money, ['money'])
```

### 游戏循环

`GameLoop` 基于 `requestAnimationFrame`，累积帧时间转换为游戏天数。每经过一天调用 `registry.tickAll()`。Crisis 挂起时暂停时间推进。

## 渲染与输入

- **等距投影**: 2:1 比例（TILE_WIDTH=64, TILE_HEIGHT=32），坐标转换在 `game/input/coordinate-utils.ts`
- **地图**: 64×64 网格，Perlin 噪声地形生成（Plain, Hill, Water, Fertile, Rocky）
- **渲染**: 后到前深度排序，仅渲染可见区域，支持 0.25x-2.0x 缩放

## 现有游戏系统

building, road, economy, event, map, save, synergy, facility, policy, crisis, tech, specialization, milestone

## 关键类型

定义在 `src/shared/types/`：

- **TileType**: Empty, Road, Residential, Commercial, Industrial, Park, School, Hospital, FireStation, PoliceStation, PowerPlant
- **ToolType**: Select, Road, Residential, ..., Demolish, Upgrade
- **TimeSpeed**: Paused(0), Normal(1), Fast(2), Ultra(3)
- **GameState**: 完整游戏状态（map, money, time, economy, events, policies, tech 等），`_derived` 缓存计算结果

## Electron 层

- **窗口创建**: 工厂模式 `src/lib/electron-app/factories/windows/create.ts`
- **IPC**: `src/preload/index.ts` 通过 contextBridge 暴露 `window.App`（quit, username 等）
- **路由**: electron-router-dom，配置在 `src/renderer/routes.tsx`
- **主窗口**: 1280×720，无边框，不可调整大小

## UI

- shadcn/ui 组件在 `src/renderer/components/ui/`，添加新组件：`npx shadcn@latest add <name>`
- 游戏 UI 布局（`game-layout.tsx`）：顶部 HUD、底部工具栏、左侧状态面板、右侧信息面板、中央 Canvas
