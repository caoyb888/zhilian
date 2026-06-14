import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Boxes, ClipboardList, Handshake, LogOut, Menu, Search, Sparkles, User, X } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { useAuthStore } from '@/stores/authStore'
import { useUnreadCount } from '@/services/messageService'
import { useLogout } from '@/hooks/useAuthMutations'

const NAV_LINKS = [
  { label: '首页', path: '/portal' },
  { label: '资讯', path: '/portal/articles' },
  { label: '活动', path: '/portal/activities' },
  { label: '供需对接', path: '/supply' },
]

const USER_MENU_ITEMS = [
  { label: '个人信息', path: '/member/profile', icon: User },
  { label: '我的资源', path: '/member/my-resources', icon: Boxes },
  { label: '我的对接', path: '/member/my-records', icon: Handshake },
  { label: '消息中心', path: '/member/messages', icon: Bell },
  { label: '我的收藏', path: '/member/favorites', icon: ClipboardList },
]

export function PortalNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { data: unreadData } = useUnreadCount(!!accountInfo)
  const totalUnread = unreadData?.total ?? 0
  const logoutMutation = useLogout()
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        navigate('/search')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [userMenuOpen])

  const isActive = (path: string) =>
    pathname === path || (path !== '/portal' && pathname.startsWith(path))

  function handleLogout() {
    setUserMenuOpen(false)
    logoutMutation.mutate(undefined, { onSettled: () => navigate('/login') })
  }

  return (
    <header
      className={[
        'sticky top-0 z-40 border-b backdrop-blur-lg transition-all duration-300',
        scrolled
          ? 'bg-white/92 border-emerald-100 shadow-[0_2px_24px_rgba(0,102,79,0.08)]'
          : 'bg-white/80 border-emerald-100 shadow-none',
      ].join(' ')}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center" style={{ height: scrolled ? '52px' : '64px', transition: 'height 0.3s' }}>

          {/* Logo */}
          <Link to="/portal" className="relative z-10 flex items-center gap-3 flex-shrink-0">
            <img
              src="/lsdt-logo.png"
              alt="山东省绿色低碳产业发展协会"
              className={[
                'rounded-full object-contain ring-1 ring-emerald-200/60 transition-all duration-300 flex-shrink-0',
                scrolled ? 'h-8 w-8' : 'h-10 w-10',
              ].join(' ')}
            />
            <div className="hidden sm:flex flex-col justify-center">
              <span className={[
                'font-bold text-stone-900 leading-tight tracking-tight transition-all duration-300',
                scrolled ? 'text-base' : 'text-lg',
              ].join(' ')}>
                绿产智链
              </span>
              <span className={[
                'text-stone-400 leading-tight transition-all duration-300 overflow-hidden',
                scrolled ? 'text-[10px] max-h-0 opacity-0' : 'text-[11px] max-h-4 opacity-100',
              ].join(' ')}>
                山东绿色低碳产业智慧平台
              </span>
            </div>
          </Link>

          {/* Desktop Nav — centered absolutely */}
          <nav className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
            <div className="flex items-center gap-0 pointer-events-auto">
              {NAV_LINKS.map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={[
                    'px-4 py-1.5 text-sm transition-all duration-200 border-b-2',
                    isActive(path)
                      ? 'font-semibold text-emerald-700 border-emerald-500'
                      : 'font-medium text-stone-500 border-transparent hover:text-emerald-700 hover:border-emerald-200',
                  ].join(' ')}
                >
                  {label}
                </Link>
              ))}
              {accountInfo && (
                <Link
                  to="/supply/recommend"
                  className={[
                    'inline-flex items-center gap-1 px-4 py-1.5 text-sm transition-all duration-200 border-b-2',
                    isActive('/supply/recommend')
                      ? 'font-semibold text-emerald-700 border-emerald-500'
                      : 'font-medium text-stone-500 border-transparent hover:text-emerald-700 hover:border-emerald-200',
                  ].join(' ')}
                >
                  <Icon icon={Sparkles} size={13} />
                  智能推荐
                </Link>
              )}
            </div>
          </nav>

          {/* Right actions */}
          <div className="relative z-10 flex items-center gap-1.5 ml-auto flex-shrink-0">
            {accountInfo ? (
              <>
                {/* Search */}
                <Link
                  to="/search"
                  className="hidden lg:flex items-center gap-2 rounded-full border border-stone-200 bg-transparent px-3 py-1.5 text-xs text-stone-400 transition-all duration-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/40"
                  aria-label="全局搜索"
                >
                  <Icon icon={Search} size={12} />
                  <span>搜索</span>
                  <kbd className="rounded bg-stone-100 px-1 py-0.5 text-stone-400 text-[10px]">⌘K</kbd>
                </Link>

                {/* Bell */}
                <Link
                  to="/member/messages"
                  className="relative hidden lg:flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:text-emerald-700 hover:bg-emerald-50/60 transition-all duration-200"
                  aria-label={totalUnread > 0 ? `${totalUnread} 条未读消息` : '消息中心'}
                >
                  <Icon icon={Bell} size={17} />
                  {totalUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </Link>

                {/* Publish */}
                <Link
                  to="/supply/resources/publish"
                  className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-emerald-700 transition-all duration-200 shadow-sm shadow-emerald-200"
                >
                  发布供需
                </Link>

                {/* User dropdown */}
                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full hover:bg-stone-50 transition-all duration-200"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="h-7 w-7 rounded-full bg-emerald-100 ring-1 ring-emerald-200/60 flex items-center justify-center overflow-hidden">
                      {accountInfo.avatarUrl ? (
                        <img src={accountInfo.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon icon={User} size={14} className="text-emerald-600" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-stone-700 hidden sm:block max-w-[80px] truncate">
                      {accountInfo.realName ?? accountInfo.username}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-stone-100 bg-white/95 backdrop-blur-sm py-1 shadow-lg ring-1 ring-black/5">
                      <div className="border-b border-stone-100 px-4 py-2.5">
                        <p className="text-xs font-semibold text-stone-900 truncate">
                          {accountInfo.realName ?? accountInfo.username}
                        </p>
                        <p className="text-xs text-stone-400 truncate mt-0.5">
                          {accountInfo.memberName}
                        </p>
                      </div>
                      <div className="py-1">
                        {USER_MENU_ITEMS.map(({ label, path, icon }) => (
                          <Link
                            key={path}
                            to={path}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-emerald-700 transition-colors"
                          >
                            <Icon icon={icon} size={15} className="text-stone-400" />
                            {label}
                            {label === '消息中心' && totalUnread > 0 && (
                              <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                                {totalUnread > 99 ? '99+' : totalUnread}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-stone-100 py-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-stone-500 hover:bg-stone-50 hover:text-red-600 transition-colors"
                        >
                          <Icon icon={LogOut} size={15} className="text-stone-400" />
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-stone-500 hover:text-stone-900 transition-colors hidden sm:block px-2"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-emerald-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-emerald-700 transition-all duration-200 shadow-sm shadow-emerald-200"
                >
                  注册会员
                </Link>
              </>
            )}

            {/* Mobile hamburger — 44px touch target */}
            <button
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 transition-colors ml-1"
              onClick={() => setMobileOpen(true)}
              aria-label="打开菜单"
            >
              <Icon icon={Menu} size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-64 bg-white/95 backdrop-blur-md shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-stone-900">菜单</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
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
