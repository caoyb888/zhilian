import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
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

export default function TagListPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all')
  const [keyword, setKeyword] = useState('')
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ['tagCategories'],
    queryFn: fetchTagCategories,
  })

  const { data: tagPage, refetch: refetchTags } = useQuery({
    queryKey: ['tags', selectedCategoryId, keyword],
    queryFn: () =>
      fetchTags({
        page: 1,
        size: 50,
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
      <aside className="w-full shrink-0 rounded-xl border border-gray-200 bg-white p-4 md:w-64">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">标签分类</h2>
          <Button variant="secondary" size="sm" onClick={() => openCategoryModal()}>
            新建
          </Button>
        </div>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                selectedCategoryId === 'all'
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>全部标签</span>
              <span className="text-xs text-gray-400">
                {categories?.reduce((sum, c) => sum + (c.tags?.length ?? 0), 0) ?? 0}
              </span>
            </button>
          </li>
          {categories?.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedCategoryId === cat.id
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-xs text-gray-400">{cat.tags?.length ?? 0}</span>
              </button>
              {selectedCategoryId === cat.id && (
                <div className="mt-1 flex gap-2 px-3">
                  <button
                    onClick={() => openCategoryModal(cat)}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    删除
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </aside>

      {/* 右侧标签列表 */}
      <section className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            {selectedCategoryId === 'all' ? '全部标签' : selectedCategory?.name ?? '标签列表'}
          </h2>
          <div className="flex items-center gap-2">
            <Input
              placeholder="搜索标签名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              inputClassName="w-48"
            />
            <Button size="sm" onClick={() => openTagModal()}>
              新建标签
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="pb-2 font-medium">名称</th>
                <th className="pb-2 font-medium">别名</th>
                <th className="pb-2 font-medium">所属分类</th>
                <th className="pb-2 font-medium">排序</th>
                <th className="pb-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tagPage?.records.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-gray-800">{tag.name}</td>
                  <td className="py-2.5 text-gray-500">{tag.alias ?? '-'}</td>
                  <td className="py-2.5 text-gray-500">
                    {categories?.find((c) => c.id === tag.categoryId)?.name ?? tag.categoryId}
                  </td>
                  <td className="py-2.5 text-gray-500">{tag.sortOrder}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openTagModal(tag)}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!tagPage?.records || tagPage.records.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                    暂无标签数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
        <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
          <DialogTitle className="text-base font-semibold text-gray-800">
            {isEdit ? '编辑分类' : '新建分类'}
          </DialogTitle>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">分类编码</label>
              <Input
                {...register('code', { required: '请输入编码' })}
                placeholder="如 INDUSTRY"
                error={!!errors.code}
                disabled={isEdit}
                inputClassName={isEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
              />
              {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">分类名称</label>
              <Input
                {...register('name', { required: '请输入名称' })}
                placeholder="如 行业分类"
                error={!!errors.name}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">排序</label>
              <Input
                type="number"
                {...register('sortOrder', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
        <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
          <DialogTitle className="text-base font-semibold text-gray-800">
            {isEdit ? '编辑标签' : '新建标签'}
          </DialogTitle>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">所属分类</label>
              <select
                {...register('categoryId', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">标签名称</label>
              <Input
                {...register('name', { required: '请输入标签名称' })}
                placeholder="如 新能源"
                error={!!errors.name}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">别名（同义词，逗号分隔）</label>
              <Input
                {...register('alias')}
                placeholder="如 可再生能源,清洁能源"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">排序</label>
              <Input
                type="number"
                {...register('sortOrder', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
