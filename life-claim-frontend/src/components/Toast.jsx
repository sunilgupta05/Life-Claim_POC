import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { alertBannerStyle } from '../ui/pageTokens'

const ToastCtx = createContext(null)

const TOAST_TONES = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

function toastTone(type) {
  if (type === 'error') return 'danger'
  if (type === 'warning') return 'warn'
  return type === 'success' ? 'success' : 'info'
}

function toastAccent(T, type) {
  const map = {
    success: T.success,
    error: T.danger,
    warning: T.warning,
    info: T.primary,
  }
  return map[type] || T.primary
}

function ToastItem({ id, type = 'info', title, message, onRemove }) {
  const { tokens: T } = useTheme()
  const Icon = TOAST_TONES[type] || Info
  const accent = toastAccent(T, type)
  const banner = alertBannerStyle(T, toastTone(type))
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10)
    let t3
    const t2 = setTimeout(() => {
      setVisible(false)
      t3 = setTimeout(() => onRemove(id), 300)
    }, 3500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [id, onRemove])

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      background: T.isDark ? T.card : banner.background,
      border: banner.border,
      borderLeft: `4px solid ${accent}`,
      borderRadius: '10px', padding: '12px 14px',
      boxShadow: T.toastShadow,
      minWidth: '300px', maxWidth: '400px',
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: '2px', background: accent,
        animation: 'toastProgress 3.5s linear forwards',
        opacity: 0.5,
      }} />
      <Icon size={18} style={{ color: accent, flexShrink: 0, marginTop: '1px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontSize: '13px', fontWeight: 700, color: T.textPrimary, marginBottom: message ? '4px' : 0 }}>{title}</div>}
        {message && <div style={{ fontSize: '12px', color: T.textSecondary, lineHeight: 1.5 }}>{message}</div>}
      </div>
      <button onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSubtle, padding: '2px', flexShrink: 0 }}>
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback((type, title, message) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((t) => [...t, { id, type, title, message }])
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map((t) => <ToastItem key={t.id} {...t} onRemove={remove} />)}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
