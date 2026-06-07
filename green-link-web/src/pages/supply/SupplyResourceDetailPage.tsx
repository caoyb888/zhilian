import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { PortalNav } from '@/business/PortalNav'

export default function SupplyResourceDetailPage() {
  const { id } = useParams()

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <PortalNav />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/supply"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8 transition-colors"
        >
          <Icon icon={ArrowLeft} size={16} />
          返回资源列表
        </Link>
        <div className="rounded-2xl border border-stone-100 bg-white p-12 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">
            🔧
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">资源详情（#{ id }）</h1>
          <p className="text-sm text-stone-500">
            详情页正在建设中（S4-09），敬请期待。
          </p>
        </div>
      </main>
      <footer className="bg-stone-900 text-stone-400 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>
    </div>
  )
}
