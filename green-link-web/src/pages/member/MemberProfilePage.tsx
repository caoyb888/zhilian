import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Spinner } from '@/components/Spinner'
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex py-2.5 border-b border-gray-50 last:border-0">
      <dt className="w-24 flex-shrink-0 text-sm text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-800 flex-1">{value || <span className="text-gray-300">—</span>}</dd>
    </div>
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
      <div className="h-20 w-20 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
        {displayUrl ? (
          <img src={displayUrl} alt="Logo" className="h-full w-full object-contain" />
        ) : (
          <span className="text-3xl text-gray-200 select-none">绿</span>
        )}
      </div>
      <div>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isUploading ? '上传中…' : '更换 Logo'}
        </button>
        <p className="mt-1.5 text-xs text-gray-400">支持 JPG/PNG/WebP，建议正方形，≤ 20MB</p>
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
        <Spinner size="lg" className="text-brand-500" />
      </div>
    )
  }

  if (!me || !detail) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">无法加载账号信息</div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ─── Account Card (read-only) ─── */}
      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">账号信息</h2>
          {me.isMainAccount && (
            <span className="text-xs rounded-full bg-brand-50 text-brand-600 px-2.5 py-0.5 font-medium">
              主账号
            </span>
          )}
        </div>
        <dl className="px-6 py-2">
          <InfoRow label="用户名" value={me.username} />
          <InfoRow label="真实姓名" value={me.realName} />
          <InfoRow label="手机号" value={me.phone} />
          <InfoRow label="邮箱" value={me.email} />
          <InfoRow
            label="角色"
            value={
              <div className="flex flex-wrap gap-1.5">
                {me.roles.map((r) => (
                  <span
                    key={r}
                    className="rounded bg-gray-100 text-gray-600 text-xs px-2 py-0.5 font-mono"
                  >
                    {r}
                  </span>
                ))}
              </div>
            }
          />
          <InfoRow
            label="最近登录"
            value={me.lastLoginAt ? me.lastLoginAt.slice(0, 16).replace('T', ' ') : '—'}
          />
        </dl>
      </section>

      {/* ─── Unit Info Form ─── */}
      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-base font-semibold text-gray-900">单位信息</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {detail.name}
            {detail.memberLevelName && (
              <span className="ml-2 text-brand-600 font-medium">
                {MEMBER_LEVEL_MAP[detail.memberLevel] ?? detail.memberLevelName}
              </span>
            )}
            {detail.isCertified && (
              <span className="ml-2 text-emerald-600 font-medium">✓ 绿色认证</span>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {/* Logo */}
          <Field label="企业 Logo">
            <LogoUploader
              currentUrl={detail.logoUrl}
              onFileSelected={setPendingLogoFile}
              isUploading={uploadFile.isPending}
            />
          </Field>

          {/* Name (read-only) + ShortName */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="单位全称">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600 select-none">
                {detail.name}
              </div>
            </Field>
            <Field label="简称" error={errors.shortName?.message}>
              <input
                {...register('shortName')}
                placeholder="单位简称（选填，≤50字）"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
              />
            </Field>
          </div>

          {/* Industry */}
          <Field label="所属行业" error={errors.industry?.message}>
            <input
              {...register('industry')}
              placeholder="例如：新能源、节能环保、绿色建筑…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
            />
          </Field>

          {/* Province / City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="省份" error={errors.province?.message}>
              <input
                {...register('province')}
                placeholder="例如：山东"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
              />
            </Field>
            <Field label="城市" error={errors.city?.message}>
              <input
                {...register('city')}
                placeholder="例如：济南"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
              />
            </Field>
          </div>

          {/* Introduction */}
          <Field label="企业简介" error={errors.introduction?.message}>
            <textarea
              {...register('introduction')}
              rows={4}
              placeholder="请输入企业简介（≤2000字）…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition resize-none"
            />
          </Field>

          {/* Contact */}
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 space-y-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              联系方式
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="联系人" error={errors.contactName?.message}>
                <input
                  {...register('contactName')}
                  placeholder="联系人姓名"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
                />
              </Field>
              <Field label="联系电话" error={errors.contactPhone?.message}>
                <input
                  {...register('contactPhone')}
                  placeholder="1XX XXXX XXXX"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
                />
              </Field>
              <Field label="联系邮箱" error={errors.contactEmail?.message}>
                <input
                  {...register('contactEmail')}
                  type="email"
                  placeholder="example@company.com"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
                />
              </Field>
            </div>
          </div>

          {/* Tags display (read-only) */}
          {detail.tags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">行业标签</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.tags.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-full bg-brand-50 text-brand-700 text-xs px-2.5 py-1"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isSaving || (!isDirty && !pendingLogoFile)}
              className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中…' : '保存修改'}
            </button>
            {savedMsg && (
              <span
                className={`text-sm font-medium ${
                  savedMsg.startsWith('保存成功') ? 'text-brand-600' : 'text-red-500'
                }`}
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
