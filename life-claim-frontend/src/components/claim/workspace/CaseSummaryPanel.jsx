import { useWorkspaceTokens } from './workspaceUi'
import { Download } from 'lucide-react'
import { buildCaseSummaryReport } from '../../../util/caseSummaryText'
import { downloadCaseSummaryPdf } from '../../../util/downloadCaseSummaryPdf'
import { useToast } from '../../Toast'
import { useState } from 'react'

function SummaryCell({ label, value }) {
  const WS = useWorkspaceTokens()
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '9px', fontWeight: 700, color: WS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2 }}>{label}</div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: WS.textSecondary, marginTop: '1px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>
        {value || '—'}
      </div>
    </div>
  )
}

/** Always-visible compact case summary for the top of claim workspace. */
export default function CaseSummaryPanel({ claim, demogs }) {
  const WS = useWorkspaceTokens()
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const report = buildCaseSummaryReport(claim, demogs)
  const hasContent = report.sections.some((s) => s.rows.some((r) => r.value && r.value !== '—'))

  const downloadPdf = async () => {
    if (!hasContent) {
      toast('warning', 'No summary', 'Case summary is not available yet.')
      return
    }
    setDownloading(true)
    try {
      await downloadCaseSummaryPdf({ claim, demogs })
      toast('success', 'PDF downloaded', `Case summary for ${claim?.claimId || 'claim'} saved.`)
    } catch (e) {
      toast('error', 'Download failed', e?.message || 'Could not generate PDF.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{
      background: WS.card,
      borderRadius: '8px',
      border: `1px solid ${WS.border}`,
      marginBottom: '10px',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '6px 12px',
        background: WS.surfaceSubtle,
        borderBottom: `1px solid ${WS.borderSubtle}`,
      }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: WS.textPrimary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Case summary</span>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={downloading || !hasContent}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: `1px solid ${WS.border}`,
            background: WS.card,
            fontSize: '11px',
            fontWeight: 700,
            cursor: downloading ? 'wait' : 'pointer',
            color: WS.primary,
            fontFamily: 'Inter,sans-serif',
            opacity: downloading || !hasContent ? 0.6 : 1,
          }}
        >
          <Download size={12} /> PDF
        </button>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', maxHeight: '132px' }}>
        {report.sections.map((section) => (
          <div
            key={section.title}
            style={{
              padding: '8px 12px',
              borderRight: `1px solid ${WS.borderSubtle}`,
              minWidth: '148px',
              maxWidth: '180px',
              flex: '1 0 148px',
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: 800, color: WS.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              {section.title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }}>
              {section.rows.map((row) => (
                <SummaryCell key={`${section.title}-${row.label}`} label={row.label} value={row.value} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
