import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, Switch } from '@headlessui/react'
import { Fragment } from 'react'
import { clsx } from 'clsx'
import { X, Users, Plus } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { FormField } from '@/components/FormField'
import { Input } from '@/components/Input'
import { EmptyState } from '@/components/states/EmptyState'
import { Spinner } from '@/components/Spinner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useMemberMe,
  useSubAccounts,
  useCreateSubAccount,
  useUpdateSubAccountStatus,
} from '@/services/memberService'

// ─── Schema ───────────────────────────────────────────────────────────────────

const createSchema = z
  .object({
    username: z
      .string()
      .min(4, '用户名至少4位')
      .max(50, '用户名不超过50位')
      .regex(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线'),
    password: z
      .string()
      .min(8, '密码至少8位')
      .max(20, '密码不超过20位')
      .regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/, '密码须同时包含字母和数字'),
    confirmPassword: z.string(),
    realName: z.string().max(50, '姓名不超过50字').optional(),
    phone: z
      .string()
      .regex(/^(1[3-9]\d{9})?$/, '手机号格式不正确')
      .optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

type CreateFormValues = z.infer<typeof createSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: number }) {
  const isActive = status === 1
  return (
    <div className="flex items-center gap-2">
      <span
        className={clsx(
          'h-2 w-2 rounded-full',
          isActive ? 'bg-emerald-500' : 'bg-red-500'
        )}
      />
      <span
        className={clsx(
          'text-sm',
          isActive ? 'text-emerald-700' : 'text-red-600'
        )}
      >
        {isActive ? '正常' : '已禁用'}
      </span>
    </div>
  )
}

// ─── Create Dialog (Headless UI) ──────────────────────────────────────────────

function CreateDialog({
  memberId,
  open,
  onClose,
}: {
  memberId: number
  open: boolean
  onClose: () => void
}) {
  const createAccount = useCreateSubAccount(memberId)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
  })

  function handleClose() {
    reset()
    setServerError(null)
    onClose()
  }

  async function onSubmit(values: CreateFormValues) {
    setServerError(null)
    try {
      await createAccount.mutateAsync({
        username: values.username,
        password: values.password,
        realName: values.realName || undefined,
        phone: values.phone || undefined,
      })
      handleClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg
      setServerError(msg ?? '创建失败，请稍后重试')
    }
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white shadow-nordic">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <DialogTitle className="text-base font-semibold text-theme-text-main">
                  新建子账号
                </DialogTitle>
                <button
                  onClick={handleClose}
                  className="text-stone-400 hover:text-stone-600 transition-colors rounded-lg p-1 hover:bg-stone-50"
                  aria-label="关闭"
                >
                  <Icon icon={X} size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                {serverError && (
                  <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                    {serverError}
                  </div>
                )}

                <FormField label="用户名" error={errors.username?.message} htmlFor="sub-username" required>
                  <Input
                    id="sub-username"
                    placeholder="4-50位，字母/数字/下划线"
                    autoComplete="off"
                    error={!!errors.username}
                    {...register('username')}
                  />
                </FormField>

                <FormField label="密码" error={errors.password?.message} htmlFor="sub-password" required>
                  <Input
                    id="sub-password"
                    type="password"
                    placeholder="8-20位，须同时含字母和数字"
                    autoComplete="new-password"
                    error={!!errors.password}
                    {...register('password')}
                  />
                </FormField>

                <FormField label="确认密码" error={errors.confirmPassword?.message} htmlFor="sub-confirm" required>
                  <Input
                    id="sub-confirm"
                    type="password"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                    error={!!errors.confirmPassword}
                    {...register('confirmPassword')}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="真实姓名" error={errors.realName?.message} htmlFor="sub-realName">
                    <Input id="sub-realName" placeholder="选填" error={!!errors.realName} {...register('realName')} />
                  </FormField>
                  <FormField label="手机号" error={errors.phone?.message} htmlFor="sub-phone">
                    <Input id="sub-phone" placeholder="选填" error={!!errors.phone} {...register('phone')} />
                  </FormField>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    disabled={createAccount.isPending}
                  >
                    取消
                  </Button>
                  <Button type="submit" loading={createAccount.isPending}>
                    创建账号
                  </Button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubAccountPage() {
  const { data: me, isLoading: meLoading } = useMemberMe()
  const memberId = me?.member?.id ?? null
  const { data: accounts, isLoading: listLoading } = useSubAccounts(memberId)
  const updateStatus = useUpdateSubAccountStatus(memberId)

  const [showCreate, setShowCreate] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const isMain = me?.isMainAccount ?? false

  async function handleToggleStatus(accountId: number, currentStatus: number) {
    const nextStatus = currentStatus === 1 ? 0 : 1
    const label = nextStatus === 0 ? '禁用' : '启用'
    if (!window.confirm(`确认${label}此子账号？`)) return
    setTogglingId(accountId)
    setToggleError(null)
    try {
      await updateStatus.mutateAsync({ accountId, status: nextStatus })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg
      const displayMsg = msg ?? `${label}失败，请稍后重试`
      setToggleError(displayMsg)
      alert(displayMsg)
    } finally {
      setTogglingId(null)
    }
  }

  if (meLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-theme-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {memberId !== null && (
        <CreateDialog
          memberId={memberId}
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      <section className="rounded-xl border border-stone-100 bg-white shadow-card">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-theme-text-main">子账号管理</h2>
            <p className="text-xs text-theme-text-muted mt-0.5">管理本单位下的操作账号</p>
          </div>
          {isMain && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Icon icon={Plus} size={16} />
              新建子账号
            </Button>
          )}
        </div>

        {/* Info banner for sub-accounts */}
        {!isMain && (
          <div className="mx-6 mt-4 rounded-lg bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-700">
            仅主账号可创建或禁用子账号，您可查看本单位账号列表。
          </div>
        )}

        {/* Toggle error */}
        {toggleError && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            <span>{toggleError}</span>
            <button
              onClick={() => setToggleError(null)}
              className="text-red-400 hover:text-red-600 ml-4 rounded-lg p-1 hover:bg-red-100 transition-colors"
              aria-label="关闭错误提示"
            >
              <Icon icon={X} size={18} />
            </button>
          </div>
        )}

        {/* List */}
        <div className="px-6 py-4">
          {listLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" className="text-theme-accent" />
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <EmptyState
              icon={Users}
              title="暂无子账号"
              description={isMain ? '点击右上角「新建子账号」开始添加' : '当前列表为空'}
              action={
                isMain ? (
                  <Button size="sm" onClick={() => setShowCreate(true)}>
                    <Icon icon={Plus} size={16} />
                    新建子账号
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 text-left text-xs text-stone-600 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3 rounded-tl-lg">用户名</th>
                    <th className="px-4 py-3">姓名</th>
                    <th className="px-4 py-3">手机号</th>
                    <th className="px-4 py-3">角色</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">最近登录</th>
                    {isMain && <th className="px-4 py-3 rounded-tr-lg">操作</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-stone-800">{acc.username}</td>
                      <td className="px-4 py-3 text-stone-700">
                        {acc.realName || <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {acc.phone || <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {acc.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {acc.roles.map((r) => (
                              <span
                                key={r}
                                className="rounded bg-stone-100 text-stone-600 text-xs px-1.5 py-0.5 font-mono"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-300 text-xs">无</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusDot status={acc.status} />
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs">
                        {acc.lastLoginAt
                          ? acc.lastLoginAt.slice(0, 16).replace('T', ' ')
                          : '—'}
                      </td>
                      {isMain && (
                        <td className="px-4 py-3">
                          <Switch
                            checked={acc.status === 1}
                            onChange={() => handleToggleStatus(acc.id, acc.status)}
                            disabled={togglingId === acc.id || updateStatus.isPending}
                            className={clsx(
                              'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 disabled:opacity-50',
                              acc.status === 1 ? 'bg-emerald-500' : 'bg-stone-300'
                            )}
                          >
                            <span
                              className={clsx(
                                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all duration-200',
                                acc.status === 1 ? 'translate-x-6' : 'translate-x-1'
                              )}
                            />
                          </Switch>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {accounts && accounts.length > 0 && (
          <div className="px-6 pb-4 text-xs text-stone-400">共 {accounts.length} 个子账号</div>
        )}
      </section>
    </div>
  )
}
