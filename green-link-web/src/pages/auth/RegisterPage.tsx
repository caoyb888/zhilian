import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

export default function RegisterPage() {
  const [pageState, setPageState] = useState<RegisterState>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const [smsCountdown, setSmsCountdown] = useState(0)
  const [registeredMemberId, setRegisteredMemberId] = useState<number | null>(null)

  const registerMutation = useRegister()
  const sendSmsMutation = useSendSmsCode()

  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { agreeTerms: false },
  })

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <svg className="h-8 w-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">注册成功！</h2>
          <p className="mt-2 text-sm text-gray-600">
            您的申请（编号：{registeredMemberId}）已提交，协会工作人员将在 <strong>1–3 个工作日</strong>内完成审核。
          </p>
          <p className="mt-1 text-sm text-gray-500">审核通过后，您将收到短信通知，届时即可登录平台。</p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            返回登录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">申请加入绿产智链</h1>
          <p className="mt-1 text-sm text-gray-500">提交后等待协会审核，审核通过即可使用平台全部功能</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-base font-semibold text-gray-700">单位信息</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="单位名称"
                htmlFor="name"
                error={errors.name?.message}
                required
                className="sm:col-span-2"
              >
                <Input
                  id="name"
                  placeholder="请输入完整的单位名称"
                  error={!!errors.name}
                  {...register('name')}
                />
              </FormField>

              <FormField label="单位简称" htmlFor="shortName" error={errors.shortName?.message}>
                <Input
                  id="shortName"
                  placeholder="选填"
                  error={!!errors.shortName}
                  {...register('shortName')}
                />
              </FormField>

              <FormField label="所属行业" htmlFor="industry" error={errors.industry?.message} required>
                <Input
                  id="industry"
                  placeholder="如：新能源、绿色建材"
                  error={!!errors.industry}
                  {...register('industry')}
                />
              </FormField>

              <FormField label="省份" htmlFor="province" error={errors.province?.message}>
                <Input
                  id="province"
                  placeholder="如：山东省"
                  error={!!errors.province}
                  {...register('province')}
                />
              </FormField>

              <FormField label="城市" htmlFor="city" error={errors.city?.message}>
                <Input
                  id="city"
                  placeholder="如：济南市"
                  error={!!errors.city}
                  {...register('city')}
                />
              </FormField>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-base font-semibold text-gray-700">账号信息</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="登录用户名"
                htmlFor="username"
                error={errors.username?.message}
                required
                hint="4–50位，字母、数字、下划线"
              >
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="请设置登录用户名"
                  error={!!errors.username}
                  {...register('username')}
                />
              </FormField>

              <FormField
                label="手机号"
                htmlFor="reg-phone"
                error={errors.phone?.message}
                required
              >
                <Input
                  id="reg-phone"
                  type="tel"
                  maxLength={11}
                  placeholder="用于接收验证码"
                  error={!!errors.phone}
                  {...register('phone')}
                />
              </FormField>

              <FormField label="密码" htmlFor="reg-password" error={errors.password?.message} required
                hint="8–20位，须含字母和数字">
                <Input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="请设置登录密码"
                  error={!!errors.password}
                  {...register('password')}
                />
              </FormField>

              <FormField label="确认密码" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="再次输入密码"
                  error={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
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

          <div className="mt-4 flex items-start gap-2">
            <input
              id="agreeTerms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              {...register('agreeTerms')}
            />
            <label htmlFor="agreeTerms" className="text-sm text-gray-600">
              我已阅读并同意
              <a href="#" className="mx-1 text-brand-600 hover:underline">《用户服务协议》</a>
              和
              <a href="#" className="mx-1 text-brand-600 hover:underline">《隐私政策》</a>
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

          <p className="mt-4 text-center text-sm text-gray-500">
            已有账号？
            <Link to="/login" className="ml-1 font-medium text-brand-600 hover:text-brand-700">
              立即登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
