import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X, Pencil, Trash2, Plus, BookMarked } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Badge } from '@/components/Badge'
import { SkeletonList } from '@/components/states/SkeletonList'
import { EmptyState } from '@/components/states/EmptyState'
import {
  useDictTypes,
  useDictItems,
  useCreateDictItem,
  useUpdateDictItem,
  useDeleteDictItem,
  type DictItem,
} from '@/services/dictService'

interface ItemForm {
  value: string
  label: string
  sortOrder: number
}

export default function DictManagePage() {
  const { data: types, isLoading: typesLoading } = useDictTypes()
  // 默认选中第一个类型；用户点击后以 override 为准（派生值，避免在 effect 内 setState）
  const [activeTypeOverride, setActiveTypeOverride] = useState<string | null>(null)
  const activeType = activeTypeOverride ?? types?.[0]?.code ?? null

  const { data: items, isLoading: itemsLoading } = useDictItems(activeType)
  const createMutation = useCreateDictItem()
  const updateMutation = useUpdateDictItem(activeType ?? '')
  const deleteMutation = useDeleteDictItem(activeType ?? '')

  const [editing, setEditing] = useState<DictItem | null>(null)
  const [creating, setCreating] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemForm>()

  function openCreate() {
    reset({ value: '', label: '', sortOrder: (items?.length ?? 0) + 1 })
    setCreating(true)
  }

  function openEdit(item: DictItem) {
    reset({ value: item.value, label: item.label, sortOrder: item.sortOrder })
    setEditing(item)
  }

  function closeModal() {
    setCreating(false)
    setEditing(null)
  }

  async function onSubmit(form: ItemForm) {
    if (!activeType) return
    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        body: { label: form.label, sortOrder: Number(form.sortOrder) },
      })
    } else {
      await createMutation.mutateAsync({
        typeCode: activeType,
        value: form.value.trim(),
        label: form.label.trim(),
        sortOrder: Number(form.sortOrder),
      })
    }
    closeModal()
  }

  async function toggleActive(item: DictItem) {
    await updateMutation.mutateAsync({ id: item.id, body: { isActive: !item.isActive } })
  }

  async function onDelete(item: DictItem) {
    if (!window.confirm(`确定删除字典项「${item.label}」？`)) return
    await deleteMutation.mutateAsync(item.id)
  }

  const modalOpen = creating || editing !== null

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-theme-text-main">数据字典</h1>
        <p className="text-sm text-theme-text-muted">维护资源类型、需求类型等下拉枚举，修改后前端实时生效</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        {/* 类型列表 */}
        <aside className="rounded-xl border border-theme-border bg-theme-surface p-2">
          {typesLoading ? (
            <SkeletonList count={4} />
          ) : (
            <nav className="space-y-1">
              {(types ?? []).map((t) => (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => setActiveTypeOverride(t.code)}
                  className={[
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    activeType === t.code
                      ? 'bg-theme-accent/10 text-theme-accent font-medium'
                      : 'text-theme-text-main hover:bg-stone-50',
                  ].join(' ')}
                >
                  <Icon icon={BookMarked} size={15} />
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* 字典项表格 */}
        <section className="rounded-xl border border-theme-border bg-theme-surface">
          <div className="flex items-center justify-between border-b border-theme-border px-4 py-3">
            <span className="text-sm font-medium text-theme-text-main">
              {types?.find((t) => t.code === activeType)?.name ?? '字典项'}
            </span>
            <Button size="sm" onClick={openCreate} disabled={!activeType}>
              <Icon icon={Plus} size={15} /> 新增字典项
            </Button>
          </div>

          {itemsLoading ? (
            <div className="p-4"><SkeletonList count={5} /></div>
          ) : !items || items.length === 0 ? (
            <EmptyState title="暂无字典项" description="点击右上角新增" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-theme-border text-left text-theme-text-muted">
                  <th className="px-4 py-2.5 font-medium">排序</th>
                  <th className="px-4 py-2.5 font-medium">字典值</th>
                  <th className="px-4 py-2.5 font-medium">展示名</th>
                  <th className="px-4 py-2.5 font-medium">状态</th>
                  <th className="px-4 py-2.5 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-theme-border/60 last:border-0">
                    <td className="px-4 py-2.5 text-theme-text-muted">{item.sortOrder}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-theme-text-muted">{item.value}</td>
                    <td className="px-4 py-2.5 text-theme-text-main">{item.label}</td>
                    <td className="px-4 py-2.5">
                      <button type="button" onClick={() => toggleActive(item)}>
                        <Badge variant={item.isActive ? 'success' : 'default'}>
                          {item.isActive ? '启用' : '停用'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-theme-accent transition-colors"
                          aria-label="编辑"
                        >
                          <Icon icon={Pencil} size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label="删除"
                        >
                          <Icon icon={Trash2} size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* 新增/编辑 模态 */}
      <Dialog open={modalOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-stone-900">
                {editing ? '编辑字典项' : '新增字典项'}
              </DialogTitle>
              <button type="button" onClick={closeModal} className="text-stone-400 hover:text-stone-600">
                <Icon icon={X} size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">字典值（英文 code）</label>
                <Input
                  placeholder="如 TECH_SERVICE"
                  error={!!errors.value}
                  disabled={!!editing}
                  {...register('value', { required: !editing })}
                />
                {editing && <p className="mt-1 text-xs text-stone-400">字典值创建后不可修改</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">展示名</label>
                <Input placeholder="如 技术服务" error={!!errors.label} {...register('label', { required: true })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">排序</label>
                <Input type="number" {...register('sortOrder', { valueAsNumber: true })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeModal}>取消</Button>
                <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                  保存
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
