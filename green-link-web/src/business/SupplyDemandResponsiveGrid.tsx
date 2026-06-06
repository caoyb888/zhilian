import { Building2, Sprout } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { useTheme } from '@/hooks/useTheme'

export interface GridItem {
  id: string | number
  category?: string
  creditScore?: number | string
  title: string
  company: string
  badges?: string[]
  value?: string
}

interface SupplyDemandResponsiveGridProps {
  items?: GridItem[]
  onActionClick?: (item: GridItem) => void
}

/**
 * 绿产智链 - 响应式多风格供需卡片网格组件
 *
 * Mobile First 响应式断点：
 * - 默认 (<768px): 1 列，适配手机 H5 / 微信服务号内嵌页
 * - md (≥768px): 2 列，适配平板
 * - lg (≥1024px): 3 列，适配笔记本
 * - xl (≥1280px): 4 列，适配桌面宽屏
 */
export function SupplyDemandResponsiveGrid({
  items = [],
  onActionClick,
}: SupplyDemandResponsiveGridProps) {
  const { theme } = useTheme()

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {items.map((data) => (
          <div
            key={data.id}
            className={`flex flex-col justify-between ${theme.card}`}
          >
            {/* 卡片头部：分类与信用度 */}
            <div>
              <div className="flex justify-between items-center gap-2 mb-3">
                <span className={theme.badge}>
                  {data.category || '双碳资产'}
                </span>
                {data.creditScore !== undefined && (
                  <span className={theme.textMuted}>
                    信用分:{" "}
                    <span className={theme.accentText}>
                      {data.creditScore}
                    </span>
                  </span>
                )}
              </div>

              {/* 标题（限制双行） */}
              <h3
                className={`text-sm leading-snug tracking-wide line-clamp-2 mb-2 ${theme.textMain}`}
              >
                {data.title}
              </h3>

              {/* 发布单位 */}
              <p className={`mb-3 truncate ${theme.textMuted}`}>
                <span className="inline-flex items-center gap-1"><Icon icon={Building2} size={14} />{data.company}</span>
              </p>

              {/* 绿色低碳资质标签 */}
              {data.badges && data.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {data.badges.map((badgeText) => (
                    <span
                      key={badgeText}
                      className="text-[9px] bg-emerald-500/5 text-emerald-600 border border-emerald-500/15 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5"
                    >
                      <span className="inline-flex items-center gap-0.5"><Icon icon={Sprout} size={12} />{badgeText}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 卡片尾部：数据要素 + 对接动作 */}
            <div
              className={`pt-3.5 mt-2 border-t flex items-center justify-between ${theme.divider}`}
            >
              <div>
                <span
                  className={`block scale-90 origin-left opacity-75 ${theme.textMuted}`}
                >
                  要素规模/意向金额
                </span>
                <span
                  className={`text-xs font-bold font-mono ${theme.accentText}`}
                >
                  {data.value || '结构化面议'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onActionClick?.(data)}
                className={`text-xs py-1.5 px-3.5 font-semibold transition-all ${theme.primaryBtn}`}
              >
                对接申请
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
