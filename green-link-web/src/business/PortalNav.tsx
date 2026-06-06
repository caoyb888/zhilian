import { Link, useLocation } from 'react-router-dom'
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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/portal" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">绿</span>
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">绿产智链</span>
            <span className="text-gray-400 text-xs hidden sm:block">山东绿色低碳产业智慧平台</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={[
                  'text-sm font-medium transition-colors',
                  pathname === path || (path !== '/portal' && pathname.startsWith(path))
                    ? 'text-brand-600 border-b-2 border-brand-500 pb-0.5'
                    : 'text-gray-600 hover:text-brand-600',
                ].join(' ')}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {accountInfo ? (
              <Link
                to="/member/profile"
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                {accountInfo.realName ?? accountInfo.username} · 会员中心
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
          </div>
        </div>
      </div>
    </header>
  )
}
