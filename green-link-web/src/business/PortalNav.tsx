import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Sparkles, X, ChevronDown, Bell, Search, User } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { useAuthStore } from '@/stores/authStore'

const NAV_LINKS = [
  { label: '首页', path: '/portal' },
  { label: '资讯', path: '/portal/articles' },
  { label: '活动', path: '/portal/activities' },
  { label: '供需对接', path: '/supply' },
]

export function PortalNav() {
  const { pathname } = useLocation()
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string) =>
    pathname === path || (path !== '/portal' && pathname.startsWith(path))

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 lg:h-[72px] items-center justify-between">
          {/* Logo */}
          <Link to="/portal" className="flex items-center gap-2.5">
            <img
              src="/lsdt-logo.png"
              alt="山东省绿色低碳产业发展协会"
              className="h-9 w-9 rounded-full object-contain ring-1 ring-stone-100"
            />
            <div className="hidden sm:flex flex-col justify-center">
              <span className="font-bold text-stone-900 text-lg leading-tight">绿产智链</span>
              <span className="text-stone-300 text-[11px] leading-tight">山东绿色低碳产业智慧平台</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(path)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-stone-600 hover:text-emerald-700 hover:bg-emerald-50/60',
                ].join(' ')}
              >
                {label}
              </Link>
            ))}
            {accountInfo && (
              <Link
                to="/supply/recommend"
                className={[
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive('/supply/recommend')
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-stone-600 hover:text-emerald-700 hover:bg-emerald-50/60',
                ].join(' ')}
              >
                <Icon icon={Sparkles} size={14} />
                智能推荐
              </Link>
            )}
          </nav>

          {/* User / Auth */}
          <div className="flex items-center gap-2">
            {accountInfo ? (
              <>
                {/* 搜索图标 */}
                <Link
                  to="/supply"
                  className="hidden lg:flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:text-emerald-700 hover:bg-emerald-50/60 transition-all"
                  aria-label="搜索供需"
                >
                  <Icon icon={Search} size={18} />
                </Link>

                {/* 消息通知 */}
                <Link
                  to="/member/messages"
                  className="relative hidden lg:flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:text-emerald-700 hover:bg-emerald-50/60 transition-all"
                  aria-label="消息中心"
                >
                  <Icon icon={Bell} size={18} />
                </Link>

                {/* 发布供需按钮 */}
                <Link
                  to="/supply/resources/publish"
                  className="hidden sm:inline-flex items-center gap-1 rounded-full bg-theme-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-theme-accent-hover shadow-sm transition-all"
                >
                  发布供需
                </Link>

                {/* 用户头像 + 姓名 + 下拉 */}
                <Link
                  to="/member/profile"
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-stone-50 transition-all"
                >
                  <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                    {accountInfo.avatarUrl ? (
                      <img src={accountInfo.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon icon={User} size={14} className="text-emerald-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-stone-700 hidden sm:block">
                    {accountInfo.realName ?? accountInfo.username}
                  </span>
                  <Icon icon={ChevronDown} size={14} className="text-stone-400 hidden sm:block" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-stone-600 hover:text-stone-900 transition-colors hidden sm:block"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                >
                  注册会员
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden rounded-lg p-2 text-stone-500 hover:bg-stone-100"
              onClick={() => setMobileOpen(true)}
              aria-label="打开菜单"
            >
              <Icon icon={Menu} size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-stone-900">菜单</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                aria-label="关闭菜单"
              >
                <Icon icon={X} size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(path)
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-stone-600 hover:bg-stone-50',
                  ].join(' ')}
                >
                  {label}
                </Link>
              ))}
              {accountInfo && (
                <Link
                  to="/supply/recommend"
                  onClick={() => setMobileOpen(false)}
                  className={[
                    'inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive('/supply/recommend')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-stone-600 hover:bg-stone-50',
                  ].join(' ')}
                >
                  <Icon icon={Sparkles} size={14} />
                  智能推荐
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
