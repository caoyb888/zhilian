import { NavLink, useNavigate } from 'react-router-dom'
import { User, Users, LogOut } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Badge } from '@/components/Badge'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/hooks/useAuthMutations'

const NAV_ITEMS = [
  { label: '个人信息', path: '/member/profile', icon: User },
  { label: '子账号管理', path: '/member/sub-accounts', icon: Users },
]

const MEMBER_LEVEL_MAP: Record<number, { label: string; variant: 'default' | 'vip' | 'success' }> = {
  1: { label: '普通会员', variant: 'default' },
  2: { label: 'VIP 会员', variant: 'vip' },
  3: { label: '理事单位', variant: 'success' },
}

export function MemberSidebar() {
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const navigate = useNavigate()
  const logoutMutation = useLogout()
  const levelMeta = accountInfo
    ? (MEMBER_LEVEL_MAP[accountInfo.memberLevel] ?? MEMBER_LEVEL_MAP[1])
    : null

  return (
    <aside className="w-56 flex-shrink-0">
      {/* Profile summary */}
      <div className="mb-4 rounded-xl border border-stone-100 bg-white p-4 shadow-card">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
            {accountInfo?.realName?.charAt(0) ?? accountInfo?.username?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900 truncate max-w-[10rem]">
              {accountInfo?.realName ?? accountInfo?.username}
            </p>
            <p className="text-xs text-stone-500 truncate max-w-[10rem]">
              {accountInfo?.memberName}
            </p>
          </div>
          {levelMeta && (
            <Badge variant={levelMeta.variant}>{levelMeta.label}</Badge>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="rounded-xl border border-stone-100 bg-white shadow-card overflow-hidden">
        {NAV_ITEMS.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
              ].join(' ')
            }
          >
            <Icon icon={icon} size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-4 rounded-xl border border-stone-100 bg-white shadow-card overflow-hidden">
        <button
          onClick={() => logoutMutation.mutate(undefined, { onSettled: () => navigate('/login') })}
          className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors"
        >
          <Icon icon={LogOut} size={18} />
          退出登录
        </button>
      </div>
    </aside>
  )
}
