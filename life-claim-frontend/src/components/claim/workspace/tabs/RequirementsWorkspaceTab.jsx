import { useState } from 'react'
import { useToast } from '../../../Toast'
import { Accordion, SimpleTable, useWorkspaceTokens, workspaceFieldStyle, workspaceTheadRowStyle } from '../workspaceUi'
import {
  mapRequirementsForWorkspace,
  patchRequirementRowStatus,
  patchRequirementRowReceiptDate,
  WORKSPACE_REQUIREMENT_ALLOWED_STATUSES,
  WORKSPACE_REQUIREMENT_PENDING_MSG,
  getPendingWorkspaceRequirements,
} from '../../../../util/workspaceDisplay'

export default function RequirementsWorkspaceTab({ requirements, canEdit, onPatch }) {
  const WS = useWorkspaceTokens()
  const toast = useToast()
  const [open, setOpen] = useState('base')
  const toggle = (id) => setOpen((p) => (p === id ? '' : id))
  const reqRows = mapRequirementsForWorkspace(requirements)
  const emails = requirements?.reqEmailDetailsTable || []
  const letters = requirements?.reqLetterDetailsTable || []
  const sms = requirements?.smsScriptTable || []

  const setReqStatus = (idx, status) => {
    if (canEdit && String(status).trim().toLowerCase() === 'pending') {
      toast('warning', 'Invalid status', WORKSPACE_REQUIREMENT_PENDING_MSG)
      return
    }
    const table = requirements?.requirementTable || []
    const next = table.map((row, i) => (i === idx ? patchRequirementRowStatus(row, status) : row))
    onPatch({ requirementTable: next })
  }

  const setReqReceiptDate = (idx, receiptDate) => {
    const table = requirements?.requirementTable || []
    const next = table.map((row, i) => (i === idx ? patchRequirementRowReceiptDate(row, receiptDate) : row))
    onPatch({ requirementTable: next })
  }

  const pendingCount = canEdit ? getPendingWorkspaceRequirements(requirements).length : 0

  return (
    <div>
      {canEdit && pendingCount > 0 && (
        <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', background: WS.pending.bg, border: `1px solid ${WS.pending.border}`, fontSize: '12px', fontWeight: 600, color: WS.pending.text }}>
          {pendingCount} requirement(s) still Pending — change each to Received or Waived before submit.
        </div>
      )}
      <Accordion title="Requirements" subtitle="Same 10-document checklist from registration" open={open === 'base'} onToggle={() => toggle('base')}>
        {reqRows.length === 0 ? (
          <div style={{ color: WS.textMuted, fontSize: '13px' }}>No requirement rows loaded.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={workspaceTheadRowStyle(WS)}>
                  {['Requirement Name', 'Doc Type', 'Source', 'Status', 'Triggered By', 'Trigger Date', 'Receipt Date'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: WS.textMuted, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reqRows.map((row, i) => (
                  <tr key={row.id || i} style={{ borderBottom: `1px solid ${WS.borderSubtle}` }}>
                    <td style={{ padding: '10px 12px', fontSize: '12px', maxWidth: '280px', color: WS.textPrimary }}>{row.name}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: WS.textSecondary }}>{row.docType}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: WS.textSecondary }}>{row.source}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {canEdit ? (
                        <select
                          value={row.status === 'Pending' ? '' : row.status}
                          onChange={(e) => setReqStatus(i, e.target.value)}
                          style={workspaceFieldStyle(WS, { height: '32px', borderRadius: '6px', fontSize: '12px' })}
                        >
                          {row.status === 'Pending' && (
                            <option value="" disabled>
                              Pending — select Received or Waived
                            </option>
                          )}
                          {WORKSPACE_REQUIREMENT_ALLOWED_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontWeight: 600, fontSize: '12px' }}>{row.status}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: WS.textMuted }}>{row.triggeredBy}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: WS.textMuted }}>{row.triggerDate}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {canEdit ? (
                        <input
                          type="date"
                          value={row.receiptDate || ''}
                          onChange={(e) => setReqReceiptDate(i, e.target.value)}
                          disabled={row.status !== 'Received'}
                          style={workspaceFieldStyle(WS, {
                            height: '32px',
                            padding: '0 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            background: row.status === 'Received' ? WS.inputBg : WS.inputBgReadonly,
                            cursor: row.status === 'Received' ? 'pointer' : 'not-allowed',
                            minWidth: '130px',
                          })}
                        />
                      ) : (
                        <span style={{ fontSize: '12px', color: WS.textMuted }}>{row.receiptDate || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Accordion>

      <Accordion title="Communication" subtitle="Email, letter, SMS" open={open === 'comm'} onToggle={() => toggle('comm')}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: WS.primary, marginBottom: '8px' }}>Email</div>
          <SimpleTable columns={[{ key: 'emailType', label: 'Type' }, { key: 'sentDate', label: 'Sent' }]} rows={emails} empty="No email rows." />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: WS.primary, marginBottom: '8px' }}>Letters</div>
          <SimpleTable columns={[{ key: 'letterType', label: 'Type' }, { key: 'sentDate', label: 'Sent' }]} rows={letters} empty="No letter rows." />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: WS.primary, marginBottom: '8px' }}>SMS script</div>
          <SimpleTable columns={[{ key: 'script', label: 'Script' }, { key: 'status', label: 'Status' }]} rows={sms} empty="No SMS rows." />
        </div>
      </Accordion>
    </div>
  )
}
