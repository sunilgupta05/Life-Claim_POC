import { useTheme } from '../../context/ThemeContext'
/** Hover card for claim number (Pool / My Task / Dashboard pattern). */

function statusStyle(status, T) {
  const s = String(status || '').toLowerCase()
  if (s.includes('pending assessor')) return { bg: T.pending.bg, border: T.pending.border, color: T.pending.text }
  if (s.includes('pending verifier')) return { bg: T.info.bg, border: T.info.border, color: T.info.color }
  if (s.includes('approved') || s.includes('accept')) return { bg: T.approved.bg, border: T.approved.border, color: T.approved.text }
  if (s.includes('reject')) return { bg: T.rejected.bg, border: T.rejected.border, color: T.rejected.text }
  return { bg: T.surfaceMuted, border: T.border, color: T.textMuted }
}

export default function ClaimHoverPreview({ claim, x, y }) {
  const { tokens: T } = useTheme()
  if (!claim) return null
  const sc = statusStyle(claim.status, T)
  const left = x + 280 > (typeof window !== 'undefined' ? window.innerWidth : 1200) ? x - 296 : x + 18
  const top = Math.max(8, Math.min(y - 60, (typeof window !== 'undefined' ? window.innerHeight : 800) - 280))

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: '278px',
        zIndex: 9999,
        background: T.card,
        borderRadius: '14px',
        padding: '16px 18px',
        border: `1px solid ${T.border}`,
        boxShadow: T.dropdownShadow,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '13px', color: T.primary, fontFamily: 'monospace' }}>{claim.claimId}</div>
          <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '2px' }}>Policy {claim.policyId || '—'}</div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
          {claim.status || '—'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
        {[['Role', claim.role], ['Created', claim.createdOn], ['By', claim.createdBy], ['Type', claim.claimType]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>{k}</div>
            <div style={{ fontWeight: 600, color: T.textSecondary, marginTop: '2px' }}>{v || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
