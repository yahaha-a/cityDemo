# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

City Demo 是一个基于 Electron + React + TypeScript 的跨平台桌面应用模板。

## 常用命令

```bash
pnpm dev              # 启动开发服务器（含热重载）
pnpm build            # 构建可分发应用
pnpm lint             # 代码检查
pnpm lint:fix         # 自动修复 lint 问题
pnpm typecheck        # TypeScript 类型检查
```

## 技术栈

- **运行时**: Electron 39 + Node 22
- **UI**: React 19 + React Router 7
- **样式**: TailwindCSS 4 + shadcn/ui
- **构建**: electron-vite + Vite 7
- **代码规范**: Biome (取代 ESLint + Prettier)
- **包管理**: pnpm 10

## 架构

### 三进程模型

```
src/main/          # 主进程 - 应用生命周期、窗口管理、原生 API
src/preload/       # 预加载脚本 - Context Bridge 安全桥接
src/renderer/      # 渲染进程 - React UI 层
src/shared/        # 共享代码 - 类型定义、常量、工具函数
src/lib/           # 库函数 - Electron 应用核心逻辑和发布工具
```

### 关键模式

**窗口创建**: 使用工厂模式 `src/lib/electron-app/factories/windows/create.ts`

**IPC 通信**: 通过 Context Bridge 暴露 API (`src/preload/index.ts`)，渲染进程通过 `window.App` 访问

**路由**: 使用 electron-router-dom，配置在 `src/lib/electron-router-dom.ts`，支持多窗口路由

**平台兼容**: `src/shared/constants.ts` 中的 `PLATFORM` 对象处理跨平台逻辑

### UI 组件

使用 shadcn/ui 组件库，组件位于 `src/renderer/components/ui/`。添加新组件:
```bash
npx shadcn@latest add <component-name>
```

## 代码规范

- 使用 Biome 进行格式化和 lint，配置在 `biome.json`
- 单引号、2 空格缩进、80 字符行宽
- 保存时自动格式化（VSCode 配置已就绪）

## 构建输出

- 开发构建: `node_modules/.dev/`
- 生产构建: `dist/`
