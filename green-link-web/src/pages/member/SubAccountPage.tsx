import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { Fragment } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'
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

function StatusBadge({ status }: { status: number }) {
  return status === 1 ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-0.5">
      正常
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-red-50 text-red-600 text-xs font-medium px-2.5 py-0.5">
      已禁用
    </span>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const INPUT_CLS =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition'

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
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <DialogTitle className="text-base font-semibold text-gray-900">
                  新建子账号
                </DialogTitle>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                {serverError && (
                  <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                    {serverError}
                  </div>
                )}

                <Field label="用户名 *" error={errors.username?.message}>
                  <input
                    {...register('username')}
                    placeholder="4-50位，字母/数字/下划线"
                    autoComplete="off"
                    className={INPUT_CLS}
                  />
                </Field>

                <Field label="密码 *" error={errors.password?.message}>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="8-20位，须同时含字母和数字"
                    autoComplete="new-password"
                    className={INPUT_CLS}
                  />
                </Field>

                <Field label="确认密码 *" error={errors.confirmPassword?.message}>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                    className={INPUT_CLS}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="真实姓名" error={errors.realName?.message}>
                    <input {...register('realName')} placeholder="选填" className={INPUT_CLS} />
                  </Field>
                  <Field label="手机号" error={errors.phone?.message}>
                    <input {...register('phone')} placeholder="选填" className={INPUT_CLS} />
                  </Field>
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
      setToggleError(msg ?? `${label}失败，请稍后重试`)
    } finally {
      setTogglingId(null)
    }
  }

  if (meLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-brand-500" />
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

      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">子账号管理</h2>
            <p className="text-xs text-gray-400 mt-0.5">管理本单位下的操作账号</p>
          </div>
          {isMain && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              + 新建子账号
            </Button>
          )}
        </div>

        {/* Info banner for sub-accounts */}
        {!isMain && (
          <div className="mx-6 mt-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
            仅主账号可创建或禁用子账号，您可查看本单位账号列表。
          </div>
        )}

        {/* Toggle error */}
        {toggleError && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            <span>{toggleError}</span>
            <button
              onClick={() => setToggleError(null)}
              className="text-red-400 hover:text-red-600 ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* List */}
        <div className="px-6 py-4">
          {listLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" className="text-brand-500" />
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              暂无子账号
              {isMain && <p className="mt-1">点击右上角「新建子账号」开始添加</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-400 font-medium">
                    <th className="pb-3 pr-4 font-medium">用户名</th>
                    <th className="pb-3 pr-4 font-medium">姓名</th>
                    <th className="pb-3 pr-4 font-medium">手机号</th>
                    <th className="pb-3 pr-4 font-medium">角色</th>
                    <th className="pb-3 pr-4 font-medium">状态</th>
                    <th className="pb-3 pr-4 font-medium">最近登录</th>
                    {isMain && <th className="pb-3 font-medium">操作</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4 font-mono text-gray-800">{acc.username}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        {acc.realName || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {acc.phone || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 pr-4">
                        {acc.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {acc.roles.map((r) => (
                              <span
                                key={r}
                                className="rounded bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 font-mono"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">无</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={acc.status} />
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {acc.lastLoginAt
                          ? acc.lastLoginAt.slice(0, 16).replace('T', ' ')
                          : '—'}
                      </td>
                      {isMain && (
                        <td className="py-3">
                          <Button
                            variant={acc.status === 1 ? 'ghost' : 'secondary'}
                            size="sm"
                            loading={togglingId === acc.id}
                            onClick={() => handleToggleStatus(acc.id, acc.status)}
                            className={
                              acc.status === 1
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-emerald-600 border-emerald-300 hover:bg-emerald-50'
                            }
                          >
                            {acc.status === 1 ? '禁用' : '启用'}
                          </Button>
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
          <div className="px-6 pb-4 text-xs text-gray-400">共 {accounts.length} 个子账号</div>
        )}
      </section>
    </div>
  )
}
