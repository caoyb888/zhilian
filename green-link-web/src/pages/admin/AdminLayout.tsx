import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Leaf, Menu, X } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { useAuthStore } from '@/stores/authStore'
import { usePermission } from '@/hooks/usePermission'
import { useLogout } from '@/hooks/useAuthMutations'
import { adminMenuConfig, type MenuItem } from './menuConfig'

function SidebarItem({ item }: { item: MenuItem }) {
  const hasPermission = usePermission(item.permission ?? '')
  const alwaysVisible = item.permission === undefined

  if (!alwaysVisible && !hasPermission) return null

  return (
    <NavLink
      to={item.path}
      end={item.path === '/admin/dashboard'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
        )
      }
    >
      <Icon icon={item.icon} size={18} />
      <span>{item.label}</span>
    </NavLink>
  )
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const navigate = useNavigate()
  const logoutMutation = useLogout()

  function handleLogout() {
    logoutMutation.mutate(undefined, { onSettled: () => navigate('/login') })
  }

  const sidebar = (
    <nav className="flex flex-col gap-1 p-4">
      {adminMenuConfig.map((item) => (
        <SidebarItem key={item.path} item={item} />
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* 桌面侧边栏 */}
      <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-stone-100 px-4">
          <div className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <Icon icon={Leaf} size={16} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-brand-700">绿产智链管理端</span>
        </div>
        {sidebar}
      </aside>

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-56 flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-stone-100 px-4">
              <span className="text-sm font-semibold text-brand-700">绿产智链管理端</span>
              <button
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
                onClick={() => setSidebarOpen(false)}
                aria-label="关闭菜单"
              >
                <Icon icon={X} size={18} />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      {/* 主区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部导航 */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4">
          <button
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="打开菜单"
          >
            <Icon icon={Menu} size={20} />
          </button>
          <div className="hidden text-sm text-stone-500 md:block" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-600">
              {accountInfo?.realName ?? accountInfo?.username}
            </span>
            <button
              className="rounded-lg px-3 py-1 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
              onClick={handleLogout}
            >
              退出
            </button>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
