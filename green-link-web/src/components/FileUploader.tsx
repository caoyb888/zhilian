import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { uploadFileWithProgress, type FileUploadResult } from '@/services/fileService'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadItem {
  uid: string
  name: string
  size: number
  previewUrl?: string
  status: 'uploading' | 'done' | 'error'
  progress: number
  result?: FileUploadResult
  error?: string
}

export interface FileUploaderProps {
  /** MIME/extension filter — passed to <input accept> and used for drag-drop validation.
   *  Example: "image/*,application/pdf,.doc,.docx" */
  accept?: string
  /** Max simultaneous files. 1 = single-file mode (new drop replaces). Default 1. */
  maxFiles?: number
  /** Max file size in MB. Default 20. */
  maxSizeMB?: number
  bizType?: string
  bizId?: number
  /** Custom hint text. If omitted, auto-generated from accept + maxSizeMB. */
  hint?: string
  disabled?: boolean
  /** Pre-populate with already-uploaded files (uncontrolled initial value). */
  defaultValue?: FileUploadResult[]
  /** Called with the current list of successfully uploaded files after any change. */
  onChange?: (results: FileUploadResult[]) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function extBadge(name: string, mime = ''): { label: string; cls: string } {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext))
    return { label: 'IMG', cls: 'bg-emerald-100 text-emerald-700' }
  if (mime === 'application/pdf' || ext === 'pdf')
    return { label: 'PDF', cls: 'bg-red-100 text-red-700' }
  if (['doc', 'docx'].includes(ext)) return { label: 'DOC', cls: 'bg-blue-100 text-blue-700' }
  if (['xls', 'xlsx'].includes(ext)) return { label: 'XLS', cls: 'bg-green-100 text-green-700' }
  return { label: ext.toUpperCase().slice(0, 4) || 'FILE', cls: 'bg-gray-100 text-gray-600' }
}

function buildHint(accept: string, maxSizeMB: number): string {
  const parts: string[] = []
  if (accept.includes('image/')) parts.push('图片(JPG/PNG/WebP)')
  if (accept.includes('pdf')) parts.push('PDF')
  if (accept.includes('.doc') || accept.includes('wordprocessingml')) parts.push('Word')
  if (accept.includes('.xls') || accept.includes('spreadsheetml')) parts.push('Excel')
  const typeStr = parts.length ? parts.join('、') : '文件'
  return `支持${typeStr}，单个 ≤ ${maxSizeMB}MB`
}

function makeUid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Client-side file type check against an `accept` string (MIME types + extensions). */
function isTypeAllowed(file: File, accept: string): boolean {
  const tokens = accept.split(',').map((t) => t.trim().toLowerCase())
  const mime = file.type.toLowerCase()
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
  return tokens.some((token) => {
    if (token === '*/*') return true
    if (token.endsWith('/*')) return mime.startsWith(token.slice(0, -1))
    if (token.startsWith('.')) return ext === token
    return mime === token
  })
}

function itemsFromDefault(defaults: FileUploadResult[]): UploadItem[] {
  return defaults.map((r) => ({
    uid: String(r.fileId),
    name: r.fileName,
    size: r.fileSize,
    status: 'done' as const,
    progress: 100,
    result: r,
  }))
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4m0 0L8 8m4-4 4 4" />
      <path d="M20 16.7A5 5 0 0 0 16 8h-1.26A8 8 0 1 0 4 16.7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FileUploader({
  accept = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx',
  maxFiles = 1,
  maxSizeMB = 20,
  bizType,
  bizId,
  hint,
  disabled = false,
  defaultValue,
  onChange,
}: FileUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>(() =>
    defaultValue?.length ? itemsFromDefault(defaultValue) : []
  )
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRegistry = useRef(new Map<string, File>())
  const onChangeRef = useRef(onChange)
  useLayoutEffect(() => {
    onChangeRef.current = onChange
  })

  // ─── Notify parent when done-set changes (no side-effects in updaters) ───
  const prevDoneKey = useRef('')
  useEffect(() => {
    const doneItems = items.filter((i) => i.status === 'done')
    const key = doneItems.map((i) => i.uid).join(',')
    if (key === prevDoneKey.current) return
    prevDoneKey.current = key
    onChangeRef.current?.(doneItems.map((i) => i.result!))
  }, [items])

  // ─── Revoke all remaining object URLs on unmount ─────────────────────────
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl)
      })
    }
  }, [])

  // ─── Upload logic ─────────────────────────────────────────────────────────

  const startUpload = useCallback(
    async (itemUid: string, file: File) => {
      try {
        const result = await uploadFileWithProgress(file, {
          bizType,
          bizId,
          onProgress(pct) {
            setItems((prev) =>
              prev.map((it) => (it.uid === itemUid ? { ...it, progress: pct } : it))
            )
          },
        })
        setItems((prev) =>
          prev.map((it) =>
            it.uid === itemUid ? { ...it, status: 'done', progress: 100, result } : it
          )
        )
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg ??
          '上传失败，请重试'
        setItems((prev) =>
          prev.map((it) => (it.uid === itemUid ? { ...it, status: 'error', error: msg } : it))
        )
      } finally {
        fileRegistry.current.delete(itemUid)
      }
    },
    [bizType, bizId]
  )

  // ─── Add files ────────────────────────────────────────────────────────────

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      if (disabled) return
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      const arr = Array.from(incoming)

      // Build new items synchronously so we can kick off uploads immediately
      const toUpload: Array<{ uid: string; file: File }> = []
      const newItems: UploadItem[] = []

      setItems((prev) => {
        const activeCount = maxFiles === 1 ? 0 : prev.filter((i) => i.status !== 'error').length
        const slots = maxFiles - activeCount
        if (slots <= 0) return prev

        const toAdd = arr.slice(0, slots)
        toUpload.length = 0
        newItems.length = 0

        for (const file of toAdd) {
          const id = makeUid()

          if (!isTypeAllowed(file, accept)) {
            newItems.push({
              uid: id, name: file.name, size: file.size,
              status: 'error', progress: 0, error: '文件类型不支持',
            })
            continue
          }

          if (file.size > maxSizeBytes) {
            newItems.push({
              uid: id, name: file.name, size: file.size,
              status: 'error', progress: 0, error: `超过 ${maxSizeMB}MB 大小限制`,
            })
            continue
          }

          const previewUrl = file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined
          fileRegistry.current.set(id, file)
          newItems.push({ uid: id, name: file.name, size: file.size, previewUrl, status: 'uploading', progress: 0 })
          toUpload.push({ uid: id, file })
        }

        if (maxFiles === 1) {
          prev.forEach((it) => {
            if (it.previewUrl) URL.revokeObjectURL(it.previewUrl)
            fileRegistry.current.delete(it.uid)
          })
          return newItems
        }
        return [...prev, ...newItems]
      })

      // Kick off uploads outside the state updater
      toUpload.forEach(({ uid, file }) => startUpload(uid, file))
    },
    [disabled, accept, maxFiles, maxSizeMB, startUpload]
  )

  // ─── Remove ───────────────────────────────────────────────────────────────

  const removeItem = useCallback((itemUid: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.uid === itemUid)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      fileRegistry.current.delete(itemUid)
      return prev.filter((i) => i.uid !== itemUid)
    })
  }, [])

  // ─── Drag handlers ────────────────────────────────────────────────────────

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled) addFiles(e.dataTransfer.files)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(e.target.files)
      e.target.value = ''
    }
  }

  // ─── Derived state ────────────────────────────────────────────────────────

  const activeCount = items.filter((i) => i.status !== 'error').length
  const isFull = activeCount >= maxFiles
  const hintText = hint ?? buildHint(accept, maxSizeMB)
  const maxLabel = maxFiles > 1 ? `，最多 ${maxFiles} 个` : ''

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {!isFull && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="上传文件"
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={[
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-colors select-none',
            isDragging
              ? 'border-brand-400 bg-brand-50'
              : disabled
              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              : 'border-gray-200 bg-gray-50 cursor-pointer hover:border-brand-300 hover:bg-gray-100',
          ].join(' ')}
        >
          <UploadIcon className={`h-10 w-10 ${isDragging ? 'text-brand-500' : 'text-gray-300'}`} />
          <p className="text-sm font-medium text-gray-600">
            {isDragging ? '松手即可上传' : '点击选择文件或拖拽至此处'}
          </p>
          <p className="text-xs text-gray-400">{hintText}{maxLabel}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => {
            const badge = extBadge(item.name, item.result?.mimeType)
            return (
              <li key={item.uid} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3">
                <div className="flex-shrink-0">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="h-10 w-10 rounded object-cover border border-gray-100"
                    />
                  ) : (
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded text-xs font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-800 truncate">{item.name}</p>
                    <span className="flex-shrink-0 text-xs text-gray-400">{formatSize(item.size)}</span>
                  </div>

                  {item.status === 'uploading' && (
                    <div className="mt-1.5">
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-200"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{item.progress}%</p>
                    </div>
                  )}

                  {item.status === 'done' && (
                    <div className="mt-1 flex items-center gap-1">
                      <CheckIcon />
                      <span className="text-xs text-emerald-600">上传成功</span>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <p className="mt-1 text-xs text-red-500">{item.error}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.uid)}
                  disabled={item.status === 'uploading'}
                  aria-label={`移除 ${item.name}`}
                  className="flex-shrink-0 rounded p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {maxFiles > 1 && items.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          已上传 {items.filter((i) => i.status === 'done').length} / {maxFiles} 个
        </p>
      )}
    </div>
  )
}
