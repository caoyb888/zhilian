import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import {
  Leaf,
  Check,
  Building2,
  MapPin,
  Tag,
  FileText,
  User,
  Smartphone,
  Lock,
  CheckCircle2,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { FormField } from '@/components/FormField'
import { useRegister, useSendSmsCode } from '@/hooks/useAuthMutations'
import { extractApiError } from '@/services/authService'

const schema = z.object({
  name: z.string().min(2, '单位名称至少2个字').max(200, '单位名称过长'),
  shortName: z.string().max(50, '简称过长').optional(),
  industry: z.string().min(1, '请填写所属行业'),
  province: z.string().optional(),
  city: z.string().optional(),
  username: z
    .string()
    .min(4, '用户名至少4个字符')
    .max(50, '用户名过长')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z
    .string()
    .min(8, '密码至少8个字符')
    .max(20, '密码最多20个字符')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/, '密码须同时包含字母和数字'),
  confirmPassword: z.string(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  smsCode: z.string().length(6, '验证码为6位').regex(/^\d+$/, '只能包含数字'),
  agreeTerms: z.boolean().refine((v) => v, '请同意用户协议'),
}).refine((d) => d.password === d.confirmPassword, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

type RegisterState = 'form' | 'success'

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    let score = 0
    if (!password) return 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    if (password.length >= 12) score++
    return Math.min(score, 4)
  }, [password])

  const labels = ['', '弱', '中', '强', '极强']
  const colors = ['bg-stone-200', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600']
  const textColors = ['text-stone-400', 'text-red-500', 'text-amber-500', 'text-emerald-600', 'text-emerald-700']

  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i <= strength ? colors[strength] : 'bg-stone-100'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-stone-500">
        密码强度：
        <span className={clsx('font-medium', textColors[strength])}>
          {labels[strength]}
        </span>
      </p>
    </div>
  )
}

// ─── Shared Left Brand Panel ───────────────────────────────────────────────────

function LeftBrand() {
  return (
    <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-emerald-800 text-white flex-col justify-center p-12">
      <div className="relative z-10">
        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-emerald-400/30 shadow-lg">
          <Icon icon={Leaf} size={36} className="text-emerald-300" />
        </div>
        <h1 className="text-3xl font-bold mb-2 leading-tight">绿产智链</h1>
        <p className="text-emerald-100 text-base mb-8 opacity-90">
          山东省绿色低碳产业生态智慧链接平台
        </p>

        <div className="space-y-3 text-sm">
          {['资源高效聚合', '智能精准匹配', '在线便捷对接', '成交闭环归档'].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="text-emerald-400">●</span>
              <span className="text-emerald-100">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative circles */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-900 rounded-full opacity-50 animate-float" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-900/40 rounded-full" />
    </div>
  )
}

// ─── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-stone-100 p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-gray-800 flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm shadow-emerald-200">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [pageState, setPageState] = useState<RegisterState>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const [smsCountdown, setSmsCountdown] = useState(0)
  const [registeredMemberId, setRegisteredMemberId] = useState<number | null>(null)

  const registerMutation = useRegister()
  const sendSmsMutation = useSendSmsCode()

  const { register, handleSubmit, trigger, getValues, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { agreeTerms: false },
  })

  const passwordValue = watch('password')

  async function handleSendSms() {
    const phone = getValues('phone')
    const valid = await trigger('phone')
    if (!valid) return
    try {
      await sendSmsMutation.mutateAsync({ phone, scene: 'REGISTER' })
      setSmsCountdown(60)
      const timer = setInterval(() => {
        setSmsCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0 }
          return c - 1
        })
      }, 1000)
    } catch (err) {
      setErrorMsg(extractApiError(err).msg)
    }
  }

  async function onSubmit(values: FormValues) {
    setErrorMsg('')
    try {
      const result = await registerMutation.mutateAsync({
        name: values.name,
        shortName: values.shortName || undefined,
        industry: values.industry,
        province: values.province || undefined,
        city: values.city || undefined,
        username: values.username,
        password: values.password,
        phone: values.phone,
        smsCode: values.smsCode,
      })
      setRegisteredMemberId(result.memberId)
      setPageState('success')
    } catch (err) {
      setErrorMsg(extractApiError(err).msg)
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (pageState === 'success') {
    return (
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,_#064e3b,_#022c22)]">
        <LeftBrand />

        <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2 xl:w-2/5">
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="rounded-3xl bg-white p-10 shadow-2xl text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/80 ring-offset-4 ring-offset-white text-emerald-500">
                <Icon icon={CheckCircle2} size={42} />
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 mb-4">
                <Icon icon={Check} size={12} />
                申请已提交
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-2">注册申请已提交！</h2>
              <p className="text-sm text-stone-600 leading-relaxed mb-1">
                您的申请（编号：<span className="font-semibold text-emerald-600">{registeredMemberId}</span>）已提交，
                协会工作人员将在 <strong className="text-gray-700">1–3 个工作日</strong>内完成审核。
              </p>
              <p className="text-sm text-stone-500 mb-8">审核通过后，您将收到短信通知，届时即可登录平台。</p>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 transition shadow-lg shadow-emerald-200 active:scale-[0.97]"
              >
                返回登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Form state ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,_#064e3b,_#022c22)]">
      <LeftBrand />

      {/* ─── Right Form ─── */}
      <div className="flex w-full items-start justify-center bg-white lg:bg-transparent px-4 py-8 lg:w-1/2 xl:w-2/5 overflow-y-auto">
        <div className="w-full max-w-xl animate-fade-in-up">
          {/* Mobile logo */}
          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 shadow-md shadow-emerald-200">
              <Icon icon={Leaf} size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">申请加入绿产智链</h1>
            <p className="mt-1 text-sm text-stone-500">提交后等待协会审核，审核通过即可使用平台全部功能</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold text-white">申请加入绿产智链</h2>
            <p className="mt-1 text-sm text-emerald-200/80">提交申请后，协会将在 1–3 个工作日内完成审核</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* ── Section 1: Unit Info ── */}
            <SectionCard step={1} title="单位信息">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="单位名称"
                  htmlFor="name"
                  error={errors.name?.message}
                  required
                  className="sm:col-span-2"
                >
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={Building2} size={16} />
                    </div>
                    <Input
                      id="name"
                      inputClassName="pl-9 rounded-xl"
                      placeholder="请输入完整的单位名称"
                      error={!!errors.name}
                      {...register('name')}
                    />
                  </div>
                </FormField>

                <FormField label="单位简称" htmlFor="shortName" error={errors.shortName?.message}>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={FileText} size={16} />
                    </div>
                    <Input
                      id="shortName"
                      inputClassName="pl-9 rounded-xl"
                      placeholder="选填"
                      error={!!errors.shortName}
                      {...register('shortName')}
                    />
                  </div>
                </FormField>

                <FormField label="所属行业" htmlFor="industry" error={errors.industry?.message} required>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={Tag} size={16} />
                    </div>
                    <Input
                      id="industry"
                      inputClassName="pl-9 rounded-xl"
                      placeholder="如：新能源、绿色建材"
                      error={!!errors.industry}
                      {...register('industry')}
                    />
                  </div>
                </FormField>

                <FormField label="省份" htmlFor="province" error={errors.province?.message}>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={MapPin} size={16} />
                    </div>
                    <Input
                      id="province"
                      inputClassName="pl-9 rounded-xl"
                      placeholder="如：山东省"
                      error={!!errors.province}
                      {...register('province')}
                    />
                  </div>
                </FormField>

                <FormField label="城市" htmlFor="city" error={errors.city?.message}>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={MapPin} size={16} />
                    </div>
                    <Input
                      id="city"
                      inputClassName="pl-9 rounded-xl"
                      placeholder="如：济南市"
                      error={!!errors.city}
                      {...register('city')}
                    />
                  </div>
                </FormField>
              </div>
            </SectionCard>

            {/* ── Section 2: Account Info ── */}
            <SectionCard step={2} title="账号信息">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="登录用户名"
                  htmlFor="username"
                  error={errors.username?.message}
                  required
                  hint="4–50位，字母、数字、下划线"
                >
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={User} size={16} />
                    </div>
                    <Input
                      id="username"
                      inputClassName="pl-9 rounded-xl"
                      autoComplete="username"
                      placeholder="请设置登录用户名"
                      error={!!errors.username}
                      {...register('username')}
                    />
                  </div>
                </FormField>

                <FormField
                  label="手机号"
                  htmlFor="reg-phone"
                  error={errors.phone?.message}
                  required
                >
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={Smartphone} size={16} />
                    </div>
                    <Input
                      id="reg-phone"
                      inputClassName="pl-9 rounded-xl"
                      type="tel"
                      maxLength={11}
                      placeholder="用于接收验证码"
                      error={!!errors.phone}
                      {...register('phone')}
                    />
                  </div>
                </FormField>

                <FormField
                  label="密码"
                  htmlFor="reg-password"
                  error={errors.password?.message}
                  required
                  hint="8–20位，须含字母和数字"
                >
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={Lock} size={16} />
                    </div>
                    <Input
                      id="reg-password"
                      inputClassName="pl-9 rounded-xl"
                      type="password"
                      autoComplete="new-password"
                      placeholder="请设置登录密码"
                      error={!!errors.password}
                      {...register('password')}
                    />
                  </div>
                  <PasswordStrength password={passwordValue} />
                </FormField>

                <FormField label="确认密码" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={Lock} size={16} />
                    </div>
                    <Input
                      id="confirmPassword"
                      inputClassName="pl-9 rounded-xl"
                      type="password"
                      autoComplete="new-password"
                      placeholder="再次输入密码"
                      error={!!errors.confirmPassword}
                      {...register('confirmPassword')}
                    />
                  </div>
                </FormField>

                <FormField
                  label="短信验证码"
                  htmlFor="reg-smsCode"
                  error={errors.smsCode?.message}
                  required
                  className="sm:col-span-2"
                >
                  <div className="flex gap-2">
                    <Input
                      id="reg-smsCode"
                      type="text"
                      inputMode="numeric"
                      placeholder="6位验证码"
                      maxLength={6}
                      error={!!errors.smsCode}
                      inputClassName="flex-1 rounded-xl"
                      {...register('smsCode')}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      className="shrink-0 rounded-xl"
                      disabled={smsCountdown > 0}
                      loading={sendSmsMutation.isPending}
                      onClick={handleSendSms}
                    >
                      {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
                    </Button>
                  </div>
                </FormField>
              </div>
            </SectionCard>

            {/* ── Terms ── */}
            <div className="flex items-start gap-2.5 px-1">
              <input
                id="agreeTerms"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                {...register('agreeTerms')}
              />
              <label htmlFor="agreeTerms" className="text-sm text-stone-600 leading-relaxed">
                我已阅读并同意
                <a href="#" className="mx-1 text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">《用户服务协议》</a>
                和
                <a href="#" className="mx-1 text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">《隐私政策》</a>
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="text-xs text-red-500 px-1">{errors.agreeTerms.message}</p>
            )}

            {/* ── Error message ── */}
            {errorMsg && (
              <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">{errorMsg}</p>
            )}

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className={clsx(
                'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-200',
                'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-transform duration-150 ease-out'
              )}
            >
              {registerMutation.isPending ? '提交中…' : '提交注册申请'}
            </button>

            <p className="text-center text-sm text-stone-500 pb-4">
              已有账号？
              <Link to="/login" className="ml-1 font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                立即登录
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
