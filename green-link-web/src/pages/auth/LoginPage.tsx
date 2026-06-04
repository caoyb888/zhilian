import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { clsx } from 'clsx'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { FormField } from '@/components/FormField'
import { useAuthStore } from '@/stores/authStore'
import {
  usePasswordLogin,
  useSmsLogin,
  useFetchCaptcha,
  useSendSmsCode,
} from '@/hooks/useAuthMutations'
import { extractApiError } from '@/services/authService'
import { ADMIN_ROLES } from '@/types/api'

const PASSWORD_LOGIN_THRESHOLD = 5

const pwdSchema = z.object({
  username: z.string().min(1, '请输入用户名或手机号'),
  password: z.string().min(1, '请输入密码'),
  captchaCode: z.string().optional(),
})

const smsSchema = z.object({
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  smsCode: z.string().length(6, '验证码为6位数字').regex(/^\d+$/, '验证码只能包含数字'),
})

type PwdForm = z.infer<typeof pwdSchema>
type SmsForm = z.infer<typeof smsSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const accountInfo = useAuthStore((s) => s.accountInfo)

  const [errorMsg, setErrorMsg] = useState('')
  const [localFailCount, setLocalFailCount] = useState(0)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaImg, setCaptchaImg] = useState('')
  const [smsCountdown, setSmsCountdown] = useState(0)

  const pwdLogin = usePasswordLogin()
  const smsLogin = useSmsLogin()
  const fetchCaptchaMutation = useFetchCaptcha()
  const sendSmsMutation = useSendSmsCode()

  const pwdForm = useForm<PwdForm>({ resolver: zodResolver(pwdSchema) })
  const smsForm = useForm<SmsForm>({ resolver: zodResolver(smsSchema) })

  useEffect(() => {
    if (accountInfo) {
      if (accountInfo.roles.some((r) => ADMIN_ROLES.includes(r))) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/supply', { replace: true })
      }
    }
  }, [accountInfo, navigate])

  function redirectByRole(roles: string[]) {
    if (roles.some((r) => ADMIN_ROLES.includes(r))) {
      navigate('/admin', { replace: true })
    } else {
      navigate('/supply', { replace: true })
    }
  }

  async function loadCaptcha() {
    try {
      const data = await fetchCaptchaMutation.mutateAsync()
      setCaptchaToken(data.captchaToken)
      setCaptchaImg(data.imageBase64)
    } catch {
      setErrorMsg('验证码加载失败，请刷新重试')
    }
  }

  async function onPwdSubmit(values: PwdForm) {
    setErrorMsg('')
    try {
      const result = await pwdLogin.mutateAsync({
        username: values.username,
        password: values.password,
        captchaToken: showCaptcha ? captchaToken : undefined,
        captchaCode: showCaptcha ? values.captchaCode : undefined,
      })
      redirectByRole(result.accountInfo.roles)
    } catch (err) {
      const { code, msg } = extractApiError(err)
      setErrorMsg(msg)
      if (code === 2000) {
        const newCount = localFailCount + 1
        setLocalFailCount(newCount)
        if (newCount >= PASSWORD_LOGIN_THRESHOLD) {
          setShowCaptcha(true)
          loadCaptcha()
        }
      } else if (code === 2003) {
        setShowCaptcha(true)
        loadCaptcha()
      }
    }
  }

  async function onSmsSubmit(values: SmsForm) {
    setErrorMsg('')
    try {
      const result = await smsLogin.mutateAsync(values)
      redirectByRole(result.accountInfo.roles)
    } catch (err) {
      setErrorMsg(extractApiError(err).msg)
    }
  }

  async function handleSendSms() {
    const phone = smsForm.getValues('phone')
    const valid = await smsForm.trigger('phone')
    if (!valid) return
    try {
      await sendSmsMutation.mutateAsync({ phone, scene: 'LOGIN' })
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">绿产智链</h1>
          <p className="mt-1 text-sm text-gray-500">山东省绿色低碳产业生态智慧链接平台</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <TabGroup>
            <TabList className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
              {['账号密码', '手机验证码'].map((label) => (
                <Tab
                  key={label}
                  className={({ selected }) =>
                    clsx(
                      'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                      selected
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )
                  }
                >
                  {label}
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              <TabPanel>
                <form onSubmit={pwdForm.handleSubmit(onPwdSubmit)} noValidate>
                  <div className="space-y-4">
                    <FormField
                      label="用户名 / 手机号"
                      htmlFor="username"
                      error={pwdForm.formState.errors.username?.message}
                      required
                    >
                      <Input
                        id="username"
                        placeholder="请输入用户名或手机号"
                        autoComplete="username"
                        error={!!pwdForm.formState.errors.username}
                        {...pwdForm.register('username')}
                      />
                    </FormField>

                    <FormField
                      label="密码"
                      htmlFor="password"
                      error={pwdForm.formState.errors.password?.message}
                      required
                    >
                      <Input
                        id="password"
                        type="password"
                        placeholder="请输入密码"
                        autoComplete="current-password"
                        error={!!pwdForm.formState.errors.password}
                        {...pwdForm.register('password')}
                      />
                    </FormField>

                    {showCaptcha && (
                      <FormField
                        label="图形验证码"
                        htmlFor="captchaCode"
                        error={pwdForm.formState.errors.captchaCode?.message}
                        required
                      >
                        <div className="flex gap-2">
                          <Input
                            id="captchaCode"
                            placeholder="请输入验证码"
                            maxLength={8}
                            error={!!pwdForm.formState.errors.captchaCode}
                            inputClassName="flex-1"
                            {...pwdForm.register('captchaCode')}
                          />
                          <button
                            type="button"
                            onClick={loadCaptcha}
                            className="shrink-0 overflow-hidden rounded-lg border border-gray-200 hover:opacity-80"
                            title="点击刷新验证码"
                          >
                            {captchaImg ? (
                              <img src={captchaImg} alt="验证码" className="h-10 w-28 object-contain" />
                            ) : (
                              <div className="flex h-10 w-28 items-center justify-center text-xs text-gray-400">
                                加载中…
                              </div>
                            )}
                          </button>
                        </div>
                      </FormField>
                    )}

                    {errorMsg && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                        {errorMsg}
                      </p>
                    )}

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      loading={pwdLogin.isPending}
                      className="mt-2"
                    >
                      登录
                    </Button>
                  </div>
                </form>
              </TabPanel>

              <TabPanel>
                <form onSubmit={smsForm.handleSubmit(onSmsSubmit)} noValidate>
                  <div className="space-y-4">
                    <FormField
                      label="手机号"
                      htmlFor="phone"
                      error={smsForm.formState.errors.phone?.message}
                      required
                    >
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="请输入手机号"
                        autoComplete="tel"
                        maxLength={11}
                        error={!!smsForm.formState.errors.phone}
                        {...smsForm.register('phone')}
                      />
                    </FormField>

                    <FormField
                      label="验证码"
                      htmlFor="smsCode"
                      error={smsForm.formState.errors.smsCode?.message}
                      required
                    >
                      <div className="flex gap-2">
                        <Input
                          id="smsCode"
                          type="text"
                          inputMode="numeric"
                          placeholder="6位验证码"
                          maxLength={6}
                          error={!!smsForm.formState.errors.smsCode}
                          inputClassName="flex-1"
                          {...smsForm.register('smsCode')}
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

                    {errorMsg && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                        {errorMsg}
                      </p>
                    )}

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      loading={smsLogin.isPending}
                      className="mt-2"
                    >
                      登录
                    </Button>
                  </div>
                </form>
              </TabPanel>
            </TabPanels>
          </TabGroup>

          <div className="mt-6">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-gray-200" />
              <span className="px-3 text-xs text-gray-400">或</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <button
              type="button"
              disabled
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              title="微信登录即将开放"
            >
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.5 14.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm7 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
              </svg>
              微信登录（即将开放）
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            还没有账号？
            <Link to="/register" className="ml-1 font-medium text-brand-600 hover:text-brand-700">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
