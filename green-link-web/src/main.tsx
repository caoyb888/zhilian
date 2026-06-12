import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// 动态视口高度：解决微信/移动端键盘弹起时 100vh 错位问题
function syncAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}
window.addEventListener('resize', syncAppHeight)
syncAppHeight()

// backdrop-filter 不支持时（Android 微信低版本）挂载降级 class
if (
  !CSS.supports('backdrop-filter', 'blur(1px)') &&
  !CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
) {
  document.documentElement.classList.add('no-backdrop-blur')
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
