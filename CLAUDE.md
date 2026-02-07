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

City Demo —— 基于 Electron + React + TypeScript 的城市建造模拟游戏，使用 React Three Fiber 进行 3D 渲染。

```
src/main/                  # 主进程 - 应用生命周期、窗口管理
src/preload/               # 预加载脚本 - Context Bridge（window.App）
src/renderer/              # 渲染进程 - React UI + 游戏引擎
  ├── game/engine/         # 核心引擎（GameEngine, SystemRegistry, GameStateManager, GameLoop）
  ├── game/systems/        # 13 个游戏系统（实现 IGameSystem 接口）
  ├── game/scene/          # R3F 3D 场景（CityScene, TerrainGrid, Buildings, RoadNetwork 等）
  ├── game/stores/         # Zustand store（桥接 GameStateManager → R3F 组件）
  ├── game/context/        # React Context（GameEngineFacade 接口）
  ├── game/config/         # 游戏配置常量（建筑、经济、地图、时间等）
  ├── game/components/     # 游戏 UI 组件（HUD、工具栏、面板、对话框）
  ├── game/hooks/          # useGameSelector（基于 useSyncExternalStore）
  └── components/ui/       # shadcn/ui 通用组件
src/shared/types/          # 共享类型定义（core, state, economy, events 等）
```

## 架构概览

### 数据流

```
GameStateManager (pub/sub) ──subscribe──→ Zustand Store ──useFrame──→ R3F InstancedMesh
       ↑                                       ↑
  13 GameSystems                          React UI (hooks)
  (daily tick)                         (useGameSelector)
       ↑
    GameLoop (rAF → 时间累积 → tickAll)
```

- **GameStateManager** 是唯一状态源，所有游戏系统直接读写它
- **Zustand Store**（`game/stores/game-store.ts`）订阅 GameStateManager，镜像状态供 R3F 场景组件在 `useFrame` 中读取
- **React UI 组件** 通过 `useGameSelector` + `useSyncExternalStore` 直接订阅 GameStateManager
- **GameLoop** 仅负责时间推进和系统 tick，不参与渲染（R3F 自管渲染循环）

### Facade 模式

`GameEngine` 实现 `GameEngineFacade` 接口（`game/context/engine-facade.ts`），对外只暴露高层 API。React 通过 `useEngine()` 获取 Facade 实例。`GameEngine.stateManager` 和 `GameEngine.buildingSystem` 为 `readonly`，供 3D 输入层（`InputPlane`）直接访问。

### 3D 渲染层（`game/scene/`）

- **CityScene**: R3F `<Canvas>` 入口，组合所有子组件
- **TerrainGrid / Buildings / RoadNetwork**: 均使用 **InstancedMesh**，在 `useFrame` 中从 zustand store 读状态并更新实例矩阵
- **InputPlane**: 不可见地面平面，通过 raycasting 将指针事件转为网格坐标，调用 `buildingSystem.tryAction()`
- **CameraRig**: drei `MapControls`（平移/旋转/缩放）
- **HoverIndicator**: 悬停高亮（绿=可建/红=不可建），读取 `gameLoop.hoverValidity`
- **Effects**: postprocessing（Bloom + ToneMapping）

坐标转换：`gridX = Math.floor(point.x + MAP_WIDTH / 2)`，`gridY = Math.floor(point.z + MAP_HEIGHT / 2)`

### 添加新系统

1. 在 `game/systems/` 创建实现 `IGameSystem` 的类，构造函数接收 `GameStateManager`
2. 在 `GameEngine` 构造函数中实例化并 `registry.register(system)`
3. 如需参与每日 Tick，在 `setTickOrder()` 中添加 system id
4. 如需被其他系统引用，在其他系统的 `init()` 中通过 `registry.get<T>(id)` 获取
5. 如需暴露给 UI，在 `GameEngineFacade` 接口和 `GameEngine` 中添加对应方法

每日 Tick 顺序：`event → policy → facility → synergy → tech → crisis → economy → milestone`

### 添加新 3D 可视元素

1. 在 `game/scene/` 创建组件，用 `useFrame` + `useGameStore.getState()` 读状态
2. 使用 InstancedMesh 批量渲染同类对象（性能关键）
3. 在 `CityScene.tsx` 中挂载新组件
4. 颜色/高度常量复用 `game/config/building.ts` 中的 `TILE_COLORS` / `BUILDING_HEIGHTS`

## 关键类型

定义在 `src/shared/types/`：

- **TileType**: Empty, Road, Residential, Commercial, Industrial, Park, School, Hospital, FireStation, PoliceStation, PowerPlant
- **ToolType**: Select, Road, Residential, ..., Demolish, Upgrade
- **TimeSpeed**: Paused(0), Normal(1), Fast(2), Ultra(3)
- **GameState**: 完整游戏状态（map, money, time, economy, events, policies, tech 等）

## 现有游戏系统

building, road, economy, event, map, save, synergy, facility, policy, crisis, tech, specialization, milestone

## UI

- shadcn/ui 组件在 `src/renderer/components/ui/`，添加新组件：`npx shadcn@latest add <name>`
- 游戏 UI 布局（`game-layout.tsx`）：顶部 HUD、底部工具栏、左侧状态面板、右侧信息面板，均为 HTML 叠加在 R3F Canvas 上方
