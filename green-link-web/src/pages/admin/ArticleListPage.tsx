import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { clsx } from 'clsx'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/Button'
import { Pagination } from '@/components/Pagination'
import { RichEditor } from '@/components/RichEditor'
import {
  useArticleList,
  useArticleDetail,
  usePortalCategories,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  usePublishArticle,
  useUnpublishArticle,
  type ArticleItem,
  type CreateArticleBody,
  type PublishMode,
  type CategoryItem,
} from '@/services/articleService'

// ─── helpers ──────────────────────────────────────────────────────────────────

function flattenCategories(cats: CategoryItem[]): CategoryItem[] {
  return cats.flatMap((c) => [c, ...flattenCategories(c.children ?? [])])
}

// ─── article list ─────────────────────────────────────────────────────────────

interface ListViewProps {
  onEdit: (article: ArticleItem) => void
  onNew: () => void
}

function ListView({ onEdit, onNew }: ListViewProps) {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>()
  const [filterPublished, setFilterPublished] = useState<boolean | undefined>()
  const [appliedCategoryId, setAppliedCategoryId] = useState<number | undefined>()
  const [appliedPublished, setAppliedPublished] = useState<boolean | undefined>()

  const { data, isLoading } = useArticleList({
    page,
    size: 20,
    keyword: appliedKeyword || undefined,
    categoryId: appliedCategoryId,
    published: appliedPublished,
  })
  const { data: categories } = usePortalCategories()
  const flatCats = flattenCategories(categories ?? [])

  const deleteMutation = useDeleteArticle()
  const publishMutation = usePublishArticle()
  const unpublishMutation = useUnpublishArticle()

  function handleSearch() {
    setAppliedKeyword(keyword)
    setAppliedCategoryId(filterCategoryId)
    setAppliedPublished(filterPublished)
    setPage(1)
  }

  function handleReset() {
    setKeyword('')
    setFilterCategoryId(undefined)
    setFilterPublished(undefined)
    setAppliedKeyword('')
    setAppliedCategoryId(undefined)
    setAppliedPublished(undefined)
    setPage(1)
  }

  function handleDelete(a: ArticleItem) {
    if (confirm(`确定删除文章「${a.title}」？`)) {
      deleteMutation.mutate(a.id)
    }
  }

  const records = data?.records ?? []
  const total = data?.total ?? 0

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">文章管理</h1>
          <p className="mt-0.5 text-sm text-gray-400">门户新闻、通知、政策文章 CMS</p>
        </div>
        <Button size="sm" onClick={onNew}>+ 新建文章</Button>
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">关键词</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="标题 / 摘要"
            className="w-44 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">栏目</label>
          <select
            value={filterCategoryId ?? ''}
            onChange={(e) => setFilterCategoryId(e.target.value === '' ? undefined : Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">全部栏目</option>
            {flatCats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">状态</label>
          <select
            value={filterPublished === undefined ? '' : String(filterPublished)}
            onChange={(e) =>
              setFilterPublished(e.target.value === '' ? undefined : e.target.value === 'true')
            }
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">全部</option>
            <option value="true">已发布</option>
            <option value="false">草稿</option>
          </select>
        </div>
        <Button size="sm" onClick={handleSearch}>搜索</Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>重置</Button>
      </div>

      {/* table */}
      <div className="rounded-xl border border-gray-100 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">暂无文章</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">标题</th>
                  <th className="px-4 py-3 font-medium">栏目</th>
                  <th className="px-4 py-3 font-medium">作者</th>
                  <th className="px-4 py-3 font-medium">阅读</th>
                  <th className="px-4 py-3 font-medium">置顶</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">发布时间</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/60">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-medium text-gray-800">{a.title}</p>
                      {a.summary && (
                        <p className="mt-0.5 truncate text-xs text-gray-400">{a.summary}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.categoryName}</td>
                    <td className="px-4 py-3 text-gray-500">{a.author ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{a.viewCount}</td>
                    <td className="px-4 py-3">
                      {a.isTop ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">置顶</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.isPublished ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">已发布</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">草稿</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {a.publishedAt ? a.publishedAt.slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-brand-600 hover:underline" onClick={() => onEdit(a)}>
                          编辑
                        </button>
                        {a.isPublished ? (
                          <button
                            className="text-xs text-amber-600 hover:underline"
                            onClick={() => unpublishMutation.mutate(a.id)}
                          >
                            下架
                          </button>
                        ) : (
                          <button
                            className="text-xs text-emerald-600 hover:underline"
                            onClick={() => publishMutation.mutate(a.id)}
                          >
                            发布
                          </button>
                        )}
                        <button className="text-xs text-red-500 hover:underline" onClick={() => handleDelete(a)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} size={20} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── editor form types ────────────────────────────────────────────────────────

interface EditorFormData {
  categoryId: number
  title: string
  summary: string
  author: string
  coverUrl: string
  sourceUrl: string
  isTop: boolean
  publishMode: PublishMode
  scheduledAt: string
}

// ─── cms editor ───────────────────────────────────────────────────────────────

interface EditorViewProps {
  editingId: number | null   // null = new article
  onBack: () => void
}

function EditorView({ editingId, onBack }: EditorViewProps) {
  const isNew = editingId === null

  const { data: detail, isLoading: detailLoading } = useArticleDetail(editingId)
  const { data: categories } = usePortalCategories()
  const flatCats = flattenCategories(categories ?? [])

  const [content, setContent] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  const createMutation = useCreateArticle()
  const updateMutation = useUpdateArticle()
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditorFormData>({
    defaultValues: {
      categoryId: 0,
      title: '',
      summary: '',
      author: '',
      coverUrl: '',
      sourceUrl: '',
      isTop: false,
      publishMode: 'DRAFT',
      scheduledAt: '',
    },
  })

  const publishMode = watch('publishMode')

  // Populate form when detail loads
  useEffect(() => {
    if (!detail) return
    reset({
      categoryId: detail.categoryId,
      title: detail.title,
      summary: detail.summary ?? '',
      author: detail.author ?? '',
      coverUrl: detail.coverUrl ?? '',
      sourceUrl: detail.sourceUrl ?? '',
      isTop: detail.isTop,
      publishMode: 'DRAFT',
      scheduledAt: '',
    })
    setContent(detail.content ?? '')
  }, [detail, reset])

  // Set first category as default once categories load (for new articles)
  useEffect(() => {
    if (isNew && flatCats.length > 0) {
      reset((prev) => ({ ...prev, categoryId: prev.categoryId || flatCats[0].id }))
    }
  }, [isNew, flatCats, reset])

  function onSubmit(mode: PublishMode) {
    handleSubmit((data) => {
      const body: CreateArticleBody = {
        categoryId: Number(data.categoryId),
        title: data.title,
        content: content || undefined,
        summary: data.summary || undefined,
        coverUrl: data.coverUrl || undefined,
        author: data.author || undefined,
        sourceUrl: data.sourceUrl || undefined,
        isTop: data.isTop,
        publishMode: mode,
        scheduledAt: mode === 'SCHEDULED' && data.scheduledAt ? data.scheduledAt : undefined,
      }

      if (isNew) {
        createMutation.mutate(body, {
          onSuccess: (result) => {
            setSavedMsg(mode === 'DRAFT' ? '草稿已保存' : '文章已发布')
            setTimeout(() => setSavedMsg(''), 3000)
            // Navigate to edit mode for the newly created article
            reset((prev) => prev)
            void result
          },
        })
      } else {
        updateMutation.mutate(
          { id: editingId, data: body },
          {
            onSuccess: () => {
              setSavedMsg(mode === 'DRAFT' ? '保存成功' : '已发布')
              setTimeout(() => setSavedMsg(''), 3000)
            },
          }
        )
      }
    })()
  }

  if (!isNew && detailLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          onClick={onBack}
        >
          ← 返回列表
        </button>
        <div className="flex items-center gap-2">
          {savedMsg && (
            <span className="text-sm text-emerald-600">{savedMsg}</span>
          )}
          <Button variant="secondary" size="sm" loading={isPending} onClick={() => onSubmit('DRAFT')}>
            保存草稿
          </Button>
          {publishMode === 'SCHEDULED' ? (
            <Button size="sm" loading={isPending} onClick={() => onSubmit('SCHEDULED')}>
              定时发布
            </Button>
          ) : (
            <Button size="sm" loading={isPending} onClick={() => onSubmit('NOW')}>
              立即发布
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-5">
        {/* ── main editor area ── */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* title */}
          <div>
            <input
              type="text"
              placeholder="请输入文章标题…"
              className={clsx(
                'w-full rounded-xl border px-4 py-3 text-xl font-semibold text-gray-800',
                'placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500',
                errors.title ? 'border-red-400' : 'border-gray-200'
              )}
              {...register('title', { required: '标题不能为空' })}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          {/* rich text editor — key forces remount when switching articles */}
          <div>
            <RichEditor
              key={isNew ? 'new' : String(editingId)}
              defaultValue={isNew ? '' : (detail?.content ?? '')}
              onChange={setContent}
              minHeight={480}
            />
          </div>
        </div>

        {/* ── sidebar metadata ── */}
        <aside className="w-72 shrink-0 space-y-4">
          {/* category */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">文章设置</h3>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">发布栏目 *</label>
                <select
                  {...register('categoryId', { required: true, valueAsNumber: true })}
                  className={clsx(
                    'w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
                    errors.categoryId ? 'border-red-400' : 'border-gray-200'
                  )}
                >
                  {flatCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">作者 / 来源</label>
                <input
                  type="text"
                  placeholder="如 绿色协会秘书处"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  {...register('author')}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isTop"
                  className="accent-brand-500"
                  {...register('isTop')}
                />
                <label htmlFor="isTop" className="text-sm text-gray-600">置顶文章</label>
              </div>
            </div>
          </div>

          {/* publish mode */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">发布设置</h3>

            <div className="space-y-2">
              {(['DRAFT', 'NOW', 'SCHEDULED'] as PublishMode[]).map((mode) => (
                <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    value={mode}
                    className="accent-brand-500"
                    {...register('publishMode')}
                  />
                  {mode === 'DRAFT' && '草稿（不发布）'}
                  {mode === 'NOW' && '立即发布'}
                  {mode === 'SCHEDULED' && '定时发布'}
                </label>
              ))}

              {publishMode === 'SCHEDULED' && (
                <div className="pt-1">
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    {...register('scheduledAt', {
                      validate: (v) =>
                        publishMode === 'SCHEDULED' && !v ? '请选择定时发布时间' : true,
                    })}
                  />
                  {errors.scheduledAt && (
                    <p className="mt-1 text-xs text-red-500">{errors.scheduledAt.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* summary */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">摘要</h3>
            <textarea
              rows={3}
              placeholder="文章摘要（不填将自动截取正文前 100 字）"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...register('summary', { maxLength: { value: 500, message: '摘要最多 500 字' } })}
            />
            {errors.summary && (
              <p className="mt-1 text-xs text-red-500">{errors.summary.message}</p>
            )}
          </div>

          {/* cover + source */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">封面 &amp; 来源</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">封面图 URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  {...register('coverUrl')}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">原文链接</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  {...register('sourceUrl')}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── page root ────────────────────────────────────────────────────────────────

type ViewState =
  | { mode: 'list' }
  | { mode: 'editor'; editingId: number | null }

export default function ArticleListPage() {
  const [view, setView] = useState<ViewState>({ mode: 'list' })

  if (view.mode === 'editor') {
    return (
      <EditorView
        editingId={view.editingId}
        onBack={() => setView({ mode: 'list' })}
      />
    )
  }

  return (
    <ListView
      onNew={() => setView({ mode: 'editor', editingId: null })}
      onEdit={(a) => setView({ mode: 'editor', editingId: a.id })}
    />
  )
}
