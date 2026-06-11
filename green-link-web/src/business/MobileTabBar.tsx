import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Handshake, Home, Layers, User } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { useAuthStore } from '@/stores/authStore'
import { useUnreadCount } from '@/services/messageService'

const TABS = [
  {
    label: '首页',
    icon: Home,
    path: '/portal',
    match: (p: string) => p === '/portal' || p.startsWith('/portal/'),
    requireAuth: false,
  },
  {
    label: '供需',
    icon: Layers,
    path: '/supply',
    match: (p: string) => p.startsWith('/supply'),
    requireAuth: false,
  },
  {
    label: '对接',
    icon: Handshake,
    path: '/member/my-records',
    match: (p: string) =>
      p.startsWith('/member/my-records') ||
      p.startsWith('/member/my-resources') ||
      p.startsWith('/member/my-demands') ||
      p.startsWith('/member/favorites'),
    requireAuth: true,
  },
  {
    label: '消息',
    icon: Bell,
    path: '/member/messages',
    match: (p: string) => p.startsWith('/member/messages'),
    requireAuth: true,
  },
  {
    label: '我的',
    icon: User,
    path: '/member/profile',
    match: (p: string) =>
      p.startsWith('/member') &&
      !p.startsWith('/member/my-records') &&
      !p.startsWith('/member/my-resources') &&
      !p.startsWith('/member/my-demands') &&
      !p.startsWith('/member/favorites') &&
      !p.startsWith('/member/messages'),
    requireAuth: true,
  },
]

export function MobileTabBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const { data: unreadData } = useUnreadCount(!!accountInfo)
  const totalUnread = unreadData?.total ?? 0

  function handleTab(path: string, requireAuth: boolean) {
    if (requireAuth && !accountInfo) {
      navigate(`/login?redirect=${encodeURIComponent(path)}`)
      return
    }
    navigate(path)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-stone-100 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="底部导航"
    >
      <div className="flex h-16">
        {TABS.map(({ label, icon, path, match, requireAuth }) => {
          const isActive = match(pathname)
          const isMessages = path === '/member/messages'
          const badge = isMessages && totalUnread > 0 ? totalUnread : 0

          return (
            <button
              key={path}
              type="button"
              onClick={() => handleTab(path, requireAuth)}
              className={[
                'flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-150 active:bg-stone-50',
                isActive ? 'text-emerald-600' : 'text-stone-400',
              ].join(' ')}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative">
                <span
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150',
                    isActive ? 'bg-emerald-50' : '',
                  ].join(' ')}
                >
                  <Icon
                    icon={icon}
                    size={20}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                </span>
                {badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              <span className={['text-[11px] font-medium leading-none', isActive ? 'text-emerald-600' : ''].join(' ')}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
