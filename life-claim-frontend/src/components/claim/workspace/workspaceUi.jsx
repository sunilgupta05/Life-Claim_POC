import { useTheme } from '../../../context/ThemeContext'

export function useWorkspaceTokens() {
  const T = useTheme().tokens
  return {
    primary: T.primary,
    card: T.card,
    border: T.border,
    borderSubtle: T.borderSubtle,
    textPrimary: T.textPrimary,
    textSecondary: T.textSecondary,
    textMuted: T.textMuted,
    textSubtle: T.textSubtle,
    hoverBg: T.hoverBg,
    surfaceMuted: T.surfaceMuted,
    surfaceSubtle: T.surfaceSubtle,
    inputBg: T.inputBg,
    inputBgReadonly: T.inputBgReadonly,
    sectionOpenBg: T.sectionOpenBg,
    sectionClosedBg: T.sectionClosedBg,
    primaryLight: T.primaryLight,
    pending: T.pending,
    approved: T.approved,
    rejected: T.rejected,
    info: T.info,
  }
}

/** Inline workspace table header row */
export function workspaceTheadRowStyle(WS) {
  return { background: WS.surfaceMuted }
}

/** Select / date inputs inside claim workspace */
export function workspaceFieldStyle(WS, extra = {}) {
  return {
    background: WS.inputBg,
    color: WS.textPrimary,
    border: `1px solid ${WS.border}`,
    fontFamily: 'Inter,sans-serif',
    ...extra,
  }
}

export function Accordion({ title, subtitle, open, onToggle, children }) {
  const WS = useWorkspaceTokens()
  return (
    <div style={{ border: `1px solid ${WS.border}`, borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: 'none',
          background: open ? WS.sectionOpenBg : WS.sectionClosedBg,
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'Inter,sans-serif',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: WS.textPrimary }}>{title}</div>
          {subtitle && <div style={{ fontSize: '11px', color: WS.textMuted, marginTop: '2px' }}>{subtitle}</div>}
        </div>
        <span style={{ fontSize: '18px', color: WS.textSubtle }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ padding: '12px 14px', borderTop: `1px solid ${WS.borderSubtle}` }}>{children}</div>}
    </div>
  )
}

export function ROField({ label, value, span }) {
  const WS = useWorkspaceTokens()
  return (
    <div style={{ gridColumn: span ? '1/-1' : 'auto' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: WS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: WS.textSecondary, padding: '8px 10px', background: WS.inputBgReadonly, borderRadius: '6px', border: `1px solid ${WS.border}`, minHeight: '36px' }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

export function SubTabNav({ tabs, active, onChange }) {
  const WS = useWorkspaceTokens()
  return (
    <div style={{ display: 'flex', gap: '4px', background: WS.surfaceMuted, border: `1px solid ${WS.border}`, borderRadius: '8px', padding: '3px', marginBottom: '20px', flexWrap: 'wrap', width: 'fit-content', maxWidth: '100%' }}>
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'Inter,sans-serif',
            transition: 'all 0.15s',
            background: active === t ? WS.primary : 'transparent',
            color: active === t ? '#fff' : WS.textSecondary,
            boxShadow: active === t ? '0 2px 6px rgba(29,78,216,0.25)' : 'none',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

export function EditableField({ label, value, onChange, disabled, type = 'text', options }) {
  const WS = useWorkspaceTokens()
  const base = {
    width: '100%',
    height: '38px',
    padding: '0 10px',
    border: `1.5px solid ${WS.border}`,
    borderRadius: '7px',
    background: disabled ? WS.inputBgReadonly : WS.inputBg,
    fontSize: '13px',
    fontFamily: 'Inter,sans-serif',
    color: disabled ? WS.textMuted : WS.textPrimary,
    boxSizing: 'border-box',
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: WS.textSecondary, marginBottom: '4px', textTransform: 'uppercase' }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ ...base, cursor: disabled ? 'default' : 'pointer' }}>
          <option value="">—</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} readOnly={disabled} style={base} />
      )}
    </div>
  )
}

export function SimpleTable({ columns, rows, empty = 'No records.' }) {
  const WS = useWorkspaceTokens()
  if (!rows?.length) {
    return <div style={{ fontSize: '13px', color: WS.textSubtle, padding: '16px' }}>{empty}</div>
  }
  return (
    <div className="premium-grid" style={{ borderRadius: '10px' }}>
      <div className="premium-grid__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key}>{row[c.key] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
