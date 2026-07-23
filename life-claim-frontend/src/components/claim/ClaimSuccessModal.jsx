import { useTheme } from '../../context/ThemeContext'

/** Centered success dialog — same pattern as registration claim submit. */
export default function ClaimSuccessModal({
  open,
  title,
  message,
  claimNo,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  const { tokens: T } = useTheme()
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: T.overlay,
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: T.card,
          borderRadius: '16px',
          padding: '32px 28px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          border: `1px solid ${T.border}`,
          boxShadow: T.dropdownShadow,
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: T.approved.bg,
            border: `2px solid ${T.approved.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px',
          }}
        >
          ✓
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: T.textPrimary, marginBottom: '8px' }}>{title}</h2>
        <p style={{ fontSize: '14px', color: T.textMuted, lineHeight: 1.5, marginBottom: claimNo ? '12px' : '24px' }}>{message}</p>
        {claimNo && (
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '15px',
              fontWeight: 700,
              color: T.primary,
              background: T.primaryLight,
              border: `1px solid ${T.primaryBorder}`,
              borderRadius: '8px',
              padding: '10px 16px',
              marginBottom: '24px',
            }}
          >
            {claimNo}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: `1px solid ${T.border}`,
                background: T.surfaceMuted,
                color: T.textSecondary,
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              {secondaryLabel}
            </button>
          )}
          {primaryLabel && onPrimary && (
            <button
              type="button"
              onClick={onPrimary}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: T.primary,
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
