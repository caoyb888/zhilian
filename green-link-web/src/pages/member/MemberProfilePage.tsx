import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import {
  CheckCircle2,
  Camera,
  Mail,
  Phone,
  Building2,
  MapPin,
  User,
  Tag,
  FileText,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/Button'
import { FormField } from '@/components/FormField'
import { Input } from '@/components/Input'
import { Badge } from '@/components/Badge'
import { useMemberMe, useMemberDetail, useUpdateMember, useUploadFile } from '@/services/memberService'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  shortName: z.string().max(50, '简称不超过50字').optional(),
  industry: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  introduction: z.string().max(2000, '简介不超过2000字').optional(),
  contactName: z.string().optional(),
  contactPhone: z
    .string()
    .regex(/^(1[3-9]\d{9})?$/, '手机号格式不正确')
    .optional(),
  contactEmail: z.union([z.string().email('邮箱格式不正确'), z.literal('')]).optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MEMBER_LEVEL_MAP: Record<number, string> = {
  1: '普通会员',
  2: 'VIP 会员',
  3: '理事单位',
}

// ─── Logo Uploader ────────────────────────────────────────────────────────────

function LogoUploader({
  currentUrl,
  onFileSelected,
  isUploading,
}: {
  currentUrl: string | null
  onFileSelected: (file: File) => void
  isUploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Revoke previous object URL when a new one is created or on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    onFileSelected(file)
    // reset input so same file can be re-selected
    e.target.value = ''
  }

  const displayUrl = previewUrl ?? currentUrl

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-24 w-24 rounded-full border-2 border-dashed border-stone-200 bg-stone-50 overflow-hidden flex items-center justify-center cursor-pointer hover:border-theme-accent transition-all duration-200 group shrink-0"
        onClick={() => !isUploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="更换企业 Logo"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!isUploading) inputRef.current?.click()
          }
        }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="企业 Logo" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-stone-300">
            <Icon icon={Building2} size={24} />
            <span className="text-[10px] mt-1">上传Logo</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isUploading ? (
            <Spinner size="sm" className="text-white" />
          ) : (
            <Icon icon={Camera} size={20} className="text-white" />
          )}
        </div>
      </div>
      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          更换 Logo
        </Button>
        <p className="mt-1.5 text-xs text-stone-400">支持 JPG/PNG/WebP，建议正方形，≤ 20MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MemberProfilePage() {
  const { data: me, isLoading: meLoading } = useMemberMe()
  const memberId = me?.member?.id ?? null
  const { data: detail, isLoading: detailLoading } = useMemberDetail(memberId)
  const updateMember = useUpdateMember()
  const uploadFile = useUploadFile()

  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  })

  // Populate form when detail data arrives
  useEffect(() => {
    if (!detail) return
    reset({
      shortName: detail.shortName ?? '',
      industry: detail.industry ?? '',
      province: detail.province ?? '',
      city: detail.city ?? '',
      introduction: detail.introduction ?? '',
      contactName: detail.contactName ?? '',
      contactPhone: detail.contactPhone ?? '',
      contactEmail: detail.contactEmail ?? '',
    })
  }, [detail, reset])

  const isLoading = meLoading || detailLoading
  const isSaving = updateMember.isPending || uploadFile.isPending

  async function onSubmit(values: FormValues) {
    if (!memberId) return
    try {
      let logoUrl: string | undefined
      if (pendingLogoFile) {
        const uploaded = await uploadFile.mutateAsync({
          file: pendingLogoFile,
          bizType: 'MEMBER',
          bizId: memberId,
        })
        logoUrl = uploaded.fileUrl
        setPendingLogoFile(null)
      }
      await updateMember.mutateAsync({
        memberId,
        data: {
          shortName: values.shortName || undefined,
          industry: values.industry || undefined,
          province: values.province || undefined,
          city: values.city || undefined,
          introduction: values.introduction || undefined,
          contactName: values.contactName || undefined,
          contactPhone: values.contactPhone || undefined,
          contactEmail: values.contactEmail || undefined,
          logoUrl,
        },
      })
      setSavedMsg('保存成功')
      setTimeout(() => setSavedMsg(null), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg
      setSavedMsg(msg ? `保存失败：${msg}` : '保存失败，请稍后重试')
      setTimeout(() => setSavedMsg(null), 4000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-theme-accent" />
      </div>
    )
  }

  if (!me || !detail) {
    return (
      <div className="py-16 text-center text-stone-400 text-sm">无法加载账号信息</div>
    )
  }

  const creditScore = (detail as unknown as { creditScore?: number }).creditScore

  return (
    <div className="space-y-5">
      {/* ─── Page header ─── */}
      <div>
        <h1 className="text-xl font-bold text-stone-900">企业资料</h1>
        <p className="text-sm text-stone-500 mt-0.5">管理您的会员账号与单位信息</p>
      </div>

      {/* ─── 企业名片区 ─── */}
      <section className="rounded-xl border border-stone-100 bg-stone-50/80 overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            {detail.logoUrl ? (
              <img
                src={detail.logoUrl}
                alt="企业 Logo"
                className="h-14 w-14 rounded-lg object-cover border border-stone-200 bg-white"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-stone-200 flex items-center justify-center text-stone-400">
                <Icon icon={Building2} size={24} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-stone-900 truncate">{detail.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {detail.memberLevelName && (
                  <Badge variant="success" className="text-[11px]">
                    {MEMBER_LEVEL_MAP[detail.memberLevel] ?? detail.memberLevelName}
                  </Badge>
                )}
                {detail.isCertified && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <Icon icon={CheckCircle2} size={13} />
                    绿色认证
                  </span>
                )}
                {me.isMainAccount && (
                  <Badge variant="default" className="text-[11px]">主账号</Badge>
                )}
              </div>
            </div>
          </div>

          {/* 指标行 */}
          <div className="mt-4 pt-4 border-t border-stone-200/60 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-stone-500">会员等级</p>
              <p className="text-sm font-semibold text-stone-800 mt-0.5">
                {MEMBER_LEVEL_MAP[detail.memberLevel] ?? detail.memberLevelName ?? '—'}
              </p>
            </div>
            <div className="border-l border-stone-200/60 pl-4">
              <p className="text-xs text-stone-500">信用评分</p>
              <p className="text-sm font-semibold text-stone-800 mt-0.5">
                {creditScore !== undefined ? creditScore.toFixed(2) : '—'}
              </p>
            </div>
            <div className="border-l border-stone-200/60 pl-4">
              <p className="text-xs text-stone-500">入会日期</p>
              <p className="text-sm font-semibold text-stone-800 mt-0.5">
                {detail.joinDate ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 账号信息（精简） ─── */}
      <section className="rounded-xl border border-stone-100 bg-white">
        <div className="px-6 py-3 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-700">账号信息</h2>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
          <div>
            <p className="text-xs text-stone-500">用户名</p>
            <p className="text-sm text-stone-800 mt-0.5">{me.username}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">真实姓名</p>
            <p className="text-sm text-stone-800 mt-0.5">{me.realName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">角色</p>
            <p className="text-sm text-stone-800 mt-0.5">{me.roles.join('、') || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">手机号</p>
            <p className="text-sm text-stone-800 mt-0.5">{me.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">邮箱</p>
            <p className="text-sm text-stone-800 mt-0.5">{me.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">最近登录</p>
            <p className="text-sm text-stone-800 mt-0.5">
              {me.lastLoginAt ? me.lastLoginAt.slice(0, 16).replace('T', ' ') : '—'}
            </p>
          </div>
        </div>
      </section>

      {/* ─── 单位信息编辑表单 ─── */}
      <section className="rounded-xl border border-stone-100 bg-white">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="text-base font-semibold text-stone-900">单位信息</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5">
          {/* 基本信息 */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Icon icon={Building2} size={14} />
              基本信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo */}
              <FormField label="企业 Logo">
                <LogoUploader
                  currentUrl={detail.logoUrl}
                  onFileSelected={setPendingLogoFile}
                  isUploading={uploadFile.isPending}
                />
              </FormField>

              {/* 全称 */}
              <FormField label="单位全称">
                <div className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-600 select-none flex items-center gap-2">
                  <Icon icon={Building2} size={16} className="text-stone-400 shrink-0" />
                  <span className="truncate">{detail.name}</span>
                </div>
              </FormField>

              {/* 简称 */}
              <FormField label="简称" error={errors.shortName?.message} htmlFor="shortName">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={FileText} size={16} />
                  </div>
                  <Input
                    id="shortName"
                    inputClassName="pl-9"
                    placeholder="单位简称（选填，≤50字）"
                    error={!!errors.shortName}
                    {...register('shortName')}
                  />
                </div>
              </FormField>

              {/* 所属行业 + 标签 */}
              <div>
                <FormField
                  label="所属行业"
                  error={errors.industry?.message}
                  htmlFor="industry"
                >
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={Tag} size={16} />
                    </div>
                    <Input
                      id="industry"
                      inputClassName="pl-9"
                      placeholder="例如：新能源、节能环保、绿色建筑…"
                      error={!!errors.industry}
                      {...register('industry')}
                    />
                  </div>
                </FormField>
                {detail.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {detail.tags.map((t) => (
                      <Badge key={t.id} variant="success" className="text-[11px]">
                        {t.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 省份 */}
              <FormField label="省份" error={errors.province?.message} htmlFor="province">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={MapPin} size={16} />
                  </div>
                  <Input
                    id="province"
                    inputClassName="pl-9"
                    placeholder="例如：山东"
                    error={!!errors.province}
                    {...register('province')}
                  />
                </div>
              </FormField>

              {/* 城市 */}
              <FormField label="城市" error={errors.city?.message} htmlFor="city">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={MapPin} size={16} />
                  </div>
                  <Input
                    id="city"
                    inputClassName="pl-9"
                    placeholder="例如：济南"
                    error={!!errors.city}
                    {...register('city')}
                  />
                </div>
              </FormField>

              {/* 简介 */}
              <FormField
                label="企业简介"
                error={errors.introduction?.message}
                htmlFor="introduction"
                className="md:col-span-2"
              >
                <textarea
                  id="introduction"
                  {...register('introduction')}
                  rows={4}
                  placeholder="请输入企业简介（≤2000字）…"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-theme-text-main placeholder-stone-400 bg-theme-surface outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all duration-200 resize-none"
                />
              </FormField>
            </div>
          </div>

          {/* 联系方式 */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Icon icon={Phone} size={14} />
              联系方式
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="联系人" error={errors.contactName?.message} htmlFor="contactName">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={User} size={16} />
                  </div>
                  <Input
                    id="contactName"
                    inputClassName="pl-9"
                    placeholder="联系人姓名"
                    error={!!errors.contactName}
                    {...register('contactName')}
                  />
                </div>
              </FormField>
              <FormField label="联系电话" error={errors.contactPhone?.message} htmlFor="contactPhone">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={Phone} size={16} />
                  </div>
                  <Input
                    id="contactPhone"
                    inputClassName="pl-9"
                    placeholder="1XX XXXX XXXX"
                    error={!!errors.contactPhone}
                    {...register('contactPhone')}
                  />
                </div>
              </FormField>
              <FormField label="联系邮箱" error={errors.contactEmail?.message} htmlFor="contactEmail">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={Mail} size={16} />
                  </div>
                  <Input
                    id="contactEmail"
                    type="email"
                    inputClassName="pl-9"
                    placeholder="example@company.com"
                    error={!!errors.contactEmail}
                    {...register('contactEmail')}
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* 保存 */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-stone-100">
            <Button type="submit" loading={isSaving} disabled={isSaving || (!isDirty && !pendingLogoFile)}>
              保存修改
            </Button>
            {savedMsg && (
              <span
                className={clsx(
                  'text-sm font-medium',
                  savedMsg.startsWith('保存成功') ? 'text-emerald-600' : 'text-red-500'
                )}
              >
                {savedMsg}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
