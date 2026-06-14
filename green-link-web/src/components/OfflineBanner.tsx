import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { Icon } from '@/components/Icon'

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-stone-800/95 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm">
      <Icon icon={WifiOff} size={13} className="flex-shrink-0 text-stone-300" />
      <span>当前处于离线状态，显示缓存内容</span>
    </div>
  )
}
