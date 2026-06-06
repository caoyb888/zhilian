import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { clsx } from 'clsx'
import { Leaf, Mail, Lock, Smartphone, RefreshCw, QrCode } from 'lucide-react'
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
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2 xl:w-2/5">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-theme-accent">
              <Icon icon={Leaf} size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-theme-text-main">绿产智链</h1>
            <p className="mt-1 text-sm text-theme-text-muted">山东省绿色低碳产业生态智慧链接平台</p>
          </div>

          <div className="bg-white rounded-2xl shadow-nordic p-8">
            <TabGroup>
              <TabList className="mb-6 flex gap-1 rounded-lg bg-stone-100 p-1">
                {['账号密码', '手机验证码'].map((label) => (
                  <Tab
                    key={label}
                    className={({ selected }) =>
                      clsx(
                        'flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200',
                        selected
                          ? 'bg-white text-theme-accent shadow-sm'
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
                    <div className="space-y-4">
                      <FormField
                        label="用户名 / 手机号"
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
                            inputClassName="pl-9"
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
                            inputClassName="pl-9"
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
                              className="shrink-0 rounded-lg border border-stone-200 p-2 text-stone-400 hover:text-theme-accent hover:border-theme-accent transition-all duration-200 disabled:opacity-50"
                              title="刷新验证码"
                            >
                              <Icon
                                icon={RefreshCw}
                                size={16}
                                className={clsx(fetchCaptchaMutation.isPending && 'animate-spin')}
                              />
                            </button>
                            <div className="shrink-0 overflow-hidden rounded-lg border border-stone-200 h-10 w-28 flex items-center justify-center bg-stone-50">
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
                        <div className="relative">
                          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                            <Icon icon={Smartphone} size={16} />
                          </div>
                          <Input
                            id="phone"
                            inputClassName="pl-9"
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

            {/* Divider + WeChat */}
            <div className="mt-6">
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-stone-200" />
                <span className="px-3 text-xs text-stone-400">或</span>
                <div className="flex-1 border-t border-stone-200" />
              </div>
              <div className="mt-4 flex flex-col items-center">
                <div className="relative mx-auto h-40 w-40 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden">
                  {/* Corner markers */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br" />
                  {/* Scanning line */}
                  <div className="absolute inset-x-4 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-[scan_2.5s_linear_infinite]" />
                  <Icon icon={QrCode} size={40} className="text-stone-300" />
                  <style>{`@keyframes scan { 0%,100%{top:12%} 50%{top:88%} }`}</style>
                </div>
                <p className="mt-2 text-xs text-stone-400">微信扫码登录（即将开放）</p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-stone-500">
              还没有账号？
              <Link to="/register" className="ml-1 font-medium text-theme-accent hover:text-theme-accent-hover transition-colors">
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
