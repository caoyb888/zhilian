import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'

export default function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-500">403</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-800">无访问权限</h1>
        <p className="mt-2 text-gray-500">您没有访问此页面所需的权限，请联系管理员。</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
          <Button onClick={() => navigate('/admin/dashboard')}>
            前往控制台
          </Button>
        </div>
      </div>
    </div>
  )
}
