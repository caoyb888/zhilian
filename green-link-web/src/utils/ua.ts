const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

export const isWeChat   = /MicroMessenger/i.test(ua)
export const isIOS      = /iPhone|iPad|iPod/i.test(ua)
export const isAndroid  = /Android/i.test(ua)
export const isMobile   = isIOS || isAndroid
