import { useTheme } from '../../context/ThemeContext'
import { getClientIntegrationSummary, INTEGRATION_ROWS, V2_PORTS } from '../../config/integrations'


export default function IntegrationsPanel() {
  const { tokens: T } = useTheme()
  const client = getClientIntegrationSummary()

  return (
    <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${T.border}` }}>
      <div style={{ fontWeight: 800, fontSize: '15px', color: T.textPrimary, marginBottom: '4px' }}>
        Integration dependencies (Section K)
      </div>
      <p style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>
        v2 browser → <code>{client.api.base}</code>
        {client.api.mode === 'vite-proxy' && (
          <> via Vite proxy → <code>{client.api.proxyTarget}</code></>
        )}
        . Alfresco and WhatsApp are <strong>never</strong> called directly from the SPA; documents use authenticated preview fetch.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {[
          ['Environment', client.environment],
          ['Keycloak (info)', client.keycloakUrl],
          ['Idle timeout', `${client.idleMinutes} min`],
          ['Session poll', `${client.sessionCheckMs} ms`],
          ['v2 backend', `:${V2_PORTS.backend}`],
          ['Dev UI', `:${V2_PORTS.frontendDev}`],
        ].map(([k, v]) => (
          <div key={k} style={{ padding: '10px 12px', borderRadius: '8px', background: T.surfaceMuted, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase' }}>{k}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: T.textPrimary, marginTop: '4px', wordBreak: 'break-all' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: T.surfaceMuted }}>
              {['System', 'Purpose', 'Typical host', 'If down'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textSubtle, fontSize: '11px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INTEGRATION_ROWS.map((row) => (
              <tr key={row.id} style={{ borderTop: `1px solid ${T.borderSubtle}` }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: T.primary }}>{row.name}</td>
                <td style={{ padding: '10px 12px', color: T.textMuted }}>{row.usedFor}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px' }}>{row.defaultHost}</td>
                <td style={{ padding: '10px 12px', color: '#991B1B', fontSize: '11px' }}>{row.failure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul style={{ marginTop: '14px', paddingLeft: '18px', fontSize: '11px', color: T.textMuted, lineHeight: 1.6 }}>
        <li>Registration WhatsApp/email can work <strong>without</strong> Rabbit; pool/decision notifications need <code>npm run start:worker</code> in backend.</li>
        <li>After Alfresco IP migration, update <code>DOCUMENT_VIEWER_IP</code> / <code>alfresco_API_URL</code> — not <code>DEV_DOCUMENT_STORAGE_LOCATION</code> UUID.</li>
        <li>Full matrix: <code>docs/INTEGRATIONS.md</code> in the repo root.</li>
      </ul>
    </div>
  )
}
