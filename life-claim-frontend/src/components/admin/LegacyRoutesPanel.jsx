import { useTheme } from '../../context/ThemeContext'
import { alertBannerStyle, statusPillStyle } from '../../ui/pageTokens'
import {
  V2_ACTIVE_ROUTES,
  V2_ROUTE_ALIASES,
  DORMANT_FRONTEND_PAGES,
  V1_SUPERSEDED_PATTERNS,
} from '../../config/legacyRoutes'


export default function LegacyRoutesPanel() {
  const { tokens: T } = useTheme()
  return (
    <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${T.border}` }}>
      <div style={{ fontWeight: 800, fontSize: '15px', color: T.textPrimary, marginBottom: '4px' }}>
        Legacy & dormant routes (Section L)
      </div>
      <p style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>
        v2 <code>App.jsx</code> has no commented route block (unlike v1). Orphan pages below are intentionally unrouted.
        Full list: <code>docs/LEGACY_ROUTES.md</code>.
      </p>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', marginBottom: '8px' }}>
          Active v2 routes ({V2_ACTIVE_ROUTES.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {V2_ACTIVE_ROUTES.map((r) => (
            <span key={r.path} style={statusPillStyle(T, 'success', { fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace' })}>
              {r.path}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', marginBottom: '8px' }}>
          v1 aliases
        </div>
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: T.textMuted }}>
          {V2_ROUTE_ALIASES.map((a) => (
            <li key={a.from}>
              <code>{a.from}</code> → <code>{a.to}</code>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ ...alertBannerStyle(T, 'warn'), borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '13px', color: T.pending.text ?? T.pending.color, marginBottom: '8px' }}>Dormant pages (file exists, no route)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr>
              {['Feature', 'File', 'Backend'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textSubtle, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DORMANT_FRONTEND_PAGES.map((row) => (
              <tr key={row.id} style={{ borderTop: `1px solid ${T.pending.border}` }}>
                <td style={{ padding: '8px', fontWeight: 600, color: T.pending.text ?? T.pending.color }}>{row.id}</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{row.file}</td>
                <td style={{ padding: '8px', color: T.textMuted }}>{row.backend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '12px' }}>
        <strong>v1 → v2 consolidation:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
          {V1_SUPERSEDED_PATTERNS.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      <p style={{ fontSize: '11px', color: T.textSubtle }}>
        <strong>Ask Me</strong> chat in shell is UI preview only (no AI backend).
        Eagle <strong>hospital rows</strong> live inside claim workspace — not Hospital Search module.
      </p>
    </div>
  )
}
