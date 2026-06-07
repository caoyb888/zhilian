import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useBlocker } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, Clock,
  FileText, MapPin, Tag, X,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { PortalNav } from '@/business/PortalNav'
import { FormField } from '@/components/FormField'
import { Spinner } from '@/components/Spinner'
import { RichEditor } from '@/components/RichEditor'
import { FileUploader } from '@/components/FileUploader'
import { fetchTagCategories, fetchTags } from '@/services/tagService'
import {
  useCreateDemand,
  DEMAND_TYPE_LABELS,
  DEMAND_TYPES,
  PROVINCES,
  type CreateDemandBody,
} from '@/services/supplyService'
import { uploadFileWithProgress } from '@/services/fileService'
import type { FileUploadResult } from '@/services/fileService'

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'gl-draft-demand'
const MAX_TAGS = 10
const MAX_ATTACHMENTS = 10

const STEP_LABELS = ['基本信息', '详细描述', '标签附件', '预览提交'] as const

// ─── Zod schema ───────────────────────────────────────────────────────────────

const attachmentItemSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string(),
  fileSize: z.number().nullish(),
  fileType: z.string().nullish(),
  sortOrder: z.number().optional(),
})

const schema = z.object({
  type: z.string().min(1, '请选择需求类型'),
  title: z.string().min(1, '标题不能为空').max(300, '标题不超过300字'),
  summary: z.string().max(500, '摘要不超过500字'),
  province: z.string(),
  cooperationMode: z.string(),
  budgetMin: z.string(),
  budgetMax: z.string(),
  deadline: z.string(),
  content: z.string(),
  tagIds: z.array(z.number()),
  attachments: z.array(attachmentItemSchema),
})

type FormValues = z.infer<typeof schema>

// ─── Tag groups ───────────────────────────────────────────────────────────────

interface TagGroup {
  categoryId: number
  categoryName: string
  tags: { id: number; name: string }[]
}

function useTagGroups() {
  return useQuery<TagGroup[]>({
    queryKey: ['tags', 'publish-groups'],
    queryFn: async () => {
      const cats = await fetchTagCategories()
      const groups = await Promise.all(
        cats.map(async (cat) => {
          const page = await fetchTags({ categoryId: cat.id, size: 100 })
          return {
            categoryId: cat.id,
            categoryName: cat.name,
            tags: page.records.filter((t) => t.isDeleted === 0).map((t) => ({ id: t.id, name: t.name })),
          }
        }),
      )
      return groups.filter((g) => g.tags.length > 0)
    },
    staleTime: 10 * 60 * 1000,
  })
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <>
      <nav className="hidden sm:flex items-center justify-center gap-0 mb-8">
        {STEP_LABELS.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${done ? 'bg-blue-500 text-white' : active ? 'bg-theme-accent text-white ring-4 ring-blue-100' : 'bg-stone-100 text-stone-400'}`}>
                  {done ? <Icon icon={CheckCircle2} size={16} /> : i + 1}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-theme-accent' : done ? 'text-blue-600' : 'text-stone-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`mx-3 mt-[-14px] h-0.5 w-12 transition-colors ${done ? 'bg-blue-400' : 'bg-stone-200'}`} />
              )}
            </div>
          )
        })}
      </nav>

      <div className="sm:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-stone-700">
            步骤 {current + 1}/{STEP_LABELS.length}：{STEP_LABELS[current]}
          </span>
          <span className="text-xs text-stone-400">{Math.round(((current + 1) / STEP_LABELS.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
          <div className="h-full rounded-full bg-theme-accent transition-all duration-300" style={{ width: `${((current + 1) / STEP_LABELS.length) * 100}%` }} />
        </div>
      </div>
    </>
  )
}

// ─── Step 1 — 基本信息 ─────────────────────────────────────────────────────────

const TYPE_BADGE_CLASS: Record<string, string> = {
  PRODUCT: 'border-orange-300 bg-orange-50 text-orange-800',
  TECHNOLOGY: 'border-blue-300 bg-blue-50 text-blue-800',
  TALENT: 'border-purple-300 bg-purple-50 text-purple-800',
}

const TYPE_EMOJI: Record<string, string> = {
  PRODUCT: '🛒',
  TECHNOLOGY: '🔬',
  TALENT: '👥',
}

function Step1BasicInfo() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FormValues>()
  const selectedType = watch('type')

  return (
    <div className="space-y-6">
      <FormField label="需求类型" required error={errors.type?.message}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMAND_TYPES.map((t) => {
            const active = selectedType === t
            const cls = TYPE_BADGE_CLASS[t] ?? 'border-stone-300 bg-stone-50 text-stone-800'
            return (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t, { shouldValidate: true, shouldDirty: true })}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 ${active ? `${cls} shadow-sm` : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'}`}
              >
                <span className="text-xl">{TYPE_EMOJI[t]}</span>
                {DEMAND_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>
      </FormField>

      <FormField label="需求标题" htmlFor="title" required error={errors.title?.message}>
        <input
          id="title"
          type="text"
          placeholder="请输入需求标题，如：寻求光伏组件封装技术合作"
          className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all duration-200"
          {...register('title')}
        />
      </FormField>

      <FormField label="需求摘要" htmlFor="summary" error={errors.summary?.message} hint="一句话描述您的需求（不超过500字）">
        <textarea
          id="summary"
          rows={3}
          placeholder="简要描述您的需求..."
          className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all duration-200 resize-none"
          {...register('summary')}
        />
      </FormField>

      <FormField label="期望省份" htmlFor="province" error={errors.province?.message}>
        <select
          id="province"
          className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all duration-200"
          {...register('province')}
        >
          <option value="">不限省份</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </FormField>

      <FormField label="合作方式" htmlFor="cooperationMode" error={errors.cooperationMode?.message}>
        <input
          id="cooperationMode"
          type="text"
          placeholder="如：技术合作、购买服务、人才引进..."
          className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all duration-200"
          {...register('cooperationMode')}
        />
      </FormField>

      {/* Budget range */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="预算下限（万元）" htmlFor="budgetMin" error={errors.budgetMin?.message} hint="留空表示面议">
          <input
            id="budgetMin"
            type="number"
            min="0"
            step="0.01"
            placeholder="如：50"
            className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all duration-200"
            {...register('budgetMin')}
          />
        </FormField>
        <FormField label="预算上限（万元）" htmlFor="budgetMax" error={errors.budgetMax?.message}>
          <input
            id="budgetMax"
            type="number"
            min="0"
            step="0.01"
            placeholder="如：200"
            className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all duration-200"
            {...register('budgetMax')}
          />
        </FormField>
      </div>

      <FormField label="截止日期" htmlFor="deadline" error={errors.deadline?.message}>
        <input
          id="deadline"
          type="date"
          className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all duration-200"
          {...register('deadline')}
        />
      </FormField>
    </div>
  )
}

// ─── Step 2 — 详细描述 ─────────────────────────────────────────────────────────

function Step2Content({ imageUploadFn }: { imageUploadFn: (file: File) => Promise<string> }) {
  const { watch, setValue } = useFormContext<FormValues>()
  const content = watch('content')
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-stone-700 mb-1.5">
          详细描述
          <span className="ml-1 text-xs text-stone-400 font-normal">（可插入图片，图片自动上传至云端）</span>
        </p>
        <RichEditor
          key="demand-content"
          defaultValue={content}
          onChange={(html) => setValue('content', html, { shouldDirty: true })}
          minHeight={400}
          imageUploadFn={imageUploadFn}
        />
        <p className="mt-2 text-xs text-stone-400">支持富文本格式，可插入图片、设置标题、添加链接等</p>
      </div>
    </div>
  )
}

// ─── Step 3 — 标签与附件 ───────────────────────────────────────────────────────

function Step3TagsAttachments({ tagGroups, tagsLoading }: { tagGroups: TagGroup[]; tagsLoading: boolean }) {
  const { watch, setValue, formState: { errors } } = useFormContext<FormValues>()
  const tagIds = watch('tagIds')
  const [tagLimitError, setTagLimitError] = useState('')

  function toggleTag(tagId: number) {
    if (tagIds.includes(tagId)) {
      setValue('tagIds', tagIds.filter((id) => id !== tagId), { shouldDirty: true })
      setTagLimitError('')
    } else {
      if (tagIds.length >= MAX_TAGS) { setTagLimitError(`最多只能选择 ${MAX_TAGS} 个标签`); return }
      setTagLimitError('')
      setValue('tagIds', [...tagIds, tagId], { shouldDirty: true })
    }
  }

  function handleAttachmentsChange(results: FileUploadResult[]) {
    setValue(
      'attachments',
      results.map((r, i) => ({ fileName: r.fileName, fileUrl: r.fileUrl, fileSize: r.fileSize ?? null, fileType: r.mimeType ?? null, sortOrder: i })),
      { shouldDirty: true },
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-stone-700">
            标签选择
            <span className="ml-1 text-xs text-stone-400 font-normal">（最多 {MAX_TAGS} 个）</span>
          </p>
          {tagIds.length > 0 && (
            <span className="text-xs text-stone-500">已选 <span className="font-semibold text-theme-accent">{tagIds.length}</span> / {MAX_TAGS}</span>
          )}
        </div>

        {(tagLimitError || errors.tagIds?.message) && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
            <Icon icon={AlertCircle} size={14} className="flex-shrink-0" />
            {tagLimitError || errors.tagIds?.message}
          </div>
        )}

        {tagIds.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {tagGroups.flatMap((g) => g.tags).filter((t) => tagIds.includes(t.id)).map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                #{t.name}
                <button type="button" onClick={() => toggleTag(t.id)} className="rounded-full hover:text-blue-900 transition-colors" aria-label={`移除标签 ${t.name}`}>
                  <Icon icon={X} size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {tagsLoading ? (
          <div className="flex justify-center py-8"><Spinner size="sm" className="text-stone-300" /></div>
        ) : tagGroups.length === 0 ? (
          <p className="text-sm text-stone-400 py-4">暂无可用标签</p>
        ) : (
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {tagGroups.map((group) => (
              <div key={group.categoryId}>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">{group.categoryName}</p>
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag) => {
                    const selected = tagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${selected ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700 mb-3">
          附件上传
          <span className="ml-1 text-xs text-stone-400 font-normal">（最多 {MAX_ATTACHMENTS} 个，单文件 ≤ 20MB）</span>
        </p>
        <FileUploader
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
          maxFiles={MAX_ATTACHMENTS}
          maxSizeMB={20}
          bizType="DEMAND"
          onChange={handleAttachmentsChange}
        />
      </div>
    </div>
  )
}

// ─── Step 4 — 预览与提交 ───────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-20 flex-shrink-0 text-xs text-stone-400 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function Step4Preview() {
  const { watch } = useFormContext<FormValues>()
  const values = watch()
  const typeLabel = DEMAND_TYPE_LABELS[values.type] ?? values.type

  function budgetText() {
    const min = values.budgetMin !== '' ? parseFloat(values.budgetMin) : null
    const max = values.budgetMax !== '' ? parseFloat(values.budgetMax) : null
    const hasMin = min !== null && !isNaN(min)
    const hasMax = max !== null && !isNaN(max)
    if (!hasMin && !hasMax) return '面议'
    if (hasMin && hasMax) return `${min} – ${max} 万元`
    if (hasMin) return `${min} 万元起`
    return `≤ ${max} 万元`
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-stone-700 pb-2 border-b border-stone-200">信息预览（提交后进入人工审核）</h3>

        <Row label="需求类型">
          <span className="rounded-md bg-white border border-stone-200 px-2.5 py-0.5 text-xs font-semibold">{typeLabel || '—'}</span>
        </Row>
        <Row label="需求标题">
          <span className="text-sm font-medium text-stone-900">{values.title || '—'}</span>
        </Row>
        {values.summary && (
          <Row label="摘要"><span className="text-sm text-stone-700">{values.summary}</span></Row>
        )}
        {values.province && (
          <Row label="期望省份">
            <span className="flex items-center gap-1 text-sm text-stone-700">
              <Icon icon={MapPin} size={13} className="text-stone-400" />
              {values.province}
            </span>
          </Row>
        )}
        {values.cooperationMode && (
          <Row label="合作方式"><span className="text-sm text-stone-700">{values.cooperationMode}</span></Row>
        )}
        <Row label="预算">
          <span className="text-sm text-stone-700">{budgetText()}</span>
        </Row>
        {values.deadline && (
          <Row label="截止日期">
            <span className="flex items-center gap-1 text-sm text-stone-700">
              <Icon icon={Clock} size={13} className="text-stone-400" />
              {values.deadline}
            </span>
          </Row>
        )}
        <Row label="详细描述">
          <span className="text-sm text-stone-500">{values.content ? '已填写（富文本内容）' : '未填写'}</span>
        </Row>
        <Row label="标签">
          {values.tagIds.length > 0 ? (
            <span className="flex items-center gap-1 text-sm text-stone-700">
              <Icon icon={Tag} size={13} className="text-stone-400" />
              已选 {values.tagIds.length} 个标签
            </span>
          ) : (
            <span className="text-sm text-stone-400">未选择</span>
          )}
        </Row>
        <Row label="附件">
          {values.attachments.length > 0 ? (
            <span className="flex items-center gap-1 text-sm text-stone-700">
              <Icon icon={FileText} size={13} className="text-stone-400" />
              {values.attachments.length} 个附件
            </span>
          ) : (
            <span className="text-sm text-stone-400">未上传</span>
          )}
        </Row>
      </div>
      <p className="text-xs text-stone-400 text-center">提交后，需求将进入审核流程，通常在 1 个工作日内完成审核</p>
    </div>
  )
}

// ─── Leave blocker modal ──────────────────────────────────────────────────────

function LeaveBlockerModal({ onProceed, onStay }: { onProceed: () => void; onStay: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative rounded-2xl bg-white p-8 shadow-xl max-w-sm w-full mx-4">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 mx-auto">
          <Icon icon={AlertCircle} size={24} />
        </div>
        <h3 className="text-center text-base font-semibold text-stone-900 mb-2">确认离开？</h3>
        <p className="text-center text-sm text-stone-500 mb-6">您有未保存的内容，离开后草稿将不会自动保存，请确认操作。</p>
        <div className="flex gap-3">
          <button type="button" onClick={onStay} className="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-all duration-200">继续编辑</button>
          <button type="button" onClick={onProceed} className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-all duration-200">确认离开</button>
        </div>
      </div>
    </div>
  )
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({ onPublishAnother }: { onPublishAnother: () => void }) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-12 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
        <Icon icon={CheckCircle2} size={36} />
      </div>
      <h2 className="text-xl font-bold text-stone-900 mb-2">发布成功</h2>
      <p className="text-sm text-stone-500 mb-8">您的需求已提交审核，管理员审核通过后即可在平台展示，通常 1 个工作日内完成。</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/supply/demands" className="rounded-lg border border-stone-200 px-6 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-all duration-200">返回需求列表</Link>
        <button type="button" onClick={onPublishAnother} className="rounded-lg bg-theme-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200">继续发布需求</button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_VALUES: FormValues = {
  type: '',
  title: '',
  summary: '',
  province: '',
  cooperationMode: '',
  budgetMin: '',
  budgetMax: '',
  deadline: '',
  content: '',
  tagIds: [],
  attachments: [],
}

export default function SupplyDemandPublishPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  const { formState: { isDirty }, getValues, reset, trigger } = form

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as Partial<FormValues>
      const hasContent = !!(parsed.title || parsed.content || (parsed.tagIds?.length ?? 0) > 0)
      if (hasContent) {
        reset({ ...DEFAULT_VALUES, ...parsed }, { keepDefaultValues: false })
        setDraftRestored(true)
      }
    } catch {
      // ignore corrupt draft
    }
  }, [reset])

  useEffect(() => {
    const id = setInterval(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues())) } catch { /* ignore */ }
    }, 30_000)
    return () => clearInterval(id)
  }, [getValues])

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && !submitSuccess) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty, submitSuccess])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !submitSuccess && currentLocation.pathname !== nextLocation.pathname,
  )

  const imageUploadFn = useCallback(async (file: File): Promise<string> => {
    const result = await uploadFileWithProgress(file, { bizType: 'DEMAND' })
    return result.fileUrl
  }, [])

  const { data: tagGroups = [], isLoading: tagsLoading } = useTagGroups()

  async function goNext() {
    if (currentStep === 0) {
      const ok = await trigger(['type', 'title'])
      if (!ok) return
    }
    setCurrentStep((s) => Math.min(s + 1, STEP_LABELS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function saveDraftNow() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues())) } catch { /* ignore */ }
  }

  const createMutation = useCreateDemand()

  const onSubmit = form.handleSubmit(async (values) => {
    const toNum = (s: string) => { const n = parseFloat(s); return isNaN(n) ? null : n }
    const body: CreateDemandBody = {
      type: values.type,
      title: values.title,
      content: values.content || undefined,
      summary: values.summary || undefined,
      province: values.province || undefined,
      cooperationMode: values.cooperationMode || undefined,
      budgetMin: toNum(values.budgetMin),
      budgetMax: toNum(values.budgetMax),
      deadline: values.deadline || undefined,
      tagIds: values.tagIds.length > 0 ? values.tagIds : undefined,
      attachments: values.attachments.length > 0 ? values.attachments : undefined,
    }
    await createMutation.mutateAsync(body)
    localStorage.removeItem(DRAFT_KEY)
    setSubmitSuccess(true)
  })

  function handlePublishAnother() {
    reset(DEFAULT_VALUES)
    setCurrentStep(0)
    setSubmitSuccess(false)
    setDraftRestored(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <PortalNav />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/supply/demands" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors">
          <Icon icon={ArrowLeft} size={16} />
          返回需求列表
        </Link>

        <h1 className="text-2xl font-bold text-stone-900 mb-8">发布需求</h1>

        {submitSuccess ? (
          <SuccessState onPublishAnother={handlePublishAnother} />
        ) : (
          <>
            <StepIndicator current={currentStep} />

            {draftRestored && (
              <div className="mb-6 flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
                <span>已恢复上次保存的草稿</span>
                <button
                  type="button"
                  onClick={() => { reset(DEFAULT_VALUES); localStorage.removeItem(DRAFT_KEY); setDraftRestored(false) }}
                  className="ml-4 text-blue-500 hover:text-blue-700 transition-colors"
                >
                  清除草稿
                </button>
              </div>
            )}

            {createMutation.isError && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                <Icon icon={AlertCircle} size={16} className="flex-shrink-0" />
                <span>提交失败，请检查网络后重试</span>
              </div>
            )}

            <div className="rounded-2xl border border-stone-100 bg-white p-6 sm:p-8 shadow-card mb-6">
              <FormProvider {...form}>
                {currentStep === 0 && <Step1BasicInfo />}
                {currentStep === 1 && <Step2Content imageUploadFn={imageUploadFn} />}
                {currentStep === 2 && <Step3TagsAttachments tagGroups={tagGroups} tagsLoading={tagsLoading} />}
                {currentStep === 3 && <Step4Preview />}
              </FormProvider>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button type="button" onClick={goBack} className="rounded-lg border border-stone-200 px-5 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-all duration-200">上一步</button>
                )}
                <button type="button" onClick={saveDraftNow} className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-500 hover:bg-stone-50 transition-all duration-200 hidden sm:inline-flex">保存草稿</button>
              </div>

              <div className="flex items-center gap-2">
                {currentStep < STEP_LABELS.length - 1 ? (
                  <button type="button" onClick={goNext} className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200">
                    下一步
                    <Icon icon={ChevronRight} size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={createMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-theme-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {createMutation.isPending ? <><Spinner size="sm" />提交中...</> : '提交发布'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="bg-stone-900 text-stone-400 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>

      {blocker.state === 'blocked' && (
        <LeaveBlockerModal onProceed={() => blocker.proceed()} onStay={() => blocker.reset()} />
      )}
    </div>
  )
}
