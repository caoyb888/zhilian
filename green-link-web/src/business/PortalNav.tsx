import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, Menu, Search, Sparkles, User, X } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { useAuthStore } from '@/stores/authStore'
import { useUnreadCount } from '@/services/messageService'

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
  const { data: unreadData } = useUnreadCount(!!accountInfo)
  const totalUnread = unreadData?.total ?? 0

  const isActive = (path: string) =>
    pathname === path || (path !== '/portal' && pathname.startsWith(path))

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-[#F8FAF9] to-white border-b border-stone-100/80 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 lg:h-[72px] items-center">
          {/* Logo — 左 */}
          <Link to="/portal" className="relative z-10 flex items-center gap-2.5 flex-shrink-0">
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

          {/* Desktop Nav — 中（绝对居中） */}
          <nav className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              {NAV_LINKS.map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={[
                    'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
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
                    'inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive('/supply/recommend')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-stone-600 hover:text-emerald-700 hover:bg-emerald-50/60',
                  ].join(' ')}
                >
                  <Icon icon={Sparkles} size={14} />
                  智能推荐
                </Link>
              )}
            </div>
          </nav>

          {/* User / Auth — 右 */}
          <div className="relative z-10 flex items-center gap-2 ml-auto flex-shrink-0">
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

                {/* 消息通知（含未读角标） */}
                <Link
                  to="/member/messages"
                  className="relative hidden lg:flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:text-emerald-700 hover:bg-emerald-50/60 transition-all"
                  aria-label={totalUnread > 0 ? `${totalUnread} 条未读消息` : '消息中心'}
                >
                  <Icon icon={Bell} size={18} />
                  {totalUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </Link>

                {/* 发布供需按钮 */}
                <Link
                  to="/supply/resources/publish"
                  className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-4 py-1.5 text-sm font-medium hover:bg-emerald-100 transition-all"
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
              {accountInfo && (
                <Link
                  to="/member/messages"
                  onClick={() => setMobileOpen(false)}
                  className={[
                    'inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive('/member/messages')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-stone-600 hover:bg-stone-50',
                  ].join(' ')}
                >
                  <Icon icon={Bell} size={14} />
                  消息中心
                  {totalUnread > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
