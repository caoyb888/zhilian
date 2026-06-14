import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { clsx } from 'clsx'
import { Leaf, Mail, Lock, Smartphone, RefreshCw } from 'lucide-react'
import { Icon } from '@/components/Icon'
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
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from
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
      if (from?.pathname) {
        navigate(from.pathname + (from.search || ''), { replace: true })
        return
      }
      if (accountInfo.roles.some((r) => ADMIN_ROLES.includes(r))) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/supply', { replace: true })
      }
    }
  }, [accountInfo, navigate, from])

  function redirectByRole(roles: string[]) {
    if (from?.pathname) {
      navigate(from.pathname + (from.search || ''), { replace: true })
      return
    }
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_#064e3b,_#022c22)]">
      <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* ─── Left Brand Showcase ─── */}
        <div className="hidden md:flex md:w-5/12 bg-emerald-800 p-8 text-white flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-sm border border-emerald-400/30">
              <Icon icon={Leaf} size={32} className="text-emerald-300" />
            </div>
            <h1 className="text-3xl font-bold mb-2 leading-tight">绿产智链</h1>
            <p className="text-emerald-100 text-base mb-6 opacity-90">
              山东省绿色低碳产业生态智慧链接平台
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-emerald-400">●</span>
                <span>资源高效聚合</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-emerald-400">●</span>
                <span>智能精准匹配</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-emerald-400">●</span>
                <span>在线便捷对接</span>
              </div>
            </div>
          </div>
          {/* Decorative circle */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-900 rounded-full opacity-50 animate-float" />
        </div>

        {/* ─── Right Form ─── */}
        <div className="w-full md:w-7/12 p-5 md:p-8 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="mb-5 text-center md:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
              <Icon icon={Leaf} size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">绿产智链</h1>
            <p className="mt-1 text-sm text-gray-500">山东省绿色低碳产业生态智慧链接平台</p>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-800">登录平台</h2>
            <p className="text-gray-500 mt-1 text-sm">请输入您的凭据以继续访问</p>
          </div>

          <TabGroup>
            <TabList className="mb-3 flex gap-1 rounded-lg bg-stone-100 p-1">
              {['账号密码', '手机验证码'].map((label) => (
                <Tab
                  key={label}
                  className={({ selected }) =>
                    clsx(
                      'flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200',
                      selected
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
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
                  <div className="space-y-3">
                    <FormField
                      label="账号/手机号"
                      htmlFor="username"
                      error={pwdForm.formState.errors.username?.message}
                      required
                    >
                      <div className="relative">
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                          <Icon icon={Mail} size={16} />
                        </div>
                        <Input
                          id="username"
                          inputClassName="pl-9 rounded-xl"
                          placeholder="请输入用户名或手机号"
                          autoComplete="username"
                          error={!!pwdForm.formState.errors.username}
                          {...pwdForm.register('username')}
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="密码"
                      htmlFor="password"
                      error={pwdForm.formState.errors.password?.message}
                      required
                    >
                      <div className="relative">
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                          <Icon icon={Lock} size={16} />
                        </div>
                        <Input
                          id="password"
                          inputClassName="pl-9 rounded-xl"
                          type="password"
                          placeholder="请输入密码"
                          autoComplete="current-password"
                          error={!!pwdForm.formState.errors.password}
                          {...pwdForm.register('password')}
                        />
                      </div>
                    </FormField>

                    {showCaptcha && (
                      <FormField
                        label="图形验证码"
                        htmlFor="captchaCode"
                        error={pwdForm.formState.errors.captchaCode?.message}
                        required
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="captchaCode"
                              inputClassName="rounded-xl"
                              placeholder="请输入验证码"
                              maxLength={8}
                              error={!!pwdForm.formState.errors.captchaCode}
                              {...pwdForm.register('captchaCode')}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={loadCaptcha}
                            disabled={fetchCaptchaMutation.isPending}
                            className="shrink-0 rounded-xl border border-stone-200 p-2 text-stone-400 hover:text-emerald-600 hover:border-emerald-600 transition-all duration-200 disabled:opacity-50"
                            title="刷新验证码"
                          >
                            <Icon
                              icon={RefreshCw}
                              size={16}
                              className={clsx(fetchCaptchaMutation.isPending && 'animate-spin')}
                            />
                          </button>
                          <div className="shrink-0 overflow-hidden rounded-xl border border-stone-200 h-10 w-28 flex items-center justify-center bg-stone-50">
                            {captchaImg ? (
                              <img src={captchaImg} alt="验证码" className="h-10 w-28 object-contain" />
                            ) : (
                              <span className="text-xs text-stone-400">加载中…</span>
                            )}
                          </div>
                        </div>
                      </FormField>
                    )}

                    {errorMsg && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={pwdLogin.isPending}
                      className={clsx(
                        'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-150 ease-out active:scale-[0.96]'
                      )}
                    >
                      {pwdLogin.isPending ? '登录中…' : '立即登录'}
                    </button>
                  </div>
                </form>
              </TabPanel>

              <TabPanel>
                <form onSubmit={smsForm.handleSubmit(onSmsSubmit)} noValidate>
                  <div className="space-y-3">
                    <FormField
                      label="手机号"
                      htmlFor="phone"
                      error={smsForm.formState.errors.phone?.message}
                      required
                    >
                      <div className="relative">
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                          <Icon icon={Smartphone} size={16} />
                        </div>
                        <Input
                          id="phone"
                          inputClassName="pl-9 rounded-xl"
                          type="tel"
                          placeholder="请输入手机号"
                          autoComplete="tel"
                          maxLength={11}
                          error={!!smsForm.formState.errors.phone}
                          {...smsForm.register('phone')}
                        />
                      </div>
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
                          inputClassName="flex-1 rounded-xl"
                          {...smsForm.register('smsCode')}
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

                    {errorMsg && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={smsLogin.isPending}
                      className={clsx(
                        'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-150 ease-out active:scale-[0.96]'
                      )}
                    >
                      {smsLogin.isPending ? '登录中…' : '立即登录'}
                    </button>
                  </div>
                </form>
              </TabPanel>
            </TabPanels>
          </TabGroup>

          {/* Footer links */}
          <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
            <span className="text-emerald-600 font-medium cursor-pointer hover:underline">
              忘记密码?
            </span>
            <p className="text-gray-500">
              还没有账号?
              <Link to="/register" className="ml-1 text-emerald-600 font-bold hover:underline">
                立即注册
              </Link>
            </p>
          </div>

          {/* WeChat QR placeholder */}
          <div className="mt-4 flex justify-center">
            <div className="text-center p-3 border border-dashed border-gray-200 rounded-2xl w-48 hover:border-emerald-300 transition cursor-pointer">
              <div className="text-gray-400 mb-1 text-lg">📱</div>
              <p className="text-xs text-gray-500">微信扫码登录 (即将开放)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
