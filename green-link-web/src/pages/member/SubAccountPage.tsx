import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, Switch } from '@headlessui/react'
import { Fragment } from 'react'
import { clsx } from 'clsx'
import { X, Users, Plus, ShieldCheck } from 'lucide-react'
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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
  const isActive = status === 1
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border',
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-red-50 text-red-600 border-red-200',
      )}
    >
      <span
        className={clsx(
          'h-1.5 w-1.5 rounded-full',
          isActive ? 'bg-emerald-500' : 'bg-red-500',
        )}
      />
      {isActive ? '正常' : '已禁用'}
    </span>
  )
}

// ─── Create Dialog ────────────────────────────────────────────────────────────

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
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />
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
            <DialogPanel className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-nordic">
              {/* Dialog header */}
              <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Icon icon={Users} size={15} />
                  </div>
                  <DialogTitle className="text-base font-semibold text-stone-900">
                    新建子账号
                  </DialogTitle>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                  aria-label="关闭"
                >
                  <Icon icon={X} size={16} />
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

                <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
                  <Button type="button" variant="ghost" onClick={handleClose} disabled={createAccount.isPending}>
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
    <div className="flex flex-col gap-4">
      {memberId !== null && (
        <CreateDialog memberId={memberId} open={showCreate} onClose={() => setShowCreate(false)} />
      )}

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #164e63 0%, #0d9488 100%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div
          className="absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #67e8f9, transparent)' }}
        />

        <div className="relative flex items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Icon icon={Users} size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">子账号管理</h1>
              <p className="mt-0.5 text-sm text-cyan-100/75">管理本单位下的操作账号权限</p>
            </div>
          </div>

          {isMain && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-white/25 transition-all duration-150"
            >
              <Icon icon={Plus} size={15} />
              新建子账号
            </button>
          )}
        </div>
      </div>

      {/* ── Main card ── */}
      <div className="rounded-xl border border-stone-100 bg-white shadow-card overflow-hidden">

        {/* Sub-account info banner */}
        {!isMain && (
          <div className="mx-5 mt-4 flex items-center gap-2.5 rounded-lg bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-700">
            <Icon icon={ShieldCheck} size={15} className="shrink-0 text-sky-500" />
            仅主账号可创建或禁用子账号，您可查看本单位账号列表。
          </div>
        )}

        {/* Toggle error */}
        {toggleError && (
          <div className="mx-5 mt-4 flex items-center justify-between rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            <span>{toggleError}</span>
            <button
              onClick={() => setToggleError(null)}
              className="ml-4 rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
              aria-label="关闭"
            >
              <Icon icon={X} size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-4">
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
            <div className="overflow-x-auto -mx-1">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">用户名</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">姓名</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">手机号</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">角色</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">状态</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">最近登录</th>
                    {isMain && <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">启用</th>}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, idx) => (
                    <tr
                      key={acc.id}
                      className={clsx(
                        'transition-colors hover:bg-stone-50/80',
                        idx !== accounts.length - 1 && 'border-b border-stone-100/80',
                      )}
                    >
                      <td className="px-3 py-3 font-mono text-[13px] text-stone-800">{acc.username}</td>
                      <td className="px-3 py-3 text-stone-700">
                        {acc.realName || <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-stone-600 tabular-nums">
                        {acc.phone || <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {acc.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {acc.roles.map((r) => (
                              <span
                                key={r}
                                className="rounded-md bg-stone-100 text-stone-600 text-[11px] px-1.5 py-0.5 font-mono border border-stone-200/70"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={acc.status} />
                      </td>
                      <td className="px-3 py-3 text-stone-400 text-[12px] tabular-nums">
                        {acc.lastLoginAt ? acc.lastLoginAt.slice(0, 16).replace('T', ' ') : '—'}
                      </td>
                      {isMain && (
                        <td className="px-3 py-3">
                          <Switch
                            checked={acc.status === 1}
                            onChange={() => handleToggleStatus(acc.id, acc.status)}
                            disabled={togglingId === acc.id || updateStatus.isPending}
                            className={clsx(
                              'relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200',
                              'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
                              'disabled:opacity-40 disabled:cursor-not-allowed',
                              acc.status === 1 ? 'bg-emerald-500' : 'bg-stone-300',
                            )}
                          >
                            <span
                              className={clsx(
                                'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-all duration-200',
                                acc.status === 1 ? 'translate-x-[18px]' : 'translate-x-[3px]',
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
          <div className="border-t border-stone-100 px-5 py-3 text-[11px] text-stone-400">
            共 {accounts.length} 个子账号
          </div>
        )}
      </div>
    </div>
  )
}
