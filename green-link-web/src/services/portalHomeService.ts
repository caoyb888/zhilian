import { useQuery } from '@tanstack/react-query'
import http from './http'
import type { ApiResult } from '@/types/api'
import type { ArticleItem, MbPage } from './articleService'
import type { Activity } from './activityService'

export interface BannerItem {
  id: number
  title: string
  imageUrl: string | null
  linkUrl: string | null
  sortOrder: number
}

export function usePortalBanners() {
  return useQuery({
    queryKey: ['portal', 'home', 'banners'],
    queryFn: async () => {
      const res = await http.get<ApiResult<BannerItem[]>>('/portal/banners')
      return res.data.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function usePortalLatestArticles(size = 6) {
  return useQuery({
    queryKey: ['portal', 'home', 'articles', size],
    queryFn: async () => {
      const res = await http.get<ApiResult<MbPage<ArticleItem>>>('/portal/articles', {
        params: { page: 1, size, published: true },
      })
      return res.data.data?.records ?? []
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function usePortalLatestActivities(size = 4) {
  return useQuery({
    queryKey: ['portal', 'home', 'activities', size],
    queryFn: async () => {
      const res = await http.get<ApiResult<{ records: Activity[] }>>('/portal/public/activities', {
        params: { page: 1, size },
      })
      return res.data.data?.records ?? []
    },
    staleTime: 2 * 60 * 1000,
  })
}
