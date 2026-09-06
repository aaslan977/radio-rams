import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/index.css'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

// registerType: 'autoUpdate' сам активирует новый воркер и перезагружает
// вкладку без диалога — но только если вообще заметит обновление. Без этого
// вызова (голого navigator.serviceWorker.register из авто-инжекта) страница
// никогда не проверяет sw.js повторно, и уже открытая вкладка годами крутит
// бандл на момент первой загрузки — на установленном PWA у пользователя нет
// даже очевидного жеста «обновить». Периодическая проверка нужна тем, кто
// держит радио открытым часами, не перезагружая вкладку.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL_MS)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
