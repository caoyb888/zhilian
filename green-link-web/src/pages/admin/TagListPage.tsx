import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  X,
  Pencil,
  Trash2,
  ArrowUpDown,
  Search,
  Tag as TagIcon,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { SkeletonList } from '@/components/states/SkeletonList'
import { EmptyState } from '@/components/states/EmptyState'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Pagination } from '@/components/Pagination'
import {
  fetchTagCategories,
  fetchTags,
  createTagCategory,
  updateTagCategory,
  deleteTagCategory,
  createTag,
  updateTag,
  deleteTag,
  type TagCategory,
  type Tag,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
  type CreateTagRequest,
  type UpdateTagRequest,
} from '@/services/tagService'

const PAGE_SIZE = 10

export default function TagListPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ['tagCategories'],
    queryFn: fetchTagCategories,
  })

  const { data: tagPage, refetch: refetchTags } = useQuery({
    queryKey: ['tags', selectedCategoryId, keyword, page],
    queryFn: () =>
      fetchTags({
        page,
        size: PAGE_SIZE,
        categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
        keyword: keyword || undefined,
      }),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteTagCategory,
    onSuccess: () => {
      refetchCategories()
      refetchTags()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg ?? '删除失败'
      alert(msg)
    },
  })

  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => refetchTags(),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg ?? '删除失败'
      alert(msg)
    },
  })

  function handleDeleteCategory(id: number) {
    if (confirm('确定删除该分类？若分类下仍有标签，删除可能失败。')) {
      deleteCategoryMutation.mutate(id)
    }
  }

  function handleDeleteTag(id: number) {
    if (confirm('确定删除该标签？')) {
      deleteTagMutation.mutate(id)
    }
  }

  function openCategoryModal(cat?: TagCategory) {
    setEditingCategory(cat ?? null)
    setCategoryModalOpen(true)
  }

  function openTagModal(tag?: Tag) {
    setEditingTag(tag ?? null)
    setTagModalOpen(true)
  }

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId)

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      {/* 左侧分类面板 */}
      <aside className="w-full shrink-0 rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 md:w-64">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">标签分类</h2>
          <Button variant="secondary" size="sm" onClick={() => openCategoryModal()}>
            新建
          </Button>
        </div>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => { setSelectedCategoryId('all'); setPage(1) }}
              className={
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 ' +
                (selectedCategoryId === 'all'
                  ? 'bg-emerald-950/50 font-medium text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800/40')
              }
            >
              <span>全部标签</span>
              <span className="text-xs text-slate-500">
                {categories?.reduce((sum, c) => sum + (c.tags?.length ?? 0), 0) ?? 0}
              </span>
            </button>
          </li>
          {categories?.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => { setSelectedCategoryId(cat.id); setPage(1) }}
                className={
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 ' +
                  (selectedCategoryId === cat.id
                    ? 'bg-emerald-950/50 font-medium text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-800/40')
                }
              >
                <span>{cat.name}</span>
                <span className="text-xs text-slate-500">{cat.tags?.length ?? 0}</span>
              </button>
              {selectedCategoryId === cat.id && (
                <div className="mt-1 flex gap-2 px-3">
                  <button
                    onClick={() => openCategoryModal(cat)}
                    className="rounded p-1 text-xs text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-emerald-400"
                  >
                    <Icon icon={Pencil} size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="rounded p-1 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Icon icon={Trash2} size={12} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </aside>

      {/* 右侧标签列表 */}
      <section className="min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80">
        <div className="flex flex-col gap-3 border-b border-slate-800/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            {selectedCategoryId === 'all' ? '全部标签' : selectedCategory?.name ?? '标签列表'}
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon
                icon={Search}
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                placeholder="搜索标签名称"
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
                inputClassName="w-48 pl-9"
              />
            </div>
            <Button size="sm" onClick={() => openTagModal()}>
              新建标签
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {!tagPage ? (
            <div className="p-4">
              <SkeletonList count={5} />
            </div>
          ) : tagPage.records.length === 0 ? (
            <EmptyState
              icon={TagIcon}
              title="暂无标签数据"
              description="当前分类下没有标签"
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">名称</th>
                  <th className="px-4 py-3">别名</th>
                  <th className="px-4 py-3">所属分类</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      排序
                      <Icon icon={ArrowUpDown} size={12} className="text-slate-500" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {tagPage.records.map((tag) => (
                  <tr
                    key={tag.id}
                    className="border-t border-slate-800/60 transition-colors hover:bg-slate-800/40/80"
                  >
                    <td className="px-4 py-3 font-medium text-slate-100">{tag.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{tag.alias ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {categories?.find((c) => c.id === tag.categoryId)?.name ?? tag.categoryId}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{tag.sortOrder}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 p-0.5">
                        <button
                          onClick={() => openTagModal(tag)}
                          className="rounded p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-700/60 hover:text-emerald-400"
                          title="编辑"
                        >
                          <Icon icon={Pencil} size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="rounded p-1.5 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                          title="删除"
                        >
                          <Icon icon={Trash2} size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {tagPage && tagPage.total > PAGE_SIZE && (
          <div className="border-t border-slate-800/60 px-4 py-4">
            <Pagination page={page} total={tagPage.total} size={PAGE_SIZE} onChange={setPage} />
          </div>
        )}
      </section>

      {/* 分类弹窗 */}
      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        category={editingCategory}
        onSuccess={() => {
          refetchCategories()
          setCategoryModalOpen(false)
        }}
      />

      {/* 标签弹窗 */}
      <TagModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        tag={editingTag}
        categories={categories ?? []}
        defaultCategoryId={selectedCategoryId === 'all' ? undefined : selectedCategoryId}
        onSuccess={() => {
          refetchTags()
          refetchCategories()
          setTagModalOpen(false)
        }}
      />
    </div>
  )
}

/* ───────── 分类弹窗组件 ───────── */

interface CategoryModalProps {
  open: boolean
  onClose: () => void
  category: TagCategory | null
  onSuccess: () => void
}

function CategoryModal({ open, onClose, category, onSuccess }: CategoryModalProps) {
  const isEdit = !!category
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryRequest>({
    defaultValues: {
      code: category?.code ?? '',
      name: category?.name ?? '',
      sortOrder: category?.sortOrder ?? 0,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        code: category?.code ?? '',
        name: category?.name ?? '',
        sortOrder: category?.sortOrder ?? 0,
      })
    }
  }, [open, category, reset])

  const mutation = useMutation({
    mutationFn: (data: CreateCategoryRequest | UpdateCategoryRequest) =>
      isEdit ? updateTagCategory(category!.id, data as UpdateCategoryRequest) : createTagCategory(data),
    onSuccess,
  })

  function onSubmit(data: CreateCategoryRequest) {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-100">
              {isEdit ? '编辑分类' : '新建分类'}
            </DialogTitle>
            <button
              className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
              onClick={onClose}
              aria-label="关闭"
            >
              <Icon icon={X} size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">分类编码</label>
                <Input
                  {...register('code', { required: '请输入编码' })}
                  placeholder="如 INDUSTRY"
                  error={!!errors.code}
                  disabled={isEdit}
                  inputClassName={isEdit ? 'bg-slate-800/60 text-slate-400 cursor-not-allowed' : ''}
                />
                {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">分类名称</label>
                <Input
                  {...register('name', { required: '请输入名称' })}
                  placeholder="如 行业分类"
                  error={!!errors.name}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">排序</label>
                <Input
                  type="number"
                  {...register('sortOrder', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-800/60 pt-4">
              <Button variant="ghost" type="button" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                {isEdit ? '保存' : '创建'}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

/* ───────── 标签弹窗组件 ───────── */

interface TagModalProps {
  open: boolean
  onClose: () => void
  tag: Tag | null
  categories: TagCategory[]
  defaultCategoryId?: number
  onSuccess: () => void
}

function TagModal({ open, onClose, tag, categories, defaultCategoryId, onSuccess }: TagModalProps) {
  const isEdit = !!tag
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTagRequest>({
    defaultValues: {
      categoryId: tag?.categoryId ?? defaultCategoryId ?? (categories[0]?.id || 0),
      name: tag?.name ?? '',
      alias: tag?.alias ?? '',
      sortOrder: tag?.sortOrder ?? 0,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        categoryId: tag?.categoryId ?? defaultCategoryId ?? (categories[0]?.id || 0),
        name: tag?.name ?? '',
        alias: tag?.alias ?? '',
        sortOrder: tag?.sortOrder ?? 0,
      })
    }
  }, [open, tag, categories, defaultCategoryId, reset])

  const mutation = useMutation({
    mutationFn: (data: CreateTagRequest | UpdateTagRequest) =>
      isEdit ? updateTag(tag!.id, data as UpdateTagRequest) : createTag(data),
    onSuccess,
  })

  function onSubmit(data: CreateTagRequest) {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-100">
              {isEdit ? '编辑标签' : '新建标签'}
            </DialogTitle>
            <button
              className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
              onClick={onClose}
              aria-label="关闭"
            >
              <Icon icon={X} size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">所属分类</label>
                <select
                  {...register('categoryId', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">标签名称</label>
                <Input
                  {...register('name', { required: '请输入标签名称' })}
                  placeholder="如 新能源"
                  error={!!errors.name}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">别名（同义词，逗号分隔）</label>
                <Input
                  {...register('alias')}
                  placeholder="如 可再生能源,清洁能源"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">排序</label>
                <Input
                  type="number"
                  {...register('sortOrder', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-800/60 pt-4">
              <Button variant="ghost" type="button" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                {isEdit ? '保存' : '创建'}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
