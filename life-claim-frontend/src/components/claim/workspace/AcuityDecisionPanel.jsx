import { useTheme } from '../../../context/ThemeContext'
import { useWorkspaceTokens } from './workspaceUi'

/** Read-only acuity decision from registration (claims table). */
export default function AcuityDecisionPanel({ acuity, inline = false }) {
  const WS = useWorkspaceTokens()
  const { tokens: T } = useTheme()
  if (!acuity) return null

  const final = acuity.finalAcuityDecision || acuity.final || 'NOT FLAGGED'
  const claimant = acuity.claimantAcuityDecision || acuity.claimant || 'NOT FLAGGED'
  const payee = acuity.payeeAcuityDecision || acuity.payee || 'NOT FLAGGED'
  const flagged = final === 'FLAGGED'

  if (inline) {
    const chip = (label, value) => (
      <span style={{ fontSize: '11px', fontWeight: 600, color: WS.textMuted }}>
        {label}:{' '}
        <span style={{ color: value === 'FLAGGED' ? T.warning : WS.textSecondary, fontWeight: 700 }}>{value}</span>
      </span>
    )
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        padding: '6px 12px',
        borderRadius: '8px',
        background: flagged ? T.pending.bg : WS.surfaceMuted,
        border: `1px solid ${flagged ? T.pending.border : WS.border}`,
      }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: flagged ? T.pending.text : WS.textPrimary }}>Accuity</span>
        {chip('Claimant', claimant)}
        <span style={{ color: WS.border }}>|</span>
        {chip('Payee', payee)}
        <span style={{ color: WS.border }}>|</span>
        <span style={{ fontSize: '11px', fontWeight: 800, color: flagged ? T.pending.text : T.approved.text }}>Final: {final}</span>
      </div>
    )
  }

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: '10px',
      background: flagged ? T.pending.bg : WS.surfaceMuted,
      border: `1px solid ${flagged ? T.pending.border : WS.border}`,
      marginBottom: '12px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 800, color: flagged ? T.warning : WS.textPrimary, marginBottom: '6px' }}>
        Accuity decision
      </div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: WS.textSecondary, lineHeight: 1.5 }}>
        Claimant: {claimant} · Payee: {payee} ·{' '}
        <span style={{ fontWeight: 800, color: flagged ? T.pending.text : T.approved.text }}>Final: {final}</span>
      </div>
    </div>
  )
}
