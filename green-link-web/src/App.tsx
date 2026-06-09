import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Spinner } from '@/components/Spinner'
import { RequireAuth } from '@/components/RequireAuth'
import { PrivateRoute } from '@/components/PrivateRoute'
import { useThemeStore } from '@/stores/themeStore'

const LoginPage                = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage             = lazy(() => import('@/pages/auth/RegisterPage'))
const PortalHomePage           = lazy(() => import('@/pages/portal/PortalHomePage'))
const PortalArticleListPage    = lazy(() => import('@/pages/portal/PortalArticleListPage'))
const PortalArticleDetailPage  = lazy(() => import('@/pages/portal/PortalArticleDetailPage'))
const PortalActivityListPage   = lazy(() => import('@/pages/portal/PortalActivityListPage'))
const PortalActivityDetailPage = lazy(() => import('@/pages/portal/PortalActivityDetailPage'))
const SupplyListPage              = lazy(() => import('@/pages/supply/SupplyListPage'))
const SupplyResourceDetailPage    = lazy(() => import('@/pages/supply/SupplyResourceDetailPage'))
const SupplyPublishPage           = lazy(() => import('@/pages/supply/SupplyPublishPage'))
const SupplyDemandListPage        = lazy(() => import('@/pages/supply/SupplyDemandListPage'))
const SupplyDemandDetailPage      = lazy(() => import('@/pages/supply/SupplyDemandDetailPage'))
const SupplyDemandPublishPage     = lazy(() => import('@/pages/supply/SupplyDemandPublishPage'))
const SupplyRecommendPage         = lazy(() => import('@/pages/supply/SupplyRecommendPage'))
const MemberLayout             = lazy(() => import('@/pages/member/MemberLayout'))
const MemberProfilePage        = lazy(() => import('@/pages/member/MemberProfilePage'))
const MyResourcesPage          = lazy(() => import('@/pages/member/MyResourcesPage'))
const MyDemandsPage            = lazy(() => import('@/pages/member/MyDemandsPage'))
const MyMatchRecordsPage       = lazy(() => import('@/pages/member/MyMatchRecordsPage'))
const MyMatchRecordDetailPage  = lazy(() => import('@/pages/member/MyMatchRecordDetailPage'))
const MatchChatPage            = lazy(() => import('@/pages/member/MatchChatPage'))
const MessagesPage             = lazy(() => import('@/pages/member/MessagesPage'))
const SubAccountPage           = lazy(() => import('@/pages/member/SubAccountPage'))
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

function ThemeInitializer() {
  const currentTheme = useThemeStore((s) => s.currentTheme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [currentTheme])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <ThemeInitializer />
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

            {/* 供需对接（公开浏览，收藏/对接需登录） */}
            <Route path="/supply" element={<SupplyListPage />} />
            <Route path="/supply/recommend" element={<RequireAuth><SupplyRecommendPage /></RequireAuth>} />
            <Route path="/supply/resources/publish" element={<RequireAuth><SupplyPublishPage /></RequireAuth>} />
            <Route path="/supply/resources/:id" element={<SupplyResourceDetailPage />} />
            <Route path="/supply/demands" element={<SupplyDemandListPage />} />
            <Route path="/supply/demands/publish" element={<RequireAuth><SupplyDemandPublishPage /></RequireAuth>} />
            <Route path="/supply/demands/:id" element={<SupplyDemandDetailPage />} />

            {/* 会员中心（登录必需） */}
            <Route
              path="/member"
              element={
                <RequireAuth>
                  <MemberLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/member/profile" replace />} />
              <Route path="profile" element={<MemberProfilePage />} />
              <Route path="my-resources" element={<MyResourcesPage />} />
              <Route path="my-demands" element={<MyDemandsPage />} />
              <Route path="my-records" element={<MyMatchRecordsPage />} />
              <Route path="my-records/:id" element={<MyMatchRecordDetailPage />} />
              <Route path="my-records/:id/chat" element={<MatchChatPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="sub-accounts" element={<SubAccountPage />} />
            </Route>

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
