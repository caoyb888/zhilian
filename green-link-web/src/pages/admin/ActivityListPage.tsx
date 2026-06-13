import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { clsx } from 'clsx'
import {
  X,
  Pencil,
  Trash2,
  ArrowUpDown,
  Users,
  Search,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { SkeletonList } from '@/components/states/SkeletonList'
import { EmptyState } from '@/components/states/EmptyState'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/Input'
import {
  fetchActivities,
  fetchSignups,
  createActivity,
  updateActivity,
  deleteActivity,
  updateActivityStatus,
  checkinSignup,
  type Activity,
  type Signup,
  type CreateActivityRequest,
  type UpdateActivityRequest,
  ACTIVITY_STATUS_MAP,
  SIGNUP_STATUS_MAP,
} from '@/services/activityService'

const STATUS_TABS = [
  { value: undefined, label: '全部' },
  { value: 1, label: '筹备中' },
  { value: 2, label: '报名中' },
  { value: 3, label: '已结束' },
]

function ActivityStatusBadge({ status }: { status: number }) {
  const info = ACTIVITY_STATUS_MAP[status]
  if (!info) return <Badge variant="default">未知</Badge>
  if (status === 1) return <Badge variant="default">{info.label}</Badge>
  if (status === 2) return <Badge variant="success">{info.label}</Badge>
  return <Badge variant="error">{info.label}</Badge>
}

function SignupStatusBadge({ status }: { status: number }) {
  if (status === 2) return <Badge variant="success">{SIGNUP_STATUS_MAP[status]}</Badge>
  if (status === 3) return <Badge variant="error">{SIGNUP_STATUS_MAP[status]}</Badge>
  return <Badge variant="default">{SIGNUP_STATUS_MAP[status] ?? '未知'}</Badge>
}

export default function ActivityListPage() {
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [viewActivity, setViewActivity] = useState<Activity | null>(null)

  const { data: activityPage, refetch: refetchActivities } = useQuery({
    queryKey: ['activities', statusFilter],
    queryFn: () => fetchActivities({ status: statusFilter, page: 1, size: 50 }),
  })

  const { data: signupsPage, refetch: refetchSignups } = useQuery({
    queryKey: ['signups', viewActivity?.id],
    queryFn: () => fetchSignups(viewActivity!.id, { page: 1, size: 100 }),
    enabled: !!viewActivity,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => refetchActivities(),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg ?? '删除失败'
      alert(msg)
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => updateActivityStatus(id, status),
    onSuccess: () => refetchActivities(),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg ?? '状态变更失败'
      alert(msg)
    },
  })

  const checkinMutation = useMutation({
    mutationFn: ({ activityId, signupId }: { activityId: number; signupId: number }) =>
      checkinSignup(activityId, signupId),
    onSuccess: () => refetchSignups(),
  })

  function handleDelete(id: number) {
    if (confirm('确定删除该活动？')) {
      deleteMutation.mutate(id)
    }
  }

  function openActivityModal(activity?: Activity) {
    setEditingActivity(activity ?? null)
    setActivityModalOpen(true)
  }

  function openSignupModal(activity: Activity) {
    setViewActivity(activity)
    setSignupModalOpen(true)
  }

  function formatDateTime(dt: string | null) {
    if (!dt) return '-'
    const d = new Date(dt)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const records = activityPage?.records ?? []

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-theme-text-main">活动管理</h1>
          <p className="mt-0.5 text-sm text-theme-text-muted">协会活动发布与报名管理</p>
        </div>
        <Button size="sm" onClick={() => openActivityModal()}>
          新建活动
        </Button>
      </div>

      {/* status tabs */}
      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
              statusFilter === tab.value
                ? 'bg-theme-accent text-white'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700/60'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80">
        {!activityPage ? (
          <div className="p-4">
            <SkeletonList count={5} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={Search}
            title="暂无活动数据"
            description="当前没有符合条件的活动"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">活动标题</th>
                  <th className="px-4 py-3">地点</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      开始时间
                      <Icon icon={ArrowUpDown} size={12} className="text-slate-500" />
                    </span>
                  </th>
                  <th className="px-4 py-3">报名截止</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      报名/容量
                      <Icon icon={ArrowUpDown} size={12} className="text-slate-500" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-t border-slate-800/60 transition-colors hover:bg-slate-800/40/80"
                  >
                    <td className="px-4 py-3 font-medium text-slate-100">{activity.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{activity.location ?? '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">{formatDateTime(activity.startTime)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">{formatDateTime(activity.regDeadline)}</td>
                    <td className="px-4 py-3">
                      <ActivityStatusBadge status={activity.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {activity.regCount}
                      {activity.maxCapacity ? ` / ${activity.maxCapacity}` : ' / 不限'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 p-0.5">
                        <button
                          className="rounded p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-700/60 hover:text-emerald-400"
                          onClick={() => openSignupModal(activity)}
                          title="报名列表"
                        >
                          <Icon icon={Users} size={14} />
                        </button>
                        <button
                          className="rounded p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-700/60 hover:text-emerald-400"
                          onClick={() => openActivityModal(activity)}
                          title="编辑"
                        >
                          <Icon icon={Pencil} size={14} />
                        </button>
                        <select
                          value={activity.status}
                          onChange={(e) => {
                            const newStatus = Number(e.target.value)
                            const label = ACTIVITY_STATUS_MAP[newStatus]?.label ?? newStatus
                            if (confirm(`确定将活动状态变更为「${label}」？`)) {
                              statusMutation.mutate({ id: activity.id, status: newStatus })
                            }
                          }}
                          className="rounded border border-slate-700/60 bg-white px-1.5 py-0.5 text-xs text-slate-300 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-theme-accent"
                        >
                          {Object.entries(ACTIVITY_STATUS_MAP).map(([val, info]) => (
                            <option key={val} value={val}>
                              {info.label}
                            </option>
                          ))}
                        </select>
                        <button
                          className="rounded p-1.5 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(activity.id)}
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
          </div>
        )}
      </div>

      {/* 活动弹窗 */}
      <ActivityModal
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        activity={editingActivity}
        onSuccess={() => {
          refetchActivities()
          setActivityModalOpen(false)
        }}
      />

      {/* 报名列表弹窗 */}
      <SignupModal
        open={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        activity={viewActivity}
        signups={signupsPage?.records ?? []}
        onCheckin={(signupId) =>
          checkinMutation.mutate({ activityId: viewActivity!.id, signupId })
        }
        checkinPending={checkinMutation.isPending}
        checkinTargetId={checkinMutation.variables?.signupId}
      />
    </div>
  )
}

/* ───────── 活动弹窗组件 ───────── */

interface ActivityModalProps {
  open: boolean
  onClose: () => void
  activity: Activity | null
  onSuccess: () => void
}

function ActivityModal({ open, onClose, activity, onSuccess }: ActivityModalProps) {
  const isEdit = !!activity
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateActivityRequest>({
    defaultValues: {
      title: activity?.title ?? '',
      location: activity?.location ?? '',
      startTime: activity?.startTime ? activity.startTime.slice(0, 16) : '',
      endTime: activity?.endTime ? activity.endTime.slice(0, 16) : '',
      regDeadline: activity?.regDeadline ? activity.regDeadline.slice(0, 16) : '',
      maxCapacity: activity?.maxCapacity ?? undefined,
      status: activity?.status ?? 1,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: activity?.title ?? '',
        location: activity?.location ?? '',
        startTime: activity?.startTime ? activity.startTime.slice(0, 16) : '',
        endTime: activity?.endTime ? activity.endTime.slice(0, 16) : '',
        regDeadline: activity?.regDeadline ? activity.regDeadline.slice(0, 16) : '',
        maxCapacity: activity?.maxCapacity ?? undefined,
        status: activity?.status ?? 1,
      })
    }
  }, [open, activity, reset])

  const mutation = useMutation({
    mutationFn: (data: CreateActivityRequest | UpdateActivityRequest) =>
      isEdit ? updateActivity(activity!.id, data as UpdateActivityRequest) : createActivity(data),
    onSuccess,
  })

  function onSubmit(data: CreateActivityRequest) {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-100">
              {isEdit ? '编辑活动' : '新建活动'}
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
                <label className="mb-1 block text-sm font-medium text-slate-300">活动标题</label>
                <Input {...register('title', { required: '请输入标题' })} placeholder="活动名称" error={!!errors.title} />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">活动地点</label>
                <Input {...register('location')} placeholder="如 济南市国际会展中心" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">开始时间</label>
                  <Input type="datetime-local" {...register('startTime')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">结束时间</label>
                  <Input type="datetime-local" {...register('endTime')} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">报名截止</label>
                  <Input type="datetime-local" {...register('regDeadline')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">最大容量</label>
                  <Input type="number" {...register('maxCapacity', { valueAsNumber: true })} placeholder="不限则留空" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">状态</label>
                <select
                  {...register('status', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                >
                  {Object.entries(ACTIVITY_STATUS_MAP).map(([val, info]) => (
                    <option key={val} value={val}>
                      {info.label}
                    </option>
                  ))}
                </select>
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

/* ───────── 报名列表弹窗组件 ───────── */

interface SignupModalProps {
  open: boolean
  onClose: () => void
  activity: Activity | null
  signups: Signup[]
  onCheckin: (signupId: number) => void
  checkinPending: boolean
  checkinTargetId?: number
}

function SignupModal({ open, onClose, activity, signups, onCheckin, checkinPending, checkinTargetId }: SignupModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-100">
              {activity?.title ?? '活动'} — 报名列表
            </DialogTitle>
            <button
              className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
              onClick={onClose}
              aria-label="关闭"
            >
              <Icon icon={X} size={18} />
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">报名人ID</th>
                    <th className="px-4 py-3">会员ID</th>
                    <th className="px-4 py-3">备注</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        报名时间
                        <Icon icon={ArrowUpDown} size={12} className="text-slate-500" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-slate-800/60 transition-colors hover:bg-slate-800/40/80"
                    >
                      <td className="px-4 py-3 text-sm text-slate-100">{s.accountId}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{s.memberId}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{s.remark ?? '-'}</td>
                      <td className="px-4 py-3">
                        <SignupStatusBadge status={s.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">
                        {new Date(s.createdAt).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.status === 1 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={checkinPending && checkinTargetId === s.id}
                            onClick={() => onCheckin(s.id)}
                          >
                            签到
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {signups.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                        暂无报名记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800/60 px-6 py-4">
            <Button variant="ghost" onClick={onClose}>
              关闭
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
