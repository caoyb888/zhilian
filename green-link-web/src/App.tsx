import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Spinner } from '@/components/Spinner'
import { RequireAuth } from '@/components/RequireAuth'
import { PrivateRoute } from '@/components/PrivateRoute'

const LoginPage                = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage             = lazy(() => import('@/pages/auth/RegisterPage'))
const PortalHomePage           = lazy(() => import('@/pages/portal/PortalHomePage'))
const PortalArticleListPage    = lazy(() => import('@/pages/portal/PortalArticleListPage'))
const PortalArticleDetailPage  = lazy(() => import('@/pages/portal/PortalArticleDetailPage'))
const PortalActivityListPage   = lazy(() => import('@/pages/portal/PortalActivityListPage'))
const PortalActivityDetailPage = lazy(() => import('@/pages/portal/PortalActivityDetailPage'))
const SupplyListPage           = lazy(() => import('@/pages/supply/SupplyListPage'))
const NotFoundPage             = lazy(() => import('@/pages/NotFoundPage'))
const ForbiddenPage            = lazy(() => import('@/pages/ForbiddenPage'))

// 管理端布局与页面
const AdminLayout          = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminDashboardPage   = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const MemberListPage       = lazy(() => import('@/pages/admin/MemberListPage'))
const MemberAuditPage      = lazy(() => import('@/pages/admin/MemberAuditPage'))
const ArticleListPage      = lazy(() => import('@/pages/admin/ArticleListPage'))
const ActivityListPage     = lazy(() => import('@/pages/admin/ActivityListPage'))
const TagListPage          = lazy(() => import('@/pages/admin/TagListPage'))
const SupplyAuditPage      = lazy(() => import('@/pages/admin/SupplyAuditPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" className="text-brand-500" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* 公开路由 */}
            <Route path="/" element={<Navigate to="/portal" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/portal" element={<PortalHomePage />} />
            <Route path="/portal/articles" element={<PortalArticleListPage />} />
            <Route path="/portal/articles/:id" element={<PortalArticleDetailPage />} />
            <Route path="/portal/activities" element={<PortalActivityListPage />} />
            <Route path="/portal/activities/:id" element={<PortalActivityDetailPage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            {/* 会员端（登录必需） */}
            <Route
              path="/supply"
              element={
                <RequireAuth>
                  <SupplyListPage />
                </RequireAuth>
              }
            />

            {/* 管理端（登录 + 管理员角色） */}
            <Route
              path="/admin"
              element={
                <RequireAuth adminOnly>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route
                path="members"
                element={
                  <PrivateRoute permission="member:unit:list">
                    <MemberListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="members/audit"
                element={
                  <PrivateRoute permission="member:unit:audit">
                    <MemberAuditPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="articles"
                element={
                  <PrivateRoute permission="portal:article:list">
                    <ArticleListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="activities"
                element={
                  <PrivateRoute permission="portal:activity:list">
                    <ActivityListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="tags"
                element={
                  <PrivateRoute permission="tag:list">
                    <TagListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="supply-audit"
                element={
                  <PrivateRoute permission="supply:resource:audit">
                    <SupplyAuditPage />
                  </PrivateRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
