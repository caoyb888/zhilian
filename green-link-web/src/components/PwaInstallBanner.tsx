import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { isWeChat } from '@/utils/ua'

const STORAGE_KEY = 'pwa-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 微信内置浏览器不支持 PWA，跳过
    if (isWeChat) return
    // 用户已关闭过，不再弹出
    if (localStorage.getItem(STORAGE_KEY)) return

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, '1')
    }
    setDeferredPrompt(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-stone-100">
        <img src="/lsdt-logo.png" alt="" className="h-10 w-10 flex-shrink-0 rounded-xl object-contain" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900">添加到主屏幕</p>
          <p className="text-xs text-stone-400 mt-0.5">随时访问，离线可用</p>
        </div>
        <button
          type="button"
          onClick={install}
          className="flex-shrink-0 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          <span className="flex items-center gap-1">
            <Icon icon={Download} size={13} />
            安装
          </span>
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="flex-shrink-0 rounded-lg p-1 text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-colors"
          aria-label="关闭"
        >
          <Icon icon={X} size={16} />
        </button>
      </div>
    </div>
  )
}
