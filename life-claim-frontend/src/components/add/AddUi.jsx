import { useTheme } from '../../context/ThemeContext'
import { actionButtonStyle } from '../../ui/pageTokens'

export function useAddUiTokens() {
  return useTheme().tokens
}

export function ROField({ label, value, span }) {
  const T = useAddUiTokens()
  return (
    <div style={{ gridColumn: span ? '1/-1' : 'auto' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: T.textSecondary, padding: '8px 10px', background: T.inputBgReadonly, borderRadius: '6px', border: `1px solid ${T.border}`, minHeight: '36px', wordBreak: 'break-word' }}>
        {value != null && value !== '' ? String(value) : '—'}
      </div>
    </div>
  )
}

export function ROGrid({ cols = 3, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px' }}>{children}</div>
}

export function SectionTitle({ children }) {
  const T = useAddUiTokens()
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', paddingBottom: '6px', borderBottom: `2px solid ${T.border}` }}>
      {children}
    </div>
  )
}

export function PrimaryBtn({ children, onClick, disabled, variant = 'primary' }) {
  const T = useAddUiTokens()
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        ...actionButtonStyle(T, variant, { disabled, size: 'compact' }),
      }}
      onMouseEnter={(e) => {
        if (disabled || variant === 'secondary') return
        e.currentTarget.style.filter = 'brightness(0.92)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = ''
      }}
    >
      {children}
    </button>
  )
}
