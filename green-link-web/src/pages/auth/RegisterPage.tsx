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

  if (pageState === 'success') {
    return (
      <div className="flex min-h-screen bg-theme-bg">
        {/* Left brand */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-emerald-800 to-stone-900 text-white flex-col items-center justify-center p-12">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="relative z-10 flex flex-col items-center text-center max-w-md">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg">
              <Icon icon={Leaf} size={40} className="text-emerald-300" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">绿产智链</h2>
            <p className="mt-3 text-lg text-emerald-100/80 leading-relaxed">
              山东省绿色低碳产业生态智慧链接平台
            </p>
          </div>
        </div>

        {/* Success content */}
        <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2 xl:w-2/5">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-theme-accent/10">
              <Icon icon={Check} size={32} className="text-theme-accent" />
            </div>
            <h2 className="text-xl font-bold text-theme-text-main">注册成功！</h2>
            <p className="mt-2 text-sm text-stone-600">
              您的申请（编号：{registeredMemberId}）已提交，协会工作人员将在 <strong>1–3 个工作日</strong>内完成审核。
            </p>
            <p className="mt-1 text-sm text-stone-500">审核通过后，您将收到短信通知，届时即可登录平台。</p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-lg bg-theme-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-theme-accent-hover transition-colors"
            >
              返回登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-theme-bg">
      {/* ─── Left Brand Showcase ─── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-emerald-800 to-stone-900 text-white flex-col items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg">
            <Icon icon={Leaf} size={40} className="text-emerald-300" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">绿产智链</h2>
          <p className="mt-3 text-lg text-emerald-100/80 leading-relaxed">
            山东省绿色低碳产业生态智慧链接平台
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-emerald-100/60">
            <span>资源聚合</span>
            <span className="h-1 w-1 rounded-full bg-emerald-400/60" />
            <span>智能匹配</span>
            <span className="h-1 w-1 rounded-full bg-emerald-400/60" />
            <span>在线对接</span>
            <span className="h-1 w-1 rounded-full bg-emerald-400/60" />
            <span>成交归档</span>
          </div>
        </div>
      </div>

      {/* ─── Right Form ─── */}
      <div className="flex w-full items-start justify-center px-4 py-8 lg:w-1/2 xl:w-2/5 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-theme-accent">
              <Icon icon={Leaf} size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-theme-text-main">申请加入绿产智链</h1>
            <p className="mt-1 text-sm text-theme-text-muted">提交后等待协会审核，审核通过即可使用平台全部功能</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Unit Info */}
            <div className="rounded-2xl bg-white p-6 shadow-nordic">
              <h2 className="mb-4 text-base font-semibold text-theme-text-main flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 text-xs">1</span>
                单位信息
              </h2>
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
                      inputClassName="pl-9"
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
                      inputClassName="pl-9"
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
                      inputClassName="pl-9"
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
                      inputClassName="pl-9"
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
                      inputClassName="pl-9"
                      placeholder="如：济南市"
                      error={!!errors.city}
                      {...register('city')}
                    />
                  </div>
                </FormField>
              </div>
            </div>

            {/* Account Info */}
            <div className="mt-4 rounded-2xl bg-white p-6 shadow-nordic">
              <h2 className="mb-4 text-base font-semibold text-theme-text-main flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 text-xs">2</span>
                账号信息
              </h2>
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
                      inputClassName="pl-9"
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
                      inputClassName="pl-9"
                      type="tel"
                      maxLength={11}
                      placeholder="用于接收验证码"
                      error={!!errors.phone}
                      {...register('phone')}
                    />
                  </div>
                </FormField>

                <FormField label="密码" htmlFor="reg-password" error={errors.password?.message} required
                  hint="8–20位，须含字母和数字">
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <Icon icon={Lock} size={16} />
                    </div>
                    <Input
                      id="reg-password"
                      inputClassName="pl-9"
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
                      inputClassName="pl-9"
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
                      inputClassName="flex-1"
                      {...register('smsCode')}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      className="shrink-0"
                      disabled={smsCountdown > 0}
                      loading={sendSmsMutation.isPending}
                      onClick={handleSendSms}
                    >
                      {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
                    </Button>
                  </div>
                </FormField>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-4 flex items-start gap-2">
              <input
                id="agreeTerms"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-theme-accent focus:ring-theme-accent cursor-pointer"
                {...register('agreeTerms')}
              />
              <label htmlFor="agreeTerms" className="text-sm text-stone-600">
                我已阅读并同意
                <a href="#" className="mx-1 text-theme-accent hover:underline transition-colors">《用户服务协议》</a>
                和
                <a href="#" className="mx-1 text-theme-accent hover:underline transition-colors">《隐私政策》</a>
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="mt-1 text-xs text-red-500">{errors.agreeTerms.message}</p>
            )}

            {errorMsg && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</p>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={registerMutation.isPending}
              className="mt-6"
            >
              提交注册申请
            </Button>

            <p className="mt-4 text-center text-sm text-stone-500">
              已有账号？
              <Link to="/login" className="ml-1 font-medium text-theme-accent hover:text-theme-accent-hover transition-colors">
                立即登录
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
