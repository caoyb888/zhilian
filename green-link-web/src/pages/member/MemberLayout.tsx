import { Outlet } from 'react-router-dom'
import { PortalNav } from '@/business/PortalNav'
import { MemberSidebar } from '@/business/MemberSidebar'

export default function MemberLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PortalNav />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex gap-6 items-start">
        <MemberSidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
