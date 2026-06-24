import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Clock,
  FileText, FlaskConical, MapPin, Package, Sparkles, Users, X,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { PortalNav } from '@/business/PortalNav'
import { FormField } from '@/components/FormField'
import { Spinner } from '@/components/Spinner'
import { RichEditor } from '@/components/RichEditor'
import { FileUploader } from '@/components/FileUploader'
import { fetchTagCategories, fetchTags } from '@/services/tagService'
import {
  useCreateResource,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPES,
  PROVINCES,
  type CreateResourceBody,
} from '@/services/supplyService'
import { uploadFileWithProgress } from '@/services/fileService'
import type { FileUploadResult } from '@/services/fileService'
import { useDictOptions, DICT_RESOURCE_TYPE } from '@/services/dictService'

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'gl-draft-resource'
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
  type: z.string().min(1, '请选择资源类型'),
  title: z.string().min(1, '标题不能为空').max(300, '标题不超过300字'),
  summary: z.string().max(500, '摘要不超过500字'),
  province: z.string(),
  city: z.string(),
  cooperationMode: z.string(),
  validUntil: z.string(),
  contactVisible: z.boolean(),
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
            tags: page.records
              .filter((t) => t.isActive !== false)
              .map((t) => ({ id: t.id, name: t.name })),
          }
        }),
      )
      return groups.filter((g) => g.tags.length > 0)
    },
    staleTime: 10 * 60 * 1000,
  })
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <div className={[
      'flex items-center justify-between gap-4 rounded-xl border px-4 py-4 transition-colors duration-200',
      checked ? 'border-emerald-200 bg-emerald-50/60' : 'border-stone-200 bg-stone-50',
    ].join(' ')}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        {hint && <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          checked ? 'bg-emerald-500' : 'bg-stone-300',
        ].join(' ')}
      >
        <span
          className={[
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <>
      {/* Desktop */}
      <nav className="hidden sm:flex items-start justify-center gap-0 mb-10">
        {STEP_LABELS.map((label, i) => {
          const done   = i < current
          const active = i === current
          return (
            <div key={i} className="flex items-start">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300',
                    done
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200/60'
                      : active
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-md shadow-emerald-200/50'
                      : 'bg-stone-100 text-stone-400',
                  ].join(' ')}
                >
                  {done ? (
                    <Icon icon={CheckCircle2} size={18} />
                  ) : (
                    <span className="text-xs font-black tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <span
                  className={[
                    'text-xs font-semibold whitespace-nowrap tracking-wide',
                    active ? 'text-emerald-700' : done ? 'text-emerald-500' : 'text-stone-400',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={[
                    'mx-3 mt-5 h-0.5 w-16 shrink-0 rounded-full transition-all duration-500',
                    done ? 'bg-gradient-to-r from-emerald-400 to-teal-300' : 'bg-stone-200',
                  ].join(' ')}
                />
              )}
            </div>
          )
        })}
      </nav>

      {/* Mobile */}
      <div className="sm:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-black shadow-sm shadow-emerald-200">
              {current + 1}
            </span>
            <span className="text-sm font-semibold text-stone-800">
              {STEP_LABELS[current]}
            </span>
          </div>
          <span className="text-xs font-medium text-stone-400 tabular-nums">
            {current + 1} / {STEP_LABELS.length}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
            style={{ width: `${((current + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>
    </>
  )
}

// ─── Step 1 — 基本信息 ─────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  icon: typeof Package
  activeClass: string
  iconBg: string
  dotClass: string
  shadow: string
}> = {
  PRODUCT:    {
    icon: Package,
    activeClass: 'border-emerald-400 bg-gradient-to-b from-emerald-50 to-white text-emerald-800',
    iconBg: 'bg-emerald-100 text-emerald-600',
    dotClass: 'bg-emerald-500',
    shadow: 'shadow-lg shadow-emerald-100',
  },
  TECHNOLOGY: {
    icon: FlaskConical,
    activeClass: 'border-blue-400 bg-gradient-to-b from-blue-50 to-white text-blue-800',
    iconBg: 'bg-blue-100 text-blue-600',
    dotClass: 'bg-blue-500',
    shadow: 'shadow-lg shadow-blue-100',
  },
  TALENT:     {
    icon: Users,
    activeClass: 'border-purple-400 bg-gradient-to-b from-purple-50 to-white text-purple-800',
    iconBg: 'bg-purple-100 text-purple-600',
    dotClass: 'bg-purple-500',
    shadow: 'shadow-lg shadow-purple-100',
  },
}

function Step1BasicInfo() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>()

  const selectedType   = watch('type')
  const contactVisible = watch('contactVisible')

  // 资源类型走数据字典（#2 五大类，可后台维护）；字典未加载时回退到内置常量
  const { data: dictTypes } = useDictOptions(DICT_RESOURCE_TYPE)
  const typeOptions = (dictTypes && dictTypes.length > 0)
    ? dictTypes.map((o) => ({ value: o.value, label: o.label }))
    : RESOURCE_TYPES.map((t) => ({ value: t, label: RESOURCE_TYPE_LABELS[t] ?? t }))

  return (
    <div className="space-y-6">
      {/* Resource type */}
      <FormField label="资源类型" required error={errors.type?.message}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {typeOptions.map(({ value: t, label }) => {
            const active   = selectedType === t
            const cfg      = TYPE_CONFIG[t] ?? {
              icon: Package,
              activeClass: 'border-stone-300 bg-stone-50 text-stone-800',
              iconBg: 'bg-stone-100 text-stone-600',
              dotClass: 'bg-stone-400',
              shadow: 'shadow-md',
            }
            const TypeIcon = cfg.icon
            return (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t, { shouldValidate: true, shouldDirty: true })}
                className={[
                  'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 px-4 py-7 text-sm font-semibold',
                  'transition-all duration-200 hover:scale-[1.02]',
                  active
                    ? `${cfg.activeClass} ${cfg.shadow} scale-[1.02]`
                    : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50/80 hover:shadow-sm',
                ].join(' ')}
              >
                {active && (
                  <span className={`absolute top-2.5 right-2.5 h-2 w-2 rounded-full ${cfg.dotClass}`} />
                )}
                <span className={[
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200',
                  active ? cfg.iconBg : 'bg-stone-100 text-stone-400',
                ].join(' ')}>
                  <Icon icon={TypeIcon} size={20} />
                </span>
                {label}
              </button>
            )
          })}
        </div>
      </FormField>

      {/* Title */}
      <FormField label="资源标题" htmlFor="title" required error={errors.title?.message}>
        <input
          id="title"
          type="text"
          placeholder="请输入资源标题，如：光伏组件生产技术转让"
          className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:shadow-sm transition-all duration-200"
          {...register('title')}
        />
      </FormField>

      {/* Summary */}
      <FormField
        label="资源摘要"
        htmlFor="summary"
        error={errors.summary?.message}
        hint="一句话描述您的资源，将显示在列表卡片上（不超过500字）"
      >
        <textarea
          id="summary"
          rows={3}
          placeholder="简要描述您的资源..."
          className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:shadow-sm transition-all duration-200 resize-none"
          {...register('summary')}
        />
      </FormField>

      {/* Province + City */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="所在省份" htmlFor="province" error={errors.province?.message}>
          <select
            id="province"
            className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:shadow-sm transition-all duration-200 bg-white"
            {...register('province')}
          >
            <option value="">请选择省份</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FormField>

        <FormField label="所在城市" htmlFor="city" error={errors.city?.message}>
          <input
            id="city"
            type="text"
            placeholder="如：济南"
            className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:shadow-sm transition-all duration-200"
            {...register('city')}
          />
        </FormField>
      </div>

      {/* Cooperation mode */}
      <FormField label="合作方式" htmlFor="cooperationMode" error={errors.cooperationMode?.message}>
        <input
          id="cooperationMode"
          type="text"
          placeholder="如：技术转让、许可授权、合作研发、入股合作..."
          className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:shadow-sm transition-all duration-200"
          {...register('cooperationMode')}
        />
      </FormField>

      {/* Valid until */}
      <FormField label="有效期至" htmlFor="validUntil" error={errors.validUntil?.message}>
        <input
          id="validUntil"
          type="date"
          className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:shadow-sm transition-all duration-200"
          {...register('validUntil')}
        />
      </FormField>

      {/* Contact visible — toggle */}
      <Toggle
        checked={contactVisible}
        onChange={(v) => setValue('contactVisible', v, { shouldDirty: true })}
        label="向会员公开联系方式"
        hint="开启后，已登录的会员可在详情页查看您的联系人、手机号和邮箱"
      />
    </div>
  )
}

// ─── Step 2 — 详细描述 ─────────────────────────────────────────────────────────

interface Step2ContentProps {
  imageUploadFn: (file: File) => Promise<string>
}

function Step2Content({ imageUploadFn }: Step2ContentProps) {
  const { watch, setValue } = useFormContext<FormValues>()
  const content = watch('content')

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-stone-700 mb-1.5">
          详细介绍
          <span className="ml-1 text-xs text-stone-400 font-normal">（可插入图片，图片自动上传至云端）</span>
        </p>
        <RichEditor
          key="publish-content"
          defaultValue={content}
          onChange={(html) => setValue('content', html, { shouldDirty: true })}
          minHeight={400}
          imageUploadFn={imageUploadFn}
        />
        <p className="mt-2 text-xs text-stone-400">
          支持富文本格式，可插入图片、设置标题、添加链接等
        </p>
      </div>
    </div>
  )
}

// ─── Step 3 — 标签与附件 ───────────────────────────────────────────────────────

interface Step3TagsAttachmentsProps {
  tagGroups: TagGroup[]
  tagsLoading: boolean
}

function Step3TagsAttachments({ tagGroups, tagsLoading }: Step3TagsAttachmentsProps) {
  const { watch, setValue, formState: { errors } } = useFormContext<FormValues>()
  const tagIds = watch('tagIds')
  const [tagLimitError, setTagLimitError] = useState('')

  function toggleTag(tagId: number) {
    if (tagIds.includes(tagId)) {
      setValue('tagIds', tagIds.filter((id) => id !== tagId), { shouldDirty: true })
      setTagLimitError('')
    } else {
      if (tagIds.length >= MAX_TAGS) {
        setTagLimitError(`最多只能选择 ${MAX_TAGS} 个标签`)
        return
      }
      setTagLimitError('')
      setValue('tagIds', [...tagIds, tagId], { shouldDirty: true })
    }
  }

  function handleAttachmentsChange(results: FileUploadResult[]) {
    setValue(
      'attachments',
      results.map((r, i) => ({
        fileName: r.fileName,
        fileUrl: r.fileUrl,
        fileSize: r.fileSize ?? null,
        fileType: r.mimeType ?? null,
        sortOrder: i,
      })),
      { shouldDirty: true },
    )
  }

  return (
    <div className="space-y-8">
      {/* Tags */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-stone-700">
            标签选择
            <span className="ml-1 text-xs text-stone-400 font-normal">（最多 {MAX_TAGS} 个）</span>
          </p>
          {tagIds.length > 0 && (
            <span className="text-xs text-stone-500">
              已选 <span className="font-semibold text-emerald-600">{tagIds.length}</span> / {MAX_TAGS}
            </span>
          )}
        </div>

        {(tagLimitError || errors.tagIds?.message) && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
            <Icon icon={AlertCircle} size={14} className="shrink-0" />
            {tagLimitError || errors.tagIds?.message}
          </div>
        )}

        {/* Selected chips */}
        {tagIds.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/60 p-3">
            {tagGroups
              .flatMap((g) => g.tags)
              .filter((t) => tagIds.includes(t.id))
              .map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm"
                >
                  #{t.name}
                  <button
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className="rounded-full hover:text-emerald-900 transition-colors"
                    aria-label={`移除标签 ${t.name}`}
                  >
                    <Icon icon={X} size={11} />
                  </button>
                </span>
              ))}
          </div>
        )}

        {tagsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" className="text-stone-300" />
          </div>
        ) : tagGroups.length === 0 ? (
          <p className="text-sm text-stone-400 py-4">暂无可用标签</p>
        ) : (
          <div className="space-y-5 max-h-72 overflow-y-auto pr-1 rounded-xl border border-stone-100 bg-stone-50/50 p-4">
            {tagGroups.map((group) => (
              <div key={group.categoryId}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {group.categoryName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag) => {
                    const selected = tagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={[
                          'rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 hover:scale-[1.03]',
                          selected
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm font-semibold'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50/50',
                        ].join(' ')}
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

      {/* Attachments */}
      <div>
        <p className="text-sm font-medium text-stone-700 mb-3">
          附件上传
          <span className="ml-1 text-xs text-stone-400 font-normal">（图文/视频/案例，最多 {MAX_ATTACHMENTS} 个，单文件 ≤ 100MB）</span>
        </p>
        <FileUploader
          accept="image/*,video/mp4,video/quicktime,.mp4,.mov,application/pdf,.doc,.docx,.xls,.xlsx"
          maxFiles={MAX_ATTACHMENTS}
          maxSizeMB={100}
          bizType="RESOURCE"
          onChange={handleAttachmentsChange}
        />
      </div>
    </div>
  )
}

// ─── Step 4 — 预览与提交 ───────────────────────────────────────────────────────

function Step4Preview({ tagGroups }: { tagGroups: TagGroup[] }) {
  const { watch } = useFormContext<FormValues>()
  const values = watch()

  const typeLabel        = RESOURCE_TYPE_LABELS[values.type] ?? values.type
  const allTags          = tagGroups.flatMap((g) => g.tags)
  const selectedTagNames = values.tagIds
    .map((id) => allTags.find((t) => t.id === id)?.name)
    .filter((n): n is string => !!n)

  const typeCfg = TYPE_CONFIG[values.type]

  return (
    <div className="space-y-5">
      {/* Notice */}
      <div className="flex items-start gap-3 rounded-xl border-l-4 border-l-amber-400 border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-700">
        <Icon icon={AlertCircle} size={16} className="shrink-0 mt-0.5 text-amber-500" />
        <span>提交后将进入人工审核流程，请仔细核对以下信息</span>
      </div>

      {/* Preview card */}
      <div className="rounded-xl border-l-4 border-l-emerald-500 border border-stone-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white flex items-center gap-2">
          <div className="h-1.5 w-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
          <h3 className="text-sm font-bold text-stone-800">信息预览</h3>
        </div>
        <div className="divide-y divide-stone-50">
          <PreviewRow label="资源类型">
            {typeLabel ? (
              <span className={[
                'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold',
                typeCfg ? typeCfg.activeClass : 'bg-emerald-100 text-emerald-800',
              ].join(' ')}>
                {typeLabel}
              </span>
            ) : <EmptyVal />}
          </PreviewRow>

          <PreviewRow label="资源标题">
            <span className="text-sm font-medium text-stone-900">{values.title || <EmptyVal />}</span>
          </PreviewRow>

          {values.summary && (
            <PreviewRow label="摘要">
              <span className="text-sm text-stone-700">{values.summary}</span>
            </PreviewRow>
          )}

          {(values.province || values.city) && (
            <PreviewRow label="所在地区">
              <span className="inline-flex items-center gap-1 text-sm text-stone-700">
                <Icon icon={MapPin} size={13} className="text-emerald-400" />
                {[values.province, values.city].filter(Boolean).join(' · ')}
              </span>
            </PreviewRow>
          )}

          {values.cooperationMode && (
            <PreviewRow label="合作方式">
              <span className="text-sm text-stone-700">{values.cooperationMode}</span>
            </PreviewRow>
          )}

          {values.validUntil && (
            <PreviewRow label="有效期至">
              <span className="inline-flex items-center gap-1 text-sm text-stone-700">
                <Icon icon={Clock} size={13} className="text-stone-400" />
                {values.validUntil}
              </span>
            </PreviewRow>
          )}

          <PreviewRow label="联系方式">
            <span className={`text-sm font-medium ${values.contactVisible ? 'text-emerald-700' : 'text-stone-500'}`}>
              {values.contactVisible ? '向会员公开' : '不公开'}
            </span>
          </PreviewRow>

          <PreviewRow label="详细介绍">
            <span className={`text-sm ${values.content ? 'text-emerald-700 font-medium' : 'text-stone-400'}`}>
              {values.content ? '已填写' : '未填写'}
            </span>
          </PreviewRow>

          <PreviewRow label="标签">
            {selectedTagNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedTagNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                  >
                    #{name}
                  </span>
                ))}
              </div>
            ) : <EmptyVal />}
          </PreviewRow>

          <PreviewRow label="附件">
            {values.attachments.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-stone-700">
                <Icon icon={FileText} size={13} className="text-stone-400" />
                {values.attachments.length} 个附件
              </span>
            ) : <EmptyVal />}
          </PreviewRow>
        </div>
      </div>

      <p className="text-xs text-stone-400 text-center">
        提交后将由协会工作人员审核，审核结果将通过站内信通知您
      </p>
    </div>
  )
}

function EmptyVal() {
  return <span className="text-sm text-stone-300">—</span>
}

function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-5 py-3.5 hover:bg-stone-50/60 transition-colors duration-100">
      <span className="w-20 shrink-0 text-xs font-medium text-stone-400 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({ onPublishAnother }: { onPublishAnother: () => void }) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden shadow-sm">
      {/* Top gradient band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

      <div className="p-12 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/80 ring-offset-4 ring-offset-white text-emerald-500">
          <Icon icon={CheckCircle2} size={42} />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 mb-4">
          <Icon icon={Sparkles} size={12} />
          发布成功
        </div>

        <h2 className="text-2xl font-bold text-stone-900 mb-2">资源已提交审核</h2>
        <p className="text-sm text-stone-500 mb-8 max-w-sm mx-auto leading-relaxed">
          您的资源已进入审核流程，管理员通过后即可在平台展示。
          审核结果将通过站内信通知您。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/supply"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-6 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200"
          >
            返回供需列表
          </Link>
          <Link
            to="/member/my-resources"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-all duration-200"
          >
            查看我的资源
          </Link>
          <button
            type="button"
            onClick={onPublishAnother}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-200/60 transition-all duration-200 active:scale-[0.98]"
          >
            继续发布 <Icon icon={ArrowRight} size={14} />
          </button>
        </div>
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
  city: '',
  cooperationMode: '',
  validUntil: '',
  contactVisible: true,
  content: '',
  tagIds: [],
  attachments: [],
}

export default function SupplyPublishPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  const { formState: { isDirty }, getValues, reset, trigger } = form

  // ── Draft restore on mount ────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as Partial<FormValues>
      const hasContent = !!(parsed.title || parsed.content || (parsed.tagIds?.length ?? 0) > 0)
      if (hasContent) {
        reset({ ...DEFAULT_VALUES, ...parsed }, { keepDefaultValues: false })
        setTimeout(() => setDraftRestored(true), 0)
      }
    } catch {
      // ignore corrupt draft
    }
  }, [reset])

  // ── Auto-save every 30s ───────────────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues()))
      } catch {
        // ignore storage quota errors
      }
    }, 30_000)
    return () => clearInterval(id)
  }, [getValues])

  // ── Browser tab close / refresh warning ──────────────────────────────────

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && !submitSuccess) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty, submitSuccess])

  // ── Image upload for Quill ────────────────────────────────────────────────

  const imageUploadFn = useCallback(async (file: File): Promise<string> => {
    const result = await uploadFileWithProgress(file, { bizType: 'RESOURCE' })
    return result.fileUrl
  }, [])

  // ── Tag groups ────────────────────────────────────────────────────────────

  const { data: tagGroups = [], isLoading: tagsLoading } = useTagGroups()

  // ── Navigation ────────────────────────────────────────────────────────────

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
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues()))
    } catch {
      // ignore
    }
  }

  // ── Create mutation ───────────────────────────────────────────────────────

  const createMutation = useCreateResource()

  const onSubmit = form.handleSubmit(async (values) => {
    const body: CreateResourceBody = {
      type: values.type,
      title: values.title,
      content: values.content || undefined,
      summary: values.summary || undefined,
      province: values.province || undefined,
      city: values.city || undefined,
      cooperationMode: values.cooperationMode || undefined,
      validUntil: values.validUntil || undefined,
      contactVisible: values.contactVisible,
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <PortalNav />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">

        {/* Back link */}
        <Link
          to="/supply"
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-emerald-700 mb-8 transition-colors group"
        >
          <Icon
            icon={ArrowLeft}
            size={15}
            className="group-hover:-translate-x-0.5 transition-transform duration-200"
          />
          返回供需列表
        </Link>

        {/* Page header */}
        {!submitSuccess && (
          <div className="mb-8">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 mb-5" />
            <div className="flex items-start gap-3">
              <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200/60 mt-0.5">
                <Icon icon={Package} size={18} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">发布资源</h1>
                <p className="mt-1 text-sm text-stone-500">
                  填写绿色低碳资源信息，发布后经审核即可在平台展示
                  <span className="mx-1.5 text-stone-300">·</span>
                  共 {STEP_LABELS.length} 步，约 5 分钟完成
                </p>
              </div>
            </div>
          </div>
        )}

        {submitSuccess ? (
          <SuccessState onPublishAnother={handlePublishAnother} />
        ) : (
          <>
            <StepIndicator current={currentStep} />

            {/* Draft restored */}
            {draftRestored && (
              <div className="mb-6 flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
                <div className="flex items-center gap-2">
                  <Icon icon={AlertCircle} size={15} className="text-blue-400" />
                  已恢复上次保存的草稿
                </div>
                <button
                  type="button"
                  onClick={() => {
                    reset(DEFAULT_VALUES)
                    localStorage.removeItem(DRAFT_KEY)
                    setDraftRestored(false)
                  }}
                  className="text-xs text-blue-400 hover:text-blue-600 transition-colors underline underline-offset-2"
                >
                  清除草稿
                </button>
              </div>
            )}

            {/* Submit error */}
            {createMutation.isError && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border-l-4 border-l-red-400 bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                <Icon icon={AlertCircle} size={16} className="shrink-0" />
                <span>提交失败，请检查网络后重试</span>
              </div>
            )}

            {/* Form card */}
            <div className="rounded-2xl border border-stone-100 bg-white p-6 sm:p-8 shadow-[0_4px_32px_-8px_rgba(16,185,129,0.08)] mb-6">
              <FormProvider {...form}>
                {currentStep === 0 && <Step1BasicInfo />}
                {currentStep === 1 && <Step2Content imageUploadFn={imageUploadFn} />}
                {currentStep === 2 && (
                  <Step3TagsAttachments tagGroups={tagGroups} tagsLoading={tagsLoading} />
                )}
                {currentStep === 3 && <Step4Preview tagGroups={tagGroups} />}
              </FormProvider>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200 group"
                  >
                    <Icon icon={ArrowLeft} size={14} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                    上一步
                  </button>
                )}
                <button
                  type="button"
                  onClick={saveDraftNow}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-500 hover:bg-stone-50 hover:border-emerald-200 hover:text-emerald-600 transition-all duration-200"
                >
                  保存草稿
                </button>
              </div>

              <div>
                {currentStep < STEP_LABELS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-200/60 transition-all duration-200 active:scale-[0.98]"
                  >
                    下一步
                    <Icon icon={ChevronRight} size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={createMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-200/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                  >
                    {createMutation.isPending ? (
                      <><Spinner size="sm" />提交中...</>
                    ) : (
                      <>提交发布 <Icon icon={ArrowRight} size={15} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="mt-auto bg-stone-950 text-stone-500 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>
    </div>
  )
}
