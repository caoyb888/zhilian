import { useState, useEffect } from 'react'
import { Users, FileText, CheckSquare, BarChart3 } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { useAuthStore } from '@/stores/authStore'

const METRICS = [
  { label: '会员总数', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
  { label: '待审核', icon: CheckSquare, color: 'bg-amber-50 text-amber-600' },
  { label: '文章总数', icon: FileText, color: 'bg-sky-50 text-sky-600' },
  { label: '活动总数', icon: BarChart3, color: 'bg-violet-50 text-violet-600' },
]

export default function AdminDashboardPage() {
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const [pulse, setPulse] = useState(true)

  // Auto-refresh pulse indicator cycle
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-theme-text-main">控制台</h1>
          <p className="mt-1 text-sm text-theme-text-muted">
            欢迎回来，{accountInfo?.realName ?? accountInfo?.username}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              'inline-block h-2 w-2 rounded-full transition-colors duration-1000 ' +
              (pulse ? 'bg-emerald-500' : 'bg-emerald-300')
            }
          />
          <span className="text-xs text-stone-400">实时数据</span>
        </div>
      </div>

      {/* metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-stone-100 bg-white p-5 shadow-nordic transition-all duration-200 hover:shadow-card-hover"
          >
            <div className="flex items-center gap-3">
              <div className={
                'flex h-10 w-10 items-center justify-center rounded-lg ' + m.color
              }>
                <Icon icon={m.icon} size={20} />
              </div>
              <div>
                <p className="text-sm text-stone-500">{m.label}</p>
                <p className="mt-0.5 text-2xl font-bold text-stone-800">—</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* charts placeholder */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-stone-700">会员增长趋势</h3>
          <div className="flex h-64 items-center justify-center rounded-lg bg-stone-50 text-sm text-stone-400">
            图表区域（Recharts）
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-stone-700">内容发布统计</h3>
          <div className="flex h-64 items-center justify-center rounded-lg bg-stone-50 text-sm text-stone-400">
            图表区域（Recharts）
          </div>
        </div>
      </div>
    </div>
  )
}
