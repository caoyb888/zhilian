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

// Shared dark card base
const CARD_BASE =
  'rounded-xl border border-slate-800/70 bg-slate-900/80 transition-all duration-200'

function StatCard({
  label,
  value,
  sub,
  icon: IconComp,
  iconBg,
  iconColor,
  glowColor,
}: {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  glowColor: string
}) {
  return (
    <div
      className={`${CARD_BASE} group relative overflow-hidden p-5 hover:border-slate-700`}
      style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.3)' }}
    >
      {/* Subtle corner glow */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glowColor }}
      />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-100">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] text-slate-600">{sub}</p>}
        </div>
        <div
          className={`ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} border`}
          style={{ borderColor: `${iconColor}20` }}
        >
          <Icon icon={IconComp} size={18} className={iconColor} />
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
      <span className="h-px flex-1 bg-slate-800" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-slate-800" />
    </h3>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className={`${CARD_BASE} p-5`}
      style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.3)' }}
    >
      <p className="mb-4 text-[13px] font-semibold text-slate-300">{title}</p>
      {children}
    </div>
  )
}

function LoadingChart() {
  return (
    <div className="flex h-56 items-center justify-center rounded-lg bg-slate-800/40">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-56 items-center justify-center rounded-lg bg-slate-800/30 text-sm text-slate-600">
      暂无数据
    </div>
  )
}

const CHART_STYLE = {
  grid: '#1e2d45',
  tick: '#475569',
  tooltip: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 8,
    fontSize: 12,
    color: '#cbd5e1',
  },
}

const formatDate = (dateStr: string) => dateStr.slice(5)

export default function AdminDashboardPage() {
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const qc = useQueryClient()

  const overview    = useDashboardOverview(REFETCH_INTERVAL)
  const auditSummary = useAuditSummary(REFETCH_INTERVAL)
  const matchStats   = useMatchDetailStats(REFETCH_INTERVAL)
  const memberStats  = useMemberDetailStats(REFETCH_INTERVAL)
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

  const ov    = overview.data
  const ms    = matchStats.data
  const mem   = memberStats.data
  const audit = auditSummary.data
  const msg   = messageStats.data

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">数据看板</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            欢迎回来，
            <span className="text-emerald-400">
              {accountInfo?.realName ?? accountInfo?.username}
            </span>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isAnyLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-400 transition-all hover:border-emerald-500/30 hover:text-slate-200 disabled:opacity-40"
        >
          <Icon icon={RefreshCw} size={12} className={isAnyLoading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* ── 5 KPI cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="总会员数"
          value={ov ? ov.totalMembers.toLocaleString() : '—'}
          icon={Users}
          iconBg="bg-emerald-950/60"
          iconColor="text-emerald-400"
          glowColor="rgba(16,185,129,0.25)"
        />
        <StatCard
          label="本月新增"
          value={ov ? ov.newMembersThisMonth.toLocaleString() : '—'}
          sub="本月新增会员"
          icon={UserPlus}
          iconBg="bg-sky-950/60"
          iconColor="text-sky-400"
          glowColor="rgba(56,189,248,0.25)"
        />
        <StatCard
          label="待审核"
          value={ov ? ov.pendingAuditCount.toLocaleString() : '—'}
          sub="资源 + 需求"
          icon={ClipboardCheck}
          iconBg="bg-amber-950/60"
          iconColor="text-amber-400"
          glowColor="rgba(245,158,11,0.25)"
        />
        <StatCard
          label="总对接数"
          value={ov ? ov.totalMatchCount.toLocaleString() : '—'}
          icon={Handshake}
          iconBg="bg-violet-950/60"
          iconColor="text-violet-400"
          glowColor="rgba(167,139,250,0.25)"
        />
        <StatCard
          label="对接成功率"
          value={ov ? `${Number(ov.matchSuccessRate).toFixed(1)}%` : '—'}
          icon={TrendingUp}
          iconBg="bg-rose-950/60"
          iconColor="text-rose-400"
          glowColor="rgba(244,63,94,0.25)"
        />
      </div>

      {/* ── Charts row 1: line + pie ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <ChartCard title="近 30 日对接趋势">
          {matchStats.isLoading ? (
            <LoadingChart />
          ) : !ms?.last30DaysTrend?.length ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <LineChart
                data={ms.last30DaysTrend}
                margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: CHART_STYLE.tick }}
                  interval={4}
                  axisLine={{ stroke: CHART_STYLE.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CHART_STYLE.tick }}
                  allowDecimals={false}
                  axisLine={{ stroke: CHART_STYLE.grid }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={CHART_STYLE.tooltip}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v) => [v, '新增对接'] as [React.ReactNode, React.ReactNode]}
                  labelFormatter={(l) => `日期：${String(l)}`}
                />
                <Line
                  type="monotone"
                  dataKey="newMatchCount"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

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
                  contentStyle={CHART_STYLE.tooltip}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v, name) => [v, name] as [React.ReactNode, React.ReactNode]}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={8}
                  iconType="circle"
                  formatter={(value: string) =>
                    value.length > 6 ? value.slice(0, 6) + '…' : value
                  }
                  wrapperStyle={{ fontSize: 11, color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>

      {/* ── Charts row 2: bar + message stats ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <ChartCard title="近 7 日审核量">
          {auditSummary.isLoading ? (
            <LoadingChart />
          ) : !audit?.last7DaysAudit?.length ? (
            <EmptyChart />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={audit.last7DaysAudit}
                  margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: CHART_STYLE.tick }}
                    axisLine={{ stroke: CHART_STYLE.grid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: CHART_STYLE.tick }}
                    allowDecimals={false}
                    axisLine={{ stroke: CHART_STYLE.grid }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={CHART_STYLE.tooltip}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(v) => [v, '审核量'] as [React.ReactNode, React.ReactNode]}
                    labelFormatter={(l) => `日期：${String(l)}`}
                  />
                  <Bar
                    dataKey="auditedCount"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              {audit && (
                <div className="mt-3 flex gap-4 border-t border-slate-800/60 pt-3 text-[11px] text-slate-500">
                  <span>
                    待审资源：
                    <span className="font-semibold text-amber-400">{audit.pendingResourceCount}</span>
                  </span>
                  <span>
                    待审需求：
                    <span className="font-semibold text-amber-400">{audit.pendingDemandCount}</span>
                  </span>
                  <span>
                    合计：
                    <span className="font-semibold text-amber-400">{audit.totalPendingAudit}</span>
                  </span>
                </div>
              )}
            </>
          )}
        </ChartCard>

        <ChartCard title="消息发送统计">
          {messageStats.isLoading ? (
            <LoadingChart />
          ) : !msg ? (
            <EmptyChart />
          ) : (
            <div className="flex flex-col gap-4">
              {(
                [
                  {
                    label: '站内信',
                    data: msg.site,
                    icon: MessageSquare,
                    iconBg: 'bg-sky-950/60',
                    iconColor: 'text-sky-400',
                    barColor: '#0ea5e9',
                    barBg: 'rgba(14,165,233,0.12)',
                  },
                  {
                    label: '微信推送',
                    data: msg.wechat,
                    icon: MessageSquare,
                    iconBg: 'bg-emerald-950/60',
                    iconColor: 'text-emerald-400',
                    barColor: '#10b981',
                    barBg: 'rgba(16,185,129,0.12)',
                  },
                ] as const
              ).map(({ label, data, icon, iconBg, iconColor, barColor, barBg }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-800/50 bg-slate-800/30 p-4"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg} border`}
                      style={{ borderColor: `${barColor}20` }}
                    >
                      <Icon icon={icon} size={13} className={iconColor} />
                    </div>
                    <span className="text-[13px] font-medium text-slate-300">{label}</span>
                    <span className="ml-auto text-lg font-bold tabular-nums text-slate-100">
                      {Number(data.successRate).toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress track */}
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: barBg }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(Number(data.successRate), 100)}%`,
                        background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                        boxShadow: `0 0 8px ${barColor}60`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex gap-4 text-[11px] text-slate-600">
                    <span>发送 {data.totalProcessed.toLocaleString()}</span>
                    <span style={{ color: barColor }}>
                      成功 {data.successCount.toLocaleString()}
                    </span>
                    <span className="text-rose-500/70">
                      失败 {data.failedCount.toLocaleString()}
                    </span>
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
