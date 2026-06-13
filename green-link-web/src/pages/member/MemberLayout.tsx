import { Outlet } from 'react-router-dom'
import { PortalNav } from '@/business/PortalNav'
import { MemberSidebar } from '@/business/MemberSidebar'

export default function MemberLayout() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: '#f3f8f5',
        backgroundImage:
          'radial-gradient(circle, rgba(16,185,129,0.045) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <PortalNav />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex gap-6 items-start">
        <MemberSidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
