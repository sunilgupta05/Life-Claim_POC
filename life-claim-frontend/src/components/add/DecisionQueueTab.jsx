import { useState } from 'react'
import { useAddUiTokens } from '../../components/add/AddUi'
import { Search, CheckSquare, XCircle } from 'lucide-react'
import { searchWithUserInput, approveData, rejectData } from '../../services/add/DataEntryUploadService'
import { PrimaryBtn } from './AddUi'
import { fieldInputStyle } from '../../ui/pageTokens'

function mapRow(row) {
  const caseId = row.CASE_ID ?? row.case_id ?? row.caseId
  return {
    caseId: caseId != null ? String(caseId) : undefined,
    policyId: row.POLICY_ID || row.policy_number || row.policy_id,
    status: row.CASE_STATUS || row.case_status,
    assignedTo: row.ASSIGNED_TO || row.assigned_to,
    raw: row }
}

export default function DecisionQueueTab({ toast, mode = 'assessor' }) {
  const T = useAddUiTokens()
  const [caseType, setCaseType] = useState(mode === 'approver' ? 'Approver' : 'Assessor')
  const [attribute, setAttribute] = useState('case_status')
  const [value, setValue] = useState('Open')
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await searchWithUserInput(attribute, value, caseType, 0, 50)
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      setRows(list.map(mapRow))
      setSelected([])
    } catch (e) {
      toast('error', 'Load failed', e?.message || 'Could not load decision queue.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const selectedRows = rows.filter((r) => selected.includes(r.caseId))

  const handleApprove = async () => {
    if (!selectedRows.length) return toast('warning', 'Select cases', 'Select at least one row.')
    try {
      await approveData(selectedRows.map((r) => r.raw), 'Approved')
      toast('success', 'Approved', `${selectedRows.length} case(s) updated.`)
      load()
    } catch (e) {
      toast('error', 'Approve failed', e?.message || 'Could not approve.')
    }
  }

  const handleReject = async () => {
    if (!selectedRows.length) return toast('warning', 'Select cases', 'Select at least one row.')
    try {
      await rejectData(selectedRows.map((r) => r.raw), 'Rejected')
      toast('success', 'Rejected', `${selectedRows.length} case(s) updated.`)
      load()
    } catch (e) {
      toast('error', 'Reject failed', e?.message || 'Could not reject.')
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: T.textPrimary, marginBottom: '4px' }}>{mode === 'approver' ? 'Approver pool' : 'Decision queue'}</div>
      <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px' }}>Search cases pending approval and approve or reject in bulk.</div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <select value={caseType} onChange={(e) => setCaseType(e.target.value)} style={fieldInputStyle(T, { height: '40px', padding: '0 12px', borderRadius: '8px', fontSize: '13px' })}>
          <option value="Approver">Approver</option>
          <option value="Assessor">Assessor</option>
        </select>
        <select value={attribute} onChange={(e) => setAttribute(e.target.value)} style={fieldInputStyle(T, { height: '40px', padding: '0 12px', borderRadius: '8px', fontSize: '13px' })}>
          <option value="case_status">Case status</option>
          <option value="policy_id">Policy ID</option>
          <option value="assigned_to">Assigned to</option>
        </select>
        <div style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '40px', borderRadius: '8px', background: T.inputBg, border: `1.5px solid ${T.border}` }}>
          <Search size={14} style={{ color: T.textSubtle }} />
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Filter value…" style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: '13px', fontFamily: 'Inter,sans-serif', color: T.textPrimary }} />
        </div>
        <PrimaryBtn onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Search'}</PrimaryBtn>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <PrimaryBtn onClick={handleApprove} disabled={!selected.length}>
          <CheckSquare size={14} /> Approve ({selected.length})
        </PrimaryBtn>
        <PrimaryBtn onClick={handleReject} variant="danger" disabled={!selected.length}>
          <XCircle size={14} /> Reject ({selected.length})
        </PrimaryBtn>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted, fontSize: '13px' }}>{loading ? 'Loading…' : 'No rows — run search.'}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: T.card, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${T.border}` }}>
          <thead>
            <tr style={{ background: T.surfaceMuted, borderBottom: `2px solid ${T.border}` }}>
              <th style={{ padding: '10px 14px', width: '40px' }} />
              {['Case ID', 'Policy', 'Status', 'Assigned'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.caseId} style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                <td style={{ padding: '10px 14px' }}>
                  <input type="checkbox" checked={selected.includes(r.caseId)} onChange={() => toggle(r.caseId)} />
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: T.primary, fontSize: '12px' }}>{r.caseId}</td>
                <td style={{ padding: '10px 14px', fontSize: '12px', color: T.textMuted }}>{r.policyId}</td>
                <td style={{ padding: '10px 14px', fontSize: '12px' }}>{r.status}</td>
                <td style={{ padding: '10px 14px', fontSize: '12px' }}>{r.assignedTo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
