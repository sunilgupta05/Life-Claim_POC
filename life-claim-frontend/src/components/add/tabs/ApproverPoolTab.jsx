import { useState } from 'react'
import { useAddUiTokens } from '../../../components/add/AddUi'
import { useNavigate } from 'react-router-dom'
import { Search, CheckSquare, XCircle, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { searchWithUserInput, approveData, rejectData } from '../../../services/add/DataEntryUploadService'
import { normalizePolicyNumber } from '../addCaseMappers'
import { openAddCaseWorkspace } from '../../../util/navigation'
import { PrimaryBtn } from '../AddUi'
import { fieldInputStyle, alertBannerStyle } from '../../../ui/pageTokens'
import { canPerformAddAction } from '../../../util/addCaseStatus'

const PAGE_SIZE = 10

const CASE_TYPES = [
  { id: 'Positive', label: 'Positive Case' },
  { id: 'Negative', label: 'Negative Case' },
  { id: 'Suspicious', label: 'Suspicious Case' },
]

const SEARCH_ATTRIBUTES = [
  { id: 'case_id', label: 'Case Id' },
  { id: 'policy_number', label: 'Policy Number' },
  { id: 'case_status', label: 'Case Status' },
]

const TABLE_COLS = [
  { key: 'caseId', label: 'Case ID' },
  { key: 'appNo', label: 'App No' },
  { key: 'policyNumber', label: 'Policy Number' },
  { key: 'krn', label: 'KRN' },
  { key: 'caseStatus', label: 'Case Status' },
  { key: 'finding', label: 'Findings' },
  { key: 'remarks', label: 'Remarks' },
  { key: 'rule', label: 'Rule' },
  { key: 'decision', label: 'Decision' },
  { key: 'scnAging', label: 'SCN Aging' },
  { key: 'irisStatus', label: 'IRIS Status' },
]

function mapApproverRow(row) {
  const caseId = row.CASE_ID ?? row.case_id ?? row.caseId
  return {
    rowKey: caseId != null ? String(caseId) : `row-${Math.random()}`,
    caseId: caseId != null ? String(caseId) : '—',
    appNo: row.APP_No ?? row.app_no ?? row.application_number ?? '—',
    policyNumber: row.Policy_Number ?? row.policy_number ?? '—',
    krn: row.KRN ?? row.krn ?? '—',
    caseStatus: row.CaseStatus ?? row.case_status ?? '—',
    finding: row.Finding ?? row.findings ?? '—',
    remarks: row.Remarks ?? row.remarks ?? '—',
    rule: row.Rule ?? row.rule ?? '—',
    decision: row.Decision ?? row.decision ?? '—',
    scnAging: row.SCNAging ?? row.scn_aging ?? '—',
    irisStatus: row.IRISStatus ?? row.iris_status ?? '—',
    raw: row }
}

export default function ApproverPoolTab({ toast }) {
  const T = useAddUiTokens()
  const navigate = useNavigate()
  const [caseType, setCaseType] = useState('Negative')
  const [attribute, setAttribute] = useState('policy_number')
  const [value, setValue] = useState('')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(() => new Set())
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [searched, setSearched] = useState(false)
  const [message, setMessage] = useState('')

  const runSearch = async (pageNum = 0) => {
    if (!caseType || !attribute || !value.trim()) {
      toast('warning', 'Search', 'Case type, attribute, and value are required.')
      return
    }
    setLoading(true)
    setMessage('')
    setSelected(new Set())
    try {
      let searchValue = value.trim()
      if (attribute === 'policy_number') searchValue = normalizePolicyNumber(searchValue)
      const res = await searchWithUserInput(attribute, searchValue, caseType, pageNum, PAGE_SIZE)
      const list = Array.isArray(res?.data) ? res.data : []
      const seen = new Set()
      const unique = list.filter((row) => {
        const id = row.CASE_ID ?? row.case_id ?? row.caseId
        if (id == null || seen.has(String(id))) return false
        seen.add(String(id))
        return true
      })
      setRows(unique.map(mapApproverRow))
      setTotal(res?.totalCount ?? res?.totalRecords ?? unique.length)
      setPage(pageNum)
      setSearched(true)
      if (!list.length) {
        setMessage('No cases found for the selected filters. Ensure findings were saved with matching decision type.')
      }
    } catch (e) {
      setRows([])
      setTotal(0)
      setSearched(true)
      toast('error', 'Search failed', e?.message || 'Could not load approver pool.')
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setCaseType('Negative')
    setAttribute('policy_number')
    setValue('')
    setPage(0)
    setRows([])
    setTotal(0)
    setSelected(new Set())
    setSearched(false)
    setMessage('')
  }

  const toggleRow = (rowKey) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(rowKey)) next.delete(rowKey)
      else next.add(rowKey)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === actionableRows.length) setSelected(new Set())
    else setSelected(new Set(actionableRows.map((r) => r.rowKey)))
  }

  const selectedRows = rows.filter((r) => selected.has(r.rowKey))
  const actionableRows = rows.filter((r) => canPerformAddAction(r.caseStatus, 'approve'))
  const actionableSelected = selectedRows.filter((r) => canPerformAddAction(r.caseStatus, 'approve'))
  const canApproveReject = actionableSelected.length > 0 && actionableSelected.length === selectedRows.length

  const runBulk = async (status, label) => {
    if (!selectedRows.length) {
      toast('warning', 'Select cases', 'Select at least one row.')
      return
    }
    if (!canApproveReject) {
      toast('warning', 'Not allowed', 'One or more selected cases are closed or already decided.')
      return
    }
    setBusy(true)
    try {
      await approveData(selectedRows.map((r) => r.raw), status)
      const username = sessionStorage.getItem('loggedUser') || 'user'
      setMessage(`${label} ${selectedRows.length} row(s) by ${username}.`)
      toast('success', label, `${selectedRows.length} case(s) updated.`)
      setSelected(new Set())
      await runSearch(page)
    } catch (e) {
      toast('error', `${label} failed`, e?.message || 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: T.textPrimary, marginBottom: '4px' }}>Approver Pool</div>
      <p style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>
        Search cases with saved findings (Positive, Negative, or Suspicious) and approve or reject in bulk.
      </p>

      {message && (
        <div style={{ ...alertBannerStyle(T, 'success'), marginBottom: '12px', padding: '12px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <select value={caseType} onChange={(e) => setCaseType(e.target.value)} style={fieldInputStyle(T, { height: '40px', padding: '0 12px', borderRadius: '8px', fontSize: '13px' })}>
          {CASE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={attribute} onChange={(e) => setAttribute(e.target.value)} style={fieldInputStyle(T, { height: '40px', padding: '0 12px', borderRadius: '8px', fontSize: '13px' })}>
          {SEARCH_ATTRIBUTES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <div style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '40px', borderRadius: '8px', background: T.inputBg, border: `1.5px solid ${T.border}` }}>
          <Search size={14} style={{ color: T.textSubtle }} />
          <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch(0)} placeholder="Search value…" style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: '13px', fontFamily: 'Inter,sans-serif', color: T.textPrimary }} />
          {value && (
            <button type="button" onClick={() => setValue('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={13} /></button>
          )}
        </div>
        <PrimaryBtn onClick={() => runSearch(0)} disabled={loading}>Search</PrimaryBtn>
        <button type="button" onClick={clearSearch} style={{ height: '40px', padding: '0 14px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.card, fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: T.textMuted }}>
          Clear
        </button>
      </div>

      {searched && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <PrimaryBtn disabled={busy || !selected.size || !canApproveReject} onClick={() => runBulk('Approved by Approver', 'Approved')}>
            <CheckSquare size={14} /> Approve ({selected.size})
          </PrimaryBtn>
          <PrimaryBtn disabled={busy || !selected.size || !canApproveReject} variant="danger" onClick={() => runBulk('Rejected by Approver', 'Rejected')}>
            <XCircle size={14} /> Reject ({selected.size})
          </PrimaryBtn>
          <span style={{ fontSize: '12px', color: T.textMuted }}>{total} matching row(s) · page {page + 1}/{totalPages}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted }}>Searching…</div>
      ) : !searched ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted }}>Search for cases pending approval.</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted }}>No rows to display.</div>
      ) : (
        <div className="premium-grid">
          <div className="premium-grid__scroll">
          <table style={{ minWidth: '1100px' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px', width: 36 }}>
                  <input
                    type="checkbox"
                    checked={actionableRows.length > 0 && selected.size === actionableRows.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                {TABLE_COLS.map((c) => (
                  <th key={c.key} style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textAlign: 'left', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{c.label}</th>
                ))}
                <th style={{ width: 72 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const actionable = canPerformAddAction(r.caseStatus, 'approve')
                return (
                <tr key={r.rowKey} style={{ borderTop: `1px solid ${T.borderSubtle}`, opacity: actionable ? 1 : 0.65 }}>
                  <td style={{ padding: '10px' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(r.rowKey)}
                      disabled={!actionable}
                      onChange={() => toggleRow(r.rowKey)}
                    />
                  </td>
                  {TABLE_COLS.map((c) => (
                    <td key={c.key} style={{ padding: '10px 12px', fontSize: '12px', fontFamily: c.key === 'caseId' ? 'monospace' : 'inherit', fontWeight: c.key === 'caseId' ? 700 : 400, color: c.key === 'caseId' ? T.primary : T.textSecondary, whiteSpace: 'nowrap' }}>
                      {r[c.key]}
                    </td>
                  ))}
                  <td style={{ padding: '10px 12px' }}>
                    <button type="button" onClick={() => openAddCaseWorkspace(navigate, r.caseId, { case: { caseId: r.caseId, policyNumber: r.policyNumber, krn: r.krn, status: r.caseStatus }, fromTab: 'approver-pool' })} style={{ border: 'none', background: 'none', color: T.primary, fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {searched && total > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
          <button type="button" disabled={page === 0 || loading} onClick={() => runSearch(page - 1)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer' }}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => runSearch(page + 1)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
