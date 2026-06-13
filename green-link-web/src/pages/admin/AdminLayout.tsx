import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Menu, X, Search, LogOut } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { useAuthStore } from '@/stores/authStore'
import { usePermission } from '@/hooks/usePermission'
import { useLogout } from '@/hooks/useAuthMutations'
import { adminMenuConfig, type MenuItem } from './menuConfig'

// ─── Menu sections grouping ───────────────────────────────────────────────────

const MENU_SECTIONS = [
  { label: '总览',     paths: ['/admin/dashboard', '/admin/search'] },
  { label: '会员管理', paths: ['/admin/members', '/admin/members/audit'] },
  { label: '内容管理', paths: ['/admin/articles', '/admin/activities', '/admin/tags'] },
  { label: '业务管理', paths: ['/admin/supply-audit'] },
]

// ─── Nav item ─────────────────────────────────────────────────────────────────

function SidebarNavItem({ item }: { item: MenuItem }) {
  const hasPermission = usePermission(item.permission ?? '')
  if (item.permission !== undefined && !hasPermission) return null

  return (
    <NavLink
      to={item.path}
      end={item.path === '/admin/dashboard'}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
          isActive
            ? 'bg-emerald-400/10 text-emerald-300'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Left active indicator */}
          {isActive && (
            <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-emerald-400" />
          )}
          <Icon
            icon={item.icon}
            size={15}
            className={clsx(
              'shrink-0 transition-all duration-150',
              'group-hover:scale-110',
            )}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

// ─── Sidebar content (shared between desktop & mobile) ───────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const navigate    = useNavigate()
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const logoutMutation = useLogout()

  function handleLogout() {
    logoutMutation.mutate(undefined, { onSettled: () => navigate('/login') })
  }

  const getItems = (paths: string[]) =>
    adminMenuConfig.filter((item) => paths.includes(item.path))

  const initials = (accountInfo?.realName ?? accountInfo?.username ?? 'A')
    .charAt(0)
    .toUpperCase()

  return (
    <div className="flex h-full flex-col">

      {/* ── Logo header ── */}
      <div className="relative flex h-[60px] shrink-0 items-center gap-3 overflow-hidden px-4">
        {/* Subtle radial glow */}
        <div className="absolute -left-4 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-2xl" />
        {/* Dot matrix decoration */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-20 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)',
            backgroundSize: '7px 7px',
          }}
        />

        {/* GL monogram */}
        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-[11px] font-black tracking-wider text-slate-900 shadow-lg shadow-emerald-500/25">
          GL
        </div>

        <div className="relative z-10 min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-tight text-white">绿产智链</p>
          <p className="text-[10px] leading-tight text-slate-500">管理控制台</p>
        </div>

        {onClose && (
          <button
            className="relative z-10 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/8 hover:text-slate-300"
            onClick={onClose}
            aria-label="关闭菜单"
          >
            <Icon icon={X} size={15} />
          </button>
        )}
      </div>

      {/* Hairline divider */}
      <div className="mx-4 h-px bg-white/[0.07]" />

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {MENU_SECTIONS.map((section) => {
          const items = getItems(section.paths)
          if (items.length === 0) return null
          return (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <SidebarNavItem key={item.path} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Hairline divider */}
      <div className="mx-4 h-px bg-white/[0.07]" />

      {/* ── User card ── */}
      <div className="shrink-0 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          {/* Avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/25">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-tight text-slate-300">
              {accountInfo?.realName ?? accountInfo?.username}
            </p>
            <p className="text-[10px] text-slate-600">协会管理员</p>
          </div>

          <button
            onClick={handleLogout}
            title="退出登录"
            className="shrink-0 rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Icon icon={LogOut} size={14} />
          </button>
        </div>
      </div>

    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const navigate    = useNavigate()

  // Ctrl+K / Cmd+K → global search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        navigate('/admin/search')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const initials = (accountInfo?.realName ?? accountInfo?.username ?? 'A')
    .charAt(0)
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-stone-50">

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex md:w-[220px] md:shrink-0 md:flex-col"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #0b1220 100%)',
          borderRight: '1px solid rgba(255,255,255,0.055)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="relative z-50 flex h-full w-[240px] flex-col"
            style={{
              background: 'linear-gradient(180deg, #0f172a 0%, #0b1220 100%)',
              borderRight: '1px solid rgba(255,255,255,0.055)',
              boxShadow: '8px 0 32px rgba(0,0,0,0.4)',
            }}
          >
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200/80 bg-white px-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">

          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              className="rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="打开菜单"
            >
              <Icon icon={Menu} size={20} />
            </button>

            {/* Desktop breadcrumb hint */}
            <div className="hidden items-center gap-2 md:flex">
              <span className="h-[14px] w-px rounded-full bg-emerald-400/50" />
              <span className="text-[11px] font-medium text-stone-400 tracking-wide">绿产智链</span>
              <span className="text-[11px] text-stone-300">/</span>
              <span className="text-[11px] font-medium text-stone-600">管理控制台</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2.5">
            {/* Search shortcut */}
            <button
              onClick={() => navigate('/admin/search')}
              className="hidden items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-400 transition-all hover:border-emerald-300/60 hover:bg-white hover:text-stone-600 hover:shadow-sm md:flex"
            >
              <Icon icon={Search} size={12} />
              <span>搜索…</span>
              <kbd
                className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-stone-400"
                style={{ fontSize: 9 }}
              >
                ⌘K
              </kbd>
            </button>

            {/* Divider */}
            <div className="hidden h-5 w-px bg-stone-200 md:block" />

            {/* User avatar + name */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/80">
                {initials}
              </div>
              <span className="hidden text-[13px] font-medium text-stone-700 md:block">
                {accountInfo?.realName ?? accountInfo?.username}
              </span>
            </div>
          </div>

        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
