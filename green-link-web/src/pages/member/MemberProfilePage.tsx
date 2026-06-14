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
  Clock,
  Shield,
  Award,
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

// ─── Constants ────────────────────────────────────────────────────────────────

const MEMBER_LEVEL_MAP: Record<number, { label: string; className: string }> = {
  1: { label: '普通会员', className: 'bg-stone-100 text-stone-600 border-stone-200' },
  2: { label: 'VIP 会员', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  3: { label: '理事单位', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionDivider({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-widest whitespace-nowrap">
        <span className="text-theme-accent/80">{icon}</span>
        {label}
      </div>
      <div className="flex-1 h-px bg-stone-100" />
    </div>
  )
}

function AccountItem({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="group relative flex items-start gap-2.5 px-4 py-3 hover:bg-stone-50/60 transition-colors duration-150">
      {/* 左侧微色条，hover 时显现 */}
      <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      <span className="mt-0.5 shrink-0 text-sky-500/70">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">{label}</p>
        <p className={clsx(
          'text-sm font-medium truncate',
          value ? 'text-stone-800' : 'text-stone-300',
          mono && 'font-mono tabular-nums',
        )}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
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
    e.target.value = ''
  }

  const displayUrl = previewUrl ?? currentUrl

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-20 w-20 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 overflow-hidden flex items-center justify-center cursor-pointer group shrink-0 transition-all duration-200 hover:border-theme-accent hover:shadow-[0_0_0_4px_rgba(4,120,87,0.08)]"
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
            <Icon icon={Building2} size={22} />
            <span className="text-[9px] mt-1 tracking-widest font-medium">LOGO</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[2px]">
          {isUploading ? (
            <Spinner size="sm" className="text-white" />
          ) : (
            <Icon icon={Camera} size={18} className="text-white" />
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
        <p className="mt-1.5 text-[11px] text-stone-400 leading-relaxed">
          JPG / PNG / WebP
          <br />
          建议正方形 · ≤ 20MB
        </p>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const hasChanges = isDirty || !!pendingLogoFile

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
  const levelInfo = MEMBER_LEVEL_MAP[detail.memberLevel]

  return (
    <div className="space-y-4 pb-6">
      {/* ── 企业身份牌 ── */}
      <div
        className="rounded-2xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(6,30,15,0.16)] animate-fade-in-up"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex flex-col sm:flex-row">
          {/* 左侧：暗绿凭证面板 */}
          <div className="profile-hero-left relative sm:w-52 flex-shrink-0 flex flex-col items-center justify-center gap-3 py-8 px-6 min-h-[148px] sm:min-h-0 overflow-hidden">
            {/* 六边形网格纹理 */}
            <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.16]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="profileHex"
                  x="0"
                  y="0"
                  width="40"
                  height="46"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M20 3L37 12.5V31.5L20 41L3 31.5V12.5Z"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#profileHex)" />
            </svg>

            {/* 徽标 */}
            <div className="relative z-10">
              {detail.logoUrl ? (
                <div className="h-[72px] w-[72px] rounded-2xl overflow-hidden ring-2 ring-emerald-400/25 ring-offset-2 ring-offset-transparent shadow-[0_0_28px_rgba(16,185,129,0.28)]">
                  <img
                    src={detail.logoUrl}
                    alt="企业 Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-[72px] w-[72px] rounded-2xl bg-emerald-900/50 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.18)]">
                  <Icon icon={Building2} size={30} className="text-emerald-400/70" />
                </div>
              )}
            </div>

            {/* 平台水印 */}
            <div className="relative z-10 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-emerald-400/50">
              <span className="inline-block w-4 h-px bg-emerald-500/30" />
              绿产智链
              <span className="inline-block w-4 h-px bg-emerald-500/30" />
            </div>
          </div>

          {/* 右侧：企业信息 */}
          <div className="relative flex-1 bg-white px-6 py-5 flex flex-col justify-between border-t border-stone-100/80 sm:border-t-0 sm:border-l border-stone-100/60 overflow-hidden">
            {/* 右上角装饰光晕 */}
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.07]"
              style={{ background: 'radial-gradient(circle, #10b981, transparent)' }}
            />
            <div>
              <h2 className="text-xl font-bold text-stone-900 leading-snug">{detail.name}</h2>
              {detail.shortName && (
                <p className="text-sm text-stone-400 mt-0.5 font-medium">{detail.shortName}</p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {levelInfo && (
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border',
                      levelInfo.className,
                    )}
                  >
                    <Icon icon={Award} size={11} />
                    {levelInfo.label}
                  </span>
                )}
                {detail.isCertified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Icon icon={CheckCircle2} size={11} />
                    绿色认证
                  </span>
                )}
                {me.isMainAccount && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    <Icon icon={Shield} size={11} />
                    主账号
                  </span>
                )}
              </div>
            </div>

            {/* 统计行 */}
            <div className="mt-5 pt-4 border-t border-stone-100 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">会员等级</p>
                <p className="text-sm font-bold text-stone-800">{levelInfo?.label ?? '—'}</p>
              </div>
              <div className="border-l border-stone-100 pl-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">信用评分</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                    {creditScore !== undefined ? creditScore.toFixed(2) : '—'}
                  </p>
                  {creditScore !== undefined && (
                    <div className="h-1 flex-1 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                        style={{ width: `${Math.min(100, creditScore)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="border-l border-stone-100 pl-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">入会日期</p>
                <p className="text-sm font-bold font-mono tabular-nums text-stone-800">
                  {detail.joinDate ?? '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 账号信息 ── */}
      <section
        className="rounded-xl border border-stone-100 bg-white overflow-hidden animate-fade-in-up"
        style={{ animationDelay: '120ms' }}
      >
        <div className="px-5 py-3 border-b border-sky-100 border-l-[3px] border-l-sky-400 bg-sky-50/60 flex items-center gap-2">
          <Icon icon={User} size={13} className="text-sky-500" />
          <h2 className="text-sm font-semibold text-sky-700">账号信息</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-stone-100/80">
          <AccountItem icon={<Icon icon={User} size={13} />} label="用户名" value={me.username} />
          <AccountItem
            icon={<Icon icon={User} size={13} />}
            label="真实姓名"
            value={me.realName ?? ''}
          />
          <AccountItem
            icon={<Icon icon={Shield} size={13} />}
            label="角色"
            value={me.roles.join('、')}
          />
          <AccountItem
            icon={<Icon icon={Phone} size={13} />}
            label="手机号"
            value={me.phone ?? ''}
          />
          <AccountItem
            icon={<Icon icon={Mail} size={13} />}
            label="邮箱"
            value={me.email ?? ''}
          />
          <AccountItem
            icon={<Icon icon={Clock} size={13} />}
            label="最近登录"
            value={me.lastLoginAt ? me.lastLoginAt.slice(0, 16).replace('T', ' ') : ''}
            mono
          />
        </div>
      </section>

      {/* ── 单位信息表单 ── */}
      <section
        className="rounded-xl border border-stone-100 bg-white animate-fade-in-up"
        style={{ animationDelay: '180ms' }}
      >
        <div className="px-6 py-4 border-b border-emerald-100 border-l-[3px] border-l-emerald-500 bg-emerald-50/50 flex items-center gap-2">
          <Icon icon={Building2} size={13} className="text-emerald-600" />
          <h2 className="text-sm font-semibold text-emerald-800">单位信息</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-7">
          {/* 基本信息 */}
          <div>
            <SectionDivider
              label="基本信息"
              icon={<Icon icon={Building2} size={12} />}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <FormField label="企业 Logo">
                <LogoUploader
                  currentUrl={detail.logoUrl}
                  onFileSelected={setPendingLogoFile}
                  isUploading={uploadFile.isPending}
                />
              </FormField>

              <FormField label="单位全称">
                <div className="flex items-center gap-2 rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2.5 text-sm text-stone-600 select-none">
                  <Icon icon={Building2} size={14} className="text-stone-300 shrink-0" />
                  <span className="truncate">{detail.name}</span>
                </div>
              </FormField>

              <FormField
                label="简称"
                error={errors.shortName?.message}
                htmlFor="shortName"
              >
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={FileText} size={15} />
                  </div>
                  <Input
                    id="shortName"
                    inputClassName="pl-9"
                    placeholder="单位简称（选填，≤ 50字）"
                    error={!!errors.shortName}
                    {...register('shortName')}
                  />
                </div>
              </FormField>

              <div>
                <FormField
                  label="所属行业"
                  error={errors.industry?.message}
                  htmlFor="industry"
                >
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={Tag} size={15} />
                    </div>
                    <Input
                      id="industry"
                      inputClassName="pl-9"
                      placeholder="新能源 · 节能环保 · 绿色建筑…"
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

              <FormField label="省份" error={errors.province?.message} htmlFor="province">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={MapPin} size={15} />
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

              <FormField label="城市" error={errors.city?.message} htmlFor="city">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={MapPin} size={15} />
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
                  placeholder="请输入企业简介，突出核心业务、绿色低碳实践与核心竞争力（≤ 2000字）…"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-theme-text-main placeholder-stone-400 bg-theme-surface outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all duration-200 resize-none leading-relaxed"
                />
              </FormField>
            </div>
          </div>

          {/* 联系方式 */}
          <div>
            <SectionDivider
              label="联系方式"
              icon={<Icon icon={Phone} size={12} />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                label="联系人"
                error={errors.contactName?.message}
                htmlFor="contactName"
              >
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={User} size={15} />
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
              <FormField
                label="联系电话"
                error={errors.contactPhone?.message}
                htmlFor="contactPhone"
              >
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={Phone} size={15} />
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
              <FormField
                label="联系邮箱"
                error={errors.contactEmail?.message}
                htmlFor="contactEmail"
              >
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Icon icon={Mail} size={15} />
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

          {/* 保存栏 */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400">
              {hasChanges ? (
                <span className="text-amber-600 font-medium">· 有未保存的修改</span>
              ) : (
                '信息将在保存后对会员可见'
              )}
            </p>
            <div className="flex items-center gap-3">
              {savedMsg && (
                <span
                  className={clsx(
                    'text-sm font-medium transition-all duration-300',
                    savedMsg.startsWith('保存成功') ? 'text-emerald-600' : 'text-red-500',
                  )}
                >
                  {savedMsg}
                </span>
              )}
              <Button
                type="submit"
                loading={isSaving}
                disabled={isSaving || !hasChanges}
              >
                保存修改
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
