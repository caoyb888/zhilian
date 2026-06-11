import React, { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserPlus,
  ClipboardCheck,
  Handshake,
  TrendingUp,
  RefreshCw,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { Icon } from '@/components/Icon'
import { useAuthStore } from '@/stores/authStore'
import {
  useDashboardOverview,
  useAuditSummary,
  useMatchDetailStats,
  useMemberDetailStats,
  useMessageStats,
} from '@/services/adminDashboardService'

const REFETCH_INTERVAL = 60_000

const PIE_COLORS = [
  '#10b981', '#059669', '#047857', '#34d399', '#6ee7b7',
  '#0891b2', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc',
  '#f59e0b', '#d97706', '#f97316', '#fb923c', '#fbbf24',
  '#8b5cf6', '#7c3aed', '#a78bfa', '#ec4899', '#f43f5e',
]

function StatCard({
  label,
  value,
  sub,
  icon: IconComp,
  colorClass,
}: {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  colorClass: string
}) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-stone-800">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-stone-400">{sub}</p>}
        </div>
        <div className={`ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon icon={IconComp} size={20} />
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-sm font-semibold text-stone-700">{children}</h3>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </div>
  )
}

function LoadingChart() {
  return (
    <div className="flex h-56 items-center justify-center rounded-lg bg-stone-50">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-56 items-center justify-center rounded-lg bg-stone-50 text-sm text-stone-400">
      暂无数据
    </div>
  )
}

const formatDate = (dateStr: string) => dateStr.slice(5)

export default function AdminDashboardPage() {
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const qc = useQueryClient()

  const overview = useDashboardOverview(REFETCH_INTERVAL)
  const auditSummary = useAuditSummary(REFETCH_INTERVAL)
  const matchStats = useMatchDetailStats(REFETCH_INTERVAL)
  const memberStats = useMemberDetailStats(REFETCH_INTERVAL)
  const messageStats = useMessageStats(REFETCH_INTERVAL)

  const isAnyLoading =
    overview.isLoading ||
    auditSummary.isLoading ||
    matchStats.isLoading ||
    memberStats.isLoading ||
    messageStats.isLoading

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
  }, [qc])

  const ov = overview.data
  const ms = matchStats.data
  const mem = memberStats.data
  const audit = auditSummary.data
  const msg = messageStats.data

  return (
    <div className="flex flex-col gap-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-theme-text-main">数据看板</h1>
          <p className="mt-1 text-sm text-theme-text-muted">
            欢迎回来，{accountInfo?.realName ?? accountInfo?.username}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isAnyLoading}
          className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 shadow-card transition-colors hover:bg-stone-50 disabled:opacity-50"
        >
          <Icon icon={RefreshCw} size={13} className={isAnyLoading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* 5 个指标卡：PC 3列，手机单列 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="总会员数"
          value={ov ? ov.totalMembers.toLocaleString() : '—'}
          icon={Users}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="本月新增"
          value={ov ? ov.newMembersThisMonth.toLocaleString() : '—'}
          sub="本月新增会员"
          icon={UserPlus}
          colorClass="bg-sky-50 text-sky-600"
        />
        <StatCard
          label="待审核"
          value={ov ? ov.pendingAuditCount.toLocaleString() : '—'}
          sub="资源 + 需求"
          icon={ClipboardCheck}
          colorClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="总对接数"
          value={ov ? ov.totalMatchCount.toLocaleString() : '—'}
          icon={Handshake}
          colorClass="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="对接成功率"
          value={ov ? `${Number(ov.matchSuccessRate).toFixed(1)}%` : '—'}
          icon={TrendingUp}
          colorClass="bg-rose-50 text-rose-600"
        />
      </div>

      {/* 图表区：折线图 + 饼图 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 近30日对接趋势 */}
        <ChartCard title="近 30 日对接趋势">
          {matchStats.isLoading ? (
            <LoadingChart />
          ) : !ms?.last30DaysTrend?.length ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <LineChart data={ms.last30DaysTrend} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v) => [v, '新增对接'] as [React.ReactNode, React.ReactNode]}
                  labelFormatter={(l) => `日期：${String(l)}`}
                />
                <Line
                  type="monotone"
                  dataKey="newMatchCount"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 行业分布饼图 */}
        <ChartCard title="行业分布（TOP 20）">
          {memberStats.isLoading ? (
            <LoadingChart />
          ) : !mem?.industryDistribution?.length ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <PieChart>
                <Pie
                  data={mem.industryDistribution}
                  dataKey="count"
                  nameKey="industry"
                  cx="40%"
                  cy="50%"
                  outerRadius={80}
                  stroke="none"
                >
                  {mem.industryDistribution.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v, name) => [v, name] as [React.ReactNode, React.ReactNode]}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={10}
                  iconType="circle"
                  formatter={(value: string) =>
                    value.length > 6 ? value.slice(0, 6) + '…' : value
                  }
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* 近7日审核效率 + 消息发送统计 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 近7日审核柱状图 */}
        <ChartCard title="近 7 日审核量">
          {auditSummary.isLoading ? (
            <LoadingChart />
          ) : !audit?.last7DaysAudit?.length ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={audit.last7DaysAudit}
                margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v) => [v, '审核量'] as [React.ReactNode, React.ReactNode]}
                  labelFormatter={(l) => `日期：${String(l)}`}
                />
                <Bar dataKey="auditedCount" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {audit && (
            <div className="mt-3 flex gap-4 border-t border-stone-100 pt-3 text-xs text-stone-500">
              <span>待审资源：<span className="font-medium text-amber-600">{audit.pendingResourceCount}</span></span>
              <span>待审需求：<span className="font-medium text-amber-600">{audit.pendingDemandCount}</span></span>
              <span>合计待审：<span className="font-medium text-amber-600">{audit.totalPendingAudit}</span></span>
            </div>
          )}
        </ChartCard>

        {/* 消息发送统计 */}
        <ChartCard title="消息发送统计">
          {messageStats.isLoading ? (
            <LoadingChart />
          ) : !msg ? (
            <EmptyChart />
          ) : (
            <div className="flex flex-col gap-4">
              {(
                [
                  { label: '站内信', data: msg.site, icon: MessageSquare, color: 'bg-sky-50 text-sky-600', bar: 'bg-sky-500' },
                  { label: '微信推送', data: msg.wechat, icon: MessageSquare, color: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
                ] as const
              ).map(({ label, data, icon, color, bar }) => (
                <div key={label} className="rounded-xl border border-stone-100 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
                      <Icon icon={icon} size={14} />
                    </div>
                    <span className="text-sm font-medium text-stone-700">{label}</span>
                    <span className="ml-auto text-lg font-bold text-stone-800">
                      {Number(data.successRate).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${bar}`}
                      style={{ width: `${Math.min(Number(data.successRate), 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-stone-400">
                    <span>发送 {data.totalProcessed.toLocaleString()}</span>
                    <span className="text-emerald-600">成功 {data.successCount.toLocaleString()}</span>
                    <span className="text-red-500">失败 {data.failedCount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
