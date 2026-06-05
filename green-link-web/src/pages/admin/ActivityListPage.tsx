import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Button } from '@/components/Button'
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
  { value: 3, label: '进行中' },
  { value: 4, label: '已结束' },
  { value: 5, label: '已取消' },
]

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
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => updateActivityStatus(id, status),
    onSuccess: () => refetchActivities(),
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

  return (
    <div className="space-y-4">
      {/* 顶部筛选与操作 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => openActivityModal()}>
          新建活动
        </Button>
      </div>

      {/* 活动列表 */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="px-4 py-3 font-medium">活动标题</th>
              <th className="px-4 py-3 font-medium">地点</th>
              <th className="px-4 py-3 font-medium">开始时间</th>
              <th className="px-4 py-3 font-medium">报名截止</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">报名/容量</th>
              <th className="px-4 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activityPage?.records.map((activity) => {
              const statusInfo = ACTIVITY_STATUS_MAP[activity.status] ?? { label: '未知', color: 'bg-gray-100 text-gray-500' }
              return (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{activity.title}</td>
                  <td className="px-4 py-3 text-gray-500">{activity.location ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(activity.startTime)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(activity.regDeadline)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {activity.regCount}
                    {activity.maxCapacity ? ` / ${activity.maxCapacity}` : ' / 不限'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openSignupModal(activity)} className="text-xs text-brand-600 hover:underline">
                        报名列表
                      </button>
                      <button onClick={() => openActivityModal(activity)} className="text-xs text-brand-600 hover:underline">
                        编辑
                      </button>
                      <select
                        value={activity.status}
                        onChange={(e) =>
                          statusMutation.mutate({ id: activity.id, status: Number(e.target.value) })
                        }
                        className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        {Object.entries(ACTIVITY_STATUS_MAP).map(([val, info]) => (
                          <option key={val} value={val}>
                            {info.label}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => handleDelete(activity.id)} className="text-xs text-red-500 hover:underline">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {(!activityPage?.records || activityPage.records.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  暂无活动数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
        <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
          <DialogTitle className="text-base font-semibold text-gray-800">
            {isEdit ? '编辑活动' : '新建活动'}
          </DialogTitle>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">活动标题</label>
              <Input {...register('title', { required: '请输入标题' })} placeholder="活动名称" error={!!errors.title} />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">活动地点</label>
              <Input {...register('location')} placeholder="如 济南市国际会展中心" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">开始时间</label>
                <Input type="datetime-local" {...register('startTime')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">结束时间</label>
                <Input type="datetime-local" {...register('endTime')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">报名截止</label>
                <Input type="datetime-local" {...register('regDeadline')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">最大容量</label>
                <Input type="number" {...register('maxCapacity', { valueAsNumber: true })} placeholder="不限则留空" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
              <select
                {...register('status', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(ACTIVITY_STATUS_MAP).map(([val, info]) => (
                  <option key={val} value={val}>
                    {info.label}
                  </option>
                ))}
              </select>
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

/* ───────── 报名列表弹窗组件 ───────── */

interface SignupModalProps {
  open: boolean
  onClose: () => void
  activity: Activity | null
  signups: Signup[]
  onCheckin: (signupId: number) => void
  checkinPending: boolean
}

function SignupModal({ open, onClose, activity, signups, onCheckin, checkinPending }: SignupModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
          <DialogTitle className="text-base font-semibold text-gray-800">
            {activity?.title ?? '活动'} — 报名列表
          </DialogTitle>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="pb-2 font-medium">报名人ID</th>
                  <th className="pb-2 font-medium">会员ID</th>
                  <th className="pb-2 font-medium">备注</th>
                  <th className="pb-2 font-medium">状态</th>
                  <th className="pb-2 font-medium">报名时间</th>
                  <th className="pb-2 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {signups.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-2.5 text-gray-800">{s.accountId}</td>
                    <td className="py-2.5 text-gray-500">{s.memberId}</td>
                    <td className="py-2.5 text-gray-500">{s.remark ?? '-'}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.status === 2
                            ? 'bg-brand-100 text-brand-700'
                            : s.status === 3
                              ? 'bg-gray-100 text-gray-500 line-through'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {SIGNUP_STATUS_MAP[s.status] ?? '未知'}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 text-right">
                      {s.status === 1 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={checkinPending}
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
                    <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                      暂无报名记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              关闭
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
