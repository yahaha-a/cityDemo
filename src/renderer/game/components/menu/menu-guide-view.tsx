import { useState } from 'react'
import { GameButton } from '../ui/game-button'

interface MenuGuideViewProps {
  onBack: () => void
}

type GuideTab = 'shortcuts' | 'guide'

const SHORTCUT_GROUPS = [
  {
    title: '相机控制',
    items: [
      { keys: ['W', 'A', 'S', 'D'], desc: '平移视角' },
      { keys: ['滚轮'], desc: '缩放视角' },
    ],
  },
  {
    title: '鼠标操作',
    items: [
      { keys: ['左键'], desc: '放置建筑 / 选择' },
      { keys: ['右键'], desc: '取消当前工具' },
      { keys: ['左键拖拽'], desc: '连续放置道路' },
    ],
  },
  {
    title: '其他',
    items: [
      { keys: ['Esc'], desc: '打开/关闭菜单' },
      { keys: ['Space'], desc: '暂停/继续' },
      { keys: ['1', '2', '3'], desc: '调节游戏速度' },
    ],
  },
]

const GUIDE_SECTIONS = [
  {
    title: '基础建设',
    content:
      '修建道路连接各个建筑，住宅区提供人口，商业区和工业区创造收入。建筑必须与道路相连才能正常运作。',
  },
  {
    title: '经济管理',
    content:
      '关注每日收支平衡，通过发展商业和工业增加收入。公共设施（学校、医院等）需要维护费用，但能提升满意度。',
  },
  {
    title: '市民满意度',
    content:
      '满意度影响人口增长。提供充足的公共服务、平衡资源供需、建设公园都能提升满意度。满意度持续达标可解锁里程碑。',
  },
  {
    title: '科技研发',
    content:
      '每日自动积累研究点(RP)，投入研究可解锁新建筑类型、政策和城市特色。合理规划科技路线能加速发展。',
  },
  {
    title: '政策系统',
    content:
      '通过研究科技解锁政策选项。不同政策有不同效果，部分政策互斥。可根据当前发展需要灵活调整。',
  },
]

export function MenuGuideView({ onBack }: MenuGuideViewProps) {
  const [tab, setTab] = useState<GuideTab>('shortcuts')

  return (
    <div className="p-3">
      {/* Tab 切换 */}
      <div className="flex gap-1 mb-3">
        <GameButton
          className="flex-1 text-xs"
          intent={tab === 'shortcuts' ? 'active' : 'ghost'}
          onClick={() => setTab('shortcuts')}
          variant="toggle"
        >
          键盘快捷键
        </GameButton>
        <GameButton
          className="flex-1 text-xs"
          intent={tab === 'guide' ? 'active' : 'ghost'}
          onClick={() => setTab('guide')}
          variant="toggle"
        >
          游戏指南
        </GameButton>
      </div>

      <div className="max-h-[50vh] overflow-y-auto">
        {tab === 'shortcuts' && (
          <div className="space-y-3">
            {SHORTCUT_GROUPS.map(group => (
              <div key={group.title}>
                <div className="text-xs font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] mb-1.5">
                  {group.title}
                </div>
                <div className="space-y-1.5">
                  {group.items.map(item => (
                    <div
                      className="flex items-center justify-between text-xs text-[var(--game-text)]"
                      key={item.desc}
                    >
                      <div className="flex gap-1">
                        {item.keys.map(key => (
                          <kbd
                            className="bg-[var(--game-parchment-dark)] border border-[var(--game-wood)]/40 rounded px-1.5 py-0.5 font-mono text-[10px] text-[var(--game-text-heading)]"
                            key={key}
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                      <span className="text-[var(--game-text-muted)]">
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'guide' && (
          <div className="space-y-3">
            {GUIDE_SECTIONS.map(section => (
              <div key={section.title}>
                <div className="text-xs font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] mb-1">
                  {section.title}
                </div>
                <p className="text-xs text-[var(--game-text)] leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

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
