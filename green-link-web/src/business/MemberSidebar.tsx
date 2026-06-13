import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Bell, Boxes, ClipboardList, Handshake, Heart, LogOut, User, Users } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/hooks/useAuthMutations'
import { useUnreadCount } from '@/services/messageService'

// ─── Config ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: '个人信息',   path: '/member/profile',       icon: User },
  { label: '我的资源',   path: '/member/my-resources',  icon: Boxes },
  { label: '我的需求',   path: '/member/my-demands',    icon: ClipboardList },
  { label: '我的对接',   path: '/member/my-records',    icon: Handshake },
  { label: '消息中心',   path: '/member/messages',      icon: Bell },
  { label: '我的收藏',   path: '/member/favorites',     icon: Heart },
  { label: '子账号管理', path: '/member/sub-accounts',  icon: Users },
]

const LEVEL_CONFIG: Record<number, { label: string; cls: string }> = {
  1: { label: '普通会员', cls: 'bg-stone-100 text-stone-600 border-stone-200' },
  2: { label: 'VIP 会员', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  3: { label: '理事单位', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MemberSidebar() {
  const accountInfo    = useAuthStore((s) => s.accountInfo)
  const navigate       = useNavigate()
  const logoutMutation = useLogout()
  const { data: unreadCount } = useUnreadCount(!!accountInfo)

  const levelConf  = accountInfo ? (LEVEL_CONFIG[accountInfo.memberLevel] ?? LEVEL_CONFIG[1]) : null
  const avatarChar = accountInfo?.realName?.charAt(0) ?? accountInfo?.username?.charAt(0) ?? '?'

  return (
    <aside className="hidden md:flex md:flex-col w-56 flex-shrink-0 sticky top-16 lg:top-[4.5rem] max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4.5rem)] overflow-y-auto self-start gap-2">

      {/* ── 单张卡：用户信息 + 导航 + 退出 ── */}
      <div className="rounded-xl border border-stone-100 bg-white shadow-card overflow-hidden">

        {/* 紧凑用户行头 */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm select-none">
            {avatarChar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-900 truncate leading-tight">
              {accountInfo?.realName ?? accountInfo?.username}
            </p>
            {levelConf && (
              <span className={clsx(
                'inline-flex items-center rounded-full border px-2 py-[1px] text-[9px] font-semibold tracking-wide mt-0.5',
                levelConf.cls,
              )}>
                {levelConf.label}
              </span>
            )}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="h-px bg-stone-100" />

        {/* 导航项 */}
        {NAV_ITEMS.map(({ label, path, icon }) => {
          const isMessages = path === '/member/messages'
          const msgUnread  = isMessages ? (unreadCount?.total ?? 0) : 0

          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => clsx(
                'flex items-center gap-2.5 py-[10px] pr-4 text-sm font-medium transition-all duration-150',
                'border-l-[3px] pl-[13px]',
                isActive
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-800',
              )}
            >
              <Icon icon={icon} size={16} />
              <span className="flex-1">{label}</span>
              {msgUnread > 0 && (
                <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                  {msgUnread > 99 ? '99+' : msgUnread}
                </span>
              )}
            </NavLink>
          )
        })}

        {/* 分隔线 + 退出 */}
        <div className="h-px bg-stone-100" />
        <button
          onClick={() => logoutMutation.mutate(undefined, { onSettled: () => navigate('/login') })}
          className="flex w-full items-center gap-2 border-l-[3px] border-transparent pl-[13px] pr-4 py-[10px] text-sm font-medium text-stone-400 hover:bg-stone-50 hover:text-red-500 transition-colors"
        >
          <Icon icon={LogOut} size={16} />
          退出登录
        </button>
      </div>
    </aside>
  )
}
