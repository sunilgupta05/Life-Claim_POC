import { useState, useEffect, useMemo, useRef } from 'react'
import { Download } from 'lucide-react'
import { saveDecision, saveFindings } from '../../services/add/decisionService'
import { SectionTitle, PrimaryBtn, useAddUiTokens } from './AddUi'
import { actionButtonStyle } from '../../ui/pageTokens'
import { isAssessorReadOnly, addCaseStatusLabel } from '../../util/addCaseStatus'
import { downloadScnNoticePdf, SCN_REPLY_MAX_DAYS } from '../../util/downloadScnNoticePdf'

const emptyRow = () => ({
  findings: '',
  remarks: '',
  rule: '',
  decision: '',
  severity: '',
  ailmentName: '',
  ailmentType: '',
  evidenceType: '' })

function pickMaster(row) {
  const r = row?.dataValues || row
  return {
    findings: r.findings || r.FINDINGS || '',
    remarks: r.remarks || r.REMARKS || '',
    rule: r.rule || r.RULE || '',
    decision: r.decision || r.DECISION || '',
    severity: r.severity || r.SEVERITY || '' }
}

function computeSummary(rows) {
  const filled = rows.filter((r) => r.findings && r.remarks)
  if (!filled.length) return { rule: '', finalDecision: '' }

  const hasNegative = filled.some((r) => r.decision === 'Negative')
  const hasSuspicious = filled.some((r) => r.decision === 'Suspicious')
  if (hasNegative) {
    const row = filled.find((r) => r.decision === 'Negative')
    return { rule: row?.rule || '', finalDecision: 'Negative' }
  }
  if (hasSuspicious) {
    const row = filled.find((r) => r.decision === 'Suspicious')
    return { rule: row?.rule || '', finalDecision: 'Suspicious' }
  }

  const numericRules = filled
    .map((r) => ({ ...r, ruleNum: parseInt(r.rule, 10) }))
    .filter((r) => Number.isFinite(r.ruleNum))
    .sort((a, b) => a.ruleNum - b.ruleNum)
  const best = numericRules[0] || filled[0]
  return { rule: best?.rule || '', finalDecision: best?.decision || '' }
}

// assessor lock uses shared helper from addCaseStatus

function hasScnIssued(decision) {
  if (!decision) return false
  const sent = String(decision.scn_sent || '').trim().toLowerCase()
  if (sent === 'yes' || sent === 'y') return true
  return Boolean(decision.scn_date)
}

export default function CapsDecisionPanel({
  caseId,
  caseStatus,
  policyNo,
  krn,
  master,
  savedFindings,
  savedDecision,
  onSaved,
  toast,
}) {
  const T = useAddUiTokens()
  const inputStyle = {
    width: '100%',
    minWidth: '72px',
    padding: '6px 8px',
    border: `1px solid ${T.border}`,
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'Inter,sans-serif',
    boxSizing: 'border-box',
    background: T.inputBg,
    color: T.textPrimary,
  }
  const masterList = useMemo(() => (Array.isArray(master) ? master.map(pickMaster) : []), [master])
  const findingsOptions = useMemo(() => [...new Set(masterList.map((m) => m.findings).filter(Boolean))], [masterList])

  const [rows, setRows] = useState([emptyRow()])
  const [decisionForm, setDecisionForm] = useState({
    rule: '',
    final_decision: '',
    scn_sent: '',
    add_case_remarks: '',
    scn_date: '',
    scn_aging: '',
    scn_received: '',
    scn_decision: '',
    sddr_date: '',
    sddr_received: '',
    sddr_decision: '' })
  const [saving, setSaving] = useState(false)
  const [scnPdfReady, setScnPdfReady] = useState(false)
  const scnIssuedRef = useRef(false)
  const readOnly = isAssessorReadOnly(caseStatus)
  const statusBanner = addCaseStatusLabel(caseStatus)
  const showScnPdf =
    scnIssuedRef.current ||
    scnPdfReady ||
    hasScnIssued(decisionForm) ||
    hasScnIssued(savedDecision)

  useEffect(() => {
    scnIssuedRef.current = false
    setScnPdfReady(false)
  }, [caseId])

  useEffect(() => {
    if (savedFindings?.length) {
      setRows(savedFindings.map((f) => ({
        findings: f.findings || '',
        remarks: f.remarks || '',
        rule: f.rule || '',
        decision: f.decision || '',
        severity: f.severity != null ? String(f.severity) : '',
        ailmentName: f.ailmentName || f.ailment_name || '',
        ailmentType: f.ailmentType || f.ailment_type || '',
        evidenceType: f.evidenceType || f.type_of_evidence || '' })))
    } else {
      setRows([emptyRow()])
    }
  }, [savedFindings, caseId])

  useEffect(() => {
    if (savedDecision) {
      setDecisionForm({
        rule: savedDecision.rule || '',
        final_decision: savedDecision.final_decision || '',
        scn_sent: savedDecision.scn_sent || '',
        add_case_remarks: savedDecision.add_case_remarks || '',
        scn_date: savedDecision.scn_date ? String(savedDecision.scn_date).split('T')[0] : '',
        scn_aging: savedDecision.scn_aging != null ? String(savedDecision.scn_aging) : '',
        scn_received: savedDecision.scn_received || '',
        scn_decision: savedDecision.scn_decision || '',
        sddr_date: savedDecision.sddr_date ? String(savedDecision.sddr_date).split('T')[0] : '',
        sddr_received: savedDecision.sddr_received || '',
        sddr_decision: savedDecision.sddr_decision || '' })
      const issued = hasScnIssued(savedDecision)
      if (issued) scnIssuedRef.current = true
      setScnPdfReady((prev) => issued || prev)
    }
  }, [savedDecision, caseId])

  useEffect(() => {
    const summary = computeSummary(rows)
    setDecisionForm((prev) => ({
      ...prev,
      rule: summary.rule || prev.rule,
      final_decision: summary.finalDecision || prev.final_decision }))
  }, [rows])

  const updateRow = (index, field, value) => {
    setRows((prev) => {
      const next = [...prev]
      const row = { ...next[index], [field]: value }
      if (field === 'findings') {
        row.remarks = ''
        row.rule = ''
        row.decision = ''
        row.severity = ''
      }
      if (field === 'remarks') {
        const match = masterList.find((m) => m.findings === row.findings && m.remarks === value)
        if (match) {
          row.rule = match.rule
          row.decision = match.decision
          row.severity = match.severity != null ? String(match.severity) : ''
        }
      }
      next[index] = row
      return next
    })
  }

  const remarksForFinding = (finding) =>
    masterList.filter((m) => m.findings === finding).map((m) => m.remarks)

  const handleSaveFindings = async () => {
    if (readOnly) {
      toast('warning', 'Locked', statusBanner || 'This case cannot be edited.')
      return
    }
    const payload = rows
      .filter((r) => r.findings && r.remarks)
      .map((r) => ({
        case_id: caseId,
        findings: r.findings,
        remarks: r.remarks,
        rule: r.rule,
        decision: r.decision,
        severity: r.severity,
        ailment_name: r.ailmentName,
        ailment_type: r.ailmentType,
        type_of_evidence: r.evidenceType }))
    if (!payload.length) {
      toast('warning', 'Findings', 'Add at least one row with findings and remarks.')
      return
    }
    const username = sessionStorage.getItem('loggedUser') || 'system'
    setSaving(true)
    try {
      await saveFindings(payload, username)
      toast('success', 'Saved', `Saved ${payload.length} finding row(s).`)
      onSaved?.()
    } catch (e) {
      toast('error', 'Save failed', e?.message || 'Could not save findings.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDecision = async () => {
    if (readOnly) {
      toast('warning', 'Locked', statusBanner || 'This case cannot be edited.')
      return
    }
    if (!decisionForm.final_decision?.trim()) {
      toast('warning', 'Decision', 'Select or enter a final decision before saving.')
      return
    }
    const todayStr = new Date().toISOString().split('T')[0]
    const scnPayload = {
      scn_sent: 'Yes',
      scn_date: todayStr,
      scn_aging: 0,
    }
    const merged = { ...decisionForm, ...scnPayload }
    setDecisionForm(merged)

    const username = sessionStorage.getItem('loggedUser') || 'system'
    setSaving(true)
    try {
      await saveDecision(
        {
          case_id: parseInt(caseId, 10),
          policy_number: policyNo,
          rule: merged.rule,
          final_decision: merged.final_decision,
          scn_sent: merged.scn_sent,
          add_case_remarks: merged.add_case_remarks,
          scn_date: merged.scn_date || null,
          scn_aging: merged.scn_aging != null && merged.scn_aging !== '' ? parseInt(merged.scn_aging, 10) : 0,
          scn_received: merged.scn_received,
          scn_decision: merged.scn_decision,
          sddr_date: merged.sddr_date || null,
          sddr_received: merged.sddr_received,
          sddr_decision: merged.sddr_decision },
        username,
      )
      scnIssuedRef.current = true
      setScnPdfReady(true)
      toast('success', 'Saved', `Final decision saved. SCN issued — reply within ${SCN_REPLY_MAX_DAYS} days.`)
      await onSaved?.()
    } catch (e) {
      toast('error', 'Save failed', e?.message || 'Could not save decision.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadScnPdf = async () => {
    try {
      await downloadScnNoticePdf({
        caseId,
        policyNo,
        krn,
        scnDate: decisionForm.scn_date,
        scnAging: decisionForm.scn_aging,
        finalDecision: decisionForm.final_decision,
        remarks: decisionForm.add_case_remarks,
        findings: rows,
      })
      toast('success', 'PDF downloaded', `SCN notice for case ${caseId} saved.`)
    } catch (e) {
      toast('error', 'Download failed', e?.message || 'Could not generate SCN PDF.')
    }
  }

  const cols = [
    { key: 'findings', label: 'Findings', type: 'findingSelect' },
    { key: 'remarks', label: 'Remarks', type: 'remarkSelect' },
    { key: 'rule', label: 'Rule', readOnly: true },
    { key: 'decision', label: 'Decision', readOnly: true },
    { key: 'severity', label: 'Severity', readOnly: true },
    { key: 'ailmentName', label: 'Ailment' },
    { key: 'ailmentType', label: 'Type' },
    { key: 'evidenceType', label: 'Evidence' },
  ]

  const scnDownloadBtn = (
    <button
      type="button"
      onClick={handleDownloadScnPdf}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...actionButtonStyle(T, 'success', { size: 'lg' }),
      }}
    >
      <Download size={18} strokeWidth={2.5} />
      Download SCN notice (PDF)
    </button>
  )

  return (
    <div>
      {showScnPdf && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px 18px',
            borderRadius: '12px',
            border: `2px solid ${T.success?.border || '#059669'}`,
            background: T.success?.bg || 'rgba(5,150,105,0.12)',
            boxShadow: '0 4px 14px rgba(5,150,105,0.15)',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 700, color: T.textPrimary, marginBottom: '6px' }}>
            SCN issued — documents required within {SCN_REPLY_MAX_DAYS} days
          </div>
          <div style={{ fontSize: '12px', color: T.textSecondary, marginBottom: '14px', lineHeight: 1.5 }}>
            Sent: <strong>{decisionForm.scn_sent || 'Yes'}</strong>
            {' · '}Date: <strong>{decisionForm.scn_date || '—'}</strong>
            {' · '}Aging: <strong>{decisionForm.scn_aging ?? 0} day(s)</strong>
          </div>
          {scnDownloadBtn}
        </div>
      )}
      <SectionTitle>Findings (from decision master)</SectionTitle>
      <p style={{ fontSize: '11px', color: T.textMuted, marginBottom: '10px' }}>
        Select finding → remark to auto-fill rule, decision, and severity. Save findings before or with the main decision.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', border: `1px solid ${T.border}` }}>
          <thead>
            <tr style={{ background: T.surfaceMuted }}>
              {cols.map((c) => (
                <th key={c.key} style={{ padding: '8px', fontSize: '10px', fontWeight: 700, color: T.textSubtle, textAlign: 'left' }}>{c.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${T.borderSubtle}` }}>
                {cols.map((c) => (
                  <td key={c.key} style={{ padding: '6px' }}>
                    {c.type === 'findingSelect' ? (
                      <select value={row.findings} onChange={(e) => updateRow(i, 'findings', e.target.value)} style={inputStyle} disabled={readOnly}>
                        <option value="">—</option>
                        {findingsOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    ) : c.type === 'remarkSelect' ? (
                      <select value={row.remarks} onChange={(e) => updateRow(i, 'remarks', e.target.value)} style={inputStyle} disabled={readOnly || !row.findings}>
                        <option value="">—</option>
                        {remarksForFinding(row.findings).map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <input
                        value={row[c.key] ?? ''}
                        onChange={(e) => !c.readOnly && updateRow(i, c.key, e.target.value)}
                        readOnly={c.readOnly || readOnly}
                        style={{ ...inputStyle, background: c.readOnly ? T.inputBgReadonly : T.inputBg }}
                      />
                    )}
                  </td>
                ))}
                <td style={{ padding: '6px' }}>
                  <button type="button" onClick={() => setRows((p) => p.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 700 }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <PrimaryBtn variant="secondary" onClick={() => setRows((p) => [...p, emptyRow()])} disabled={readOnly}>+ Add row</PrimaryBtn>
        <PrimaryBtn onClick={handleSaveFindings} disabled={saving || readOnly}>Save findings</PrimaryBtn>
      </div>

      <SectionTitle>Main decision</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', maxWidth: '900px' }}>
        {[
          ['rule', 'Rule No'],
          ['final_decision', 'Final decision'],
          ['scn_sent', 'SCN sent'],
          ['scn_aging', 'SCN aging'],
          ['scn_date', 'SCN date', 'date'],
          ['scn_received', 'SCN reply received'],
          ['scn_decision', 'SCN decision'],
          ['sddr_date', 'SDDR date', 'date'],
          ['sddr_received', 'SDDR reply received'],
          ['sddr_decision', 'SDDR decision'],
        ].map(([key, label, type]) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>{label}</label>
            <input
              type={type === 'date' ? 'date' : 'text'}
              value={decisionForm[key] || ''}
              onChange={(e) => setDecisionForm((p) => ({ ...p, [key]: e.target.value }))}
              style={inputStyle}
              readOnly={readOnly || ['scn_sent', 'scn_aging', 'scn_date'].includes(key)}
              disabled={readOnly || ['scn_sent', 'scn_aging', 'scn_date'].includes(key)}
            />
          </div>
        ))}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>Add case remarks</label>
          <textarea
            value={decisionForm.add_case_remarks || ''}
            onChange={(e) => setDecisionForm((p) => ({ ...p, add_case_remarks: e.target.value }))}
            rows={3}
            readOnly={readOnly}
            style={{ ...inputStyle, height: 'auto' }}
          />
        </div>
      </div>
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <PrimaryBtn onClick={handleSaveDecision} disabled={saving || readOnly}>
          {saving ? 'Saving…' : 'Save final decision'}
        </PrimaryBtn>
        {showScnPdf && scnDownloadBtn}
      </div>
    </div>
  )
}
