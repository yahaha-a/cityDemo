/**
 * 游戏系统标准接口
 */
export interface IGameSystem {
  readonly id: string
  /** 注册后解析跨系统依赖 */
  init?(registry: SystemRegistry): void
  /** 每日循环处理 */
  processDailyTick?(): void
  /** 释放资源 */
  dispose?(): void
}

/**
 * 系统注册表 — 标准化系统生命周期管理
 */
export class SystemRegistry {
  private systems = new Map<string, IGameSystem>()
  private tickOrder: string[] = []

  /** 注册系统 */
  register(system: IGameSystem): void {
    if (this.systems.has(system.id)) {
      throw new Error(`System "${system.id}" already registered`)
    }
    this.systems.set(system.id, system)
  }

  /** 定义每日处理顺序 */
  setTickOrder(ids: string[]): void {
    for (const id of ids) {
      if (!this.systems.has(id)) {
        console.warn(`[SystemRegistry] tickOrder 中的系统 "${id}" 未注册`)
      }
    }
    this.tickOrder = ids
  }

  /** 类型安全的系统获取 */
  get<T extends IGameSystem>(id: string): T {
    const system = this.systems.get(id)
    if (!system) {
      throw new Error(`System "${id}" not found`)
    }
    return system as T
  }

  /** 初始化所有系统（按注册顺序） */
  initAll(): void {
    for (const system of this.systems.values()) {
      try {
        system.init?.(this)
      } catch (err) {
        console.error(
          `[SystemRegistry] System "${system.id}" init failed:`,
          err
        )
        throw err
      }
    }
  }

  /** 按 tickOrder 顺序执行 processDailyTick */
  tickAll(): void {
    for (const id of this.tickOrder) {
      const system = this.systems.get(id)
      try {
        system?.processDailyTick?.()
      } catch (err) {
        console.error(`[SystemRegistry] System "${id}" tick failed:`, err)
      }
    }
  }

  /** 释放所有系统资源（按注册逆序） */
  disposeAll(): void {
    const entries = [...this.systems.values()].reverse()
    for (const system of entries) {
      try {
        system.dispose?.()
      } catch (err) {
        console.error(
          `[SystemRegistry] System "${system.id}" dispose failed:`,
          err
        )
      }
    }
  }
}
