import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const NAV_ITEMS = [
  { label: '个人信息', path: '/member/profile' },
  { label: '子账号管理', path: '/member/sub-accounts' },
]

const MEMBER_LEVEL_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '普通会员', color: 'bg-gray-100 text-gray-600' },
  2: { label: 'VIP 会员', color: 'bg-amber-100 text-amber-700' },
  3: { label: '理事单位', color: 'bg-brand-100 text-brand-700' },
}

export function MemberSidebar() {
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const levelMeta = accountInfo
    ? (MEMBER_LEVEL_MAP[accountInfo.memberLevel] ?? MEMBER_LEVEL_MAP[1])
    : null

  return (
    <aside className="w-56 flex-shrink-0">
      {/* Profile summary */}
      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
            {accountInfo?.realName?.charAt(0) ?? accountInfo?.username?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[10rem]">
              {accountInfo?.realName ?? accountInfo?.username}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[10rem]">
              {accountInfo?.memberName}
            </p>
          </div>
          {levelMeta && (
            <span className={`rounded-full text-xs font-medium px-2.5 py-0.5 ${levelMeta.color}`}>
              {levelMeta.label}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {NAV_ITEMS.map(({ label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-4 py-3 text-sm font-medium border-b border-gray-50 last:border-0 transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 border-l-2 border-l-brand-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
