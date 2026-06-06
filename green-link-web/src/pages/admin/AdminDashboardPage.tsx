import { useAuthStore } from '@/stores/authStore'

export default function AdminDashboardPage() {
  const accountInfo = useAuthStore((s) => s.accountInfo)
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800">控制台</h1>
      <p className="mt-1 text-sm text-gray-500">
        欢迎回来，{accountInfo?.realName ?? accountInfo?.username}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['会员总数', '待审核', '文章总数', '活动总数'].map((label) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-brand-600">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}
