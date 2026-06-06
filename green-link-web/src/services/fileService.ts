import http from './http'
import type { ApiResult } from '@/types/api'

export interface FileUploadResult {
  fileId: number
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
}

export async function uploadFileWithProgress(
  file: File,
  opts: {
    bizType?: string
    bizId?: number
    onProgress?: (pct: number) => void
  } = {}
): Promise<FileUploadResult> {
  const form = new FormData()
  form.append('file', file)
  if (opts.bizType) form.append('bizType', opts.bizType)
  if (opts.bizId !== undefined) form.append('bizId', String(opts.bizId))

  const res = await http.post<ApiResult<FileUploadResult>>('/files/upload', form, {
    headers: { 'Content-Type': undefined as unknown as string },
    onUploadProgress(ev) {
      if (ev.total && opts.onProgress) {
        opts.onProgress(Math.round((ev.loaded / ev.total) * 100))
      }
    },
  })
  return res.data.data
}
