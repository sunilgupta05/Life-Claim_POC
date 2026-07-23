import { useState, useEffect } from 'react'
import { useAddUiTokens } from '../../../components/add/AddUi'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, X } from 'lucide-react'
import { searchCaseTableData } from '../../../services/add/searchCaseData'
import { assignCasesToUser, getAssignmentReferenceData } from '../../../services/add/caseAssignmentService'
import ExcelAssignmentTab from '../ExcelAssignmentTab'
import { PrimaryBtn } from '../AddUi'
import {
  CASE_SEARCH_ATTRIBUTES,
  CASE_ASSIGNMENT_EXTRA_ATTRIBUTES,
  extractCaseRows,
  mapCaseRow,
} from '../addCaseMappers'
import { openAddCaseWorkspace } from '../../../util/navigation'
import { fieldInputStyle } from '../../../ui/pageTokens'

const TABLE_HEADERS = ['', 'Case ID', 'Policy', 'KRN', 'Source', 'Referral', 'Status', 'IRIS', 'Assigned', '']

export default function CaseAssignmentTab({ toast }) {
  const T = useAddUiTokens()
  const navigate = useNavigate()
  const [attribute, setAttribute] = useState('case_status')
  const [value, setValue] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [assignTo, setAssignTo] = useState('')
  const [users, setUsers] = useState([])
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    getAssignmentReferenceData()
      .then(({ usernames }) => setUsers(usernames))
      .catch(() => setUsers([]))
  }, [])

  const runSearch = async (e) => {
    e?.preventDefault?.()
    if (!attribute || !value.trim()) {
      setErrorMessage('Please select a filter and enter a value to search.')
      setRows([])
      setSelected(new Set())
      setSearched(false)
      toast('warning', 'Search', 'Select a filter and enter a value.')
      return
    }
    setLoading(true)
    setErrorMessage('')
    setSelected(new Set())
    try {
      const result = await searchCaseTableData(attribute, value.trim())
      const mapped = extractCaseRows(result).map(mapCaseRow)
      setRows(mapped)
      setSearched(true)
      if (!mapped.length) {
        setErrorMessage('No cases available for assignment with these filters.')
      }
    } catch {
      setRows([])
      setSearched(true)
      setErrorMessage('Unable to fetch cases right now. Please try again.')
      toast('error', 'Search failed', 'Could not load cases.')
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setAttribute('case_status')
    setValue('')
    setRows([])
    setSelected(new Set())
    setSearched(false)
    setErrorMessage('')
  }

  const toggleRow = (caseId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(caseId)) next.delete(caseId)
      else next.add(caseId)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rows.map((r) => r.caseId)))
    }
  }

  const goCase = (c) => {
    openAddCaseWorkspace(navigate, c.caseId, { case: c, fromTab: 'case-assignment' })
  }

  const handleAssign = async () => {
    const ids = [...selected].filter((id) => id && id !== '—')
    if (!ids.length) {
      toast('warning', 'Assign', 'Select at least one case.')
      return
    }
    if (!assignTo) {
      toast('warning', 'Assign', 'Choose a user in Assign To.')
      return
    }
    setAssigning(true)
    try {
      const result = await assignCasesToUser(ids, assignTo)
      toast('success', 'Assigned', result.message || `Assigned ${ids.length} case(s) to ${assignTo}.`)
      setRows((prev) => prev.map((r) => (selected.has(r.caseId) ? { ...r, assignedTo: assignTo } : r)))
      setSelected(new Set())
    } catch (e) {
      toast('error', 'Assign failed', e?.message || 'Could not assign cases.')
    } finally {
      setAssigning(false)
    }
  }

  const onBulkComplete = () => {
    if (searched && value.trim()) runSearch()
  }

  return (
    <div style={{ padding: '24px' }}>
      <p style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>
        Search cases, assign selected rows to a user, or bulk-assign using an Excel file.
      </p>

      <form onSubmit={runSearch}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <select
            value={attribute}
            onChange={(e) => setAttribute(e.target.value)}
            style={fieldInputStyle(T, { height: '40px', padding: '0 12px', borderRadius: '8px', fontSize: '13px' })}
          >
            {CASE_SEARCH_ATTRIBUTES.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
            {CASE_ASSIGNMENT_EXTRA_ATTRIBUTES.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Filter value"
            style={fieldInputStyle(T, { flex: 1, minWidth: '160px', height: '40px', padding: '0 12px', borderRadius: '8px', fontSize: '13px' })}
          />
          <button type="submit" disabled={loading} style={{ height: '40px', padding: '0 18px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            <Search size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button type="button" onClick={clearSearch} style={{ height: '40px', padding: '0 14px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.card, fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: T.textMuted }}>
            Clear
          </button>
        </div>
      </form>

      {errorMessage && (
        <div style={{ fontSize: '13px', color: '#B45309', marginBottom: '12px', fontWeight: 600 }}>{errorMessage}</div>
      )}

      {searched && rows.length > 0 && (
        <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '10px', fontWeight: 700 }}>
          Assignable cases ({rows.length})
        </div>
      )}

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted }}>Searching…</div>
      ) : !searched ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted }}>Search for cases to assign.</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted }}>No data found</div>
      ) : (
        <div className="premium-grid" style={{ marginBottom: '16px' }}>
          <div className="premium-grid__scroll">
          <table>
            <thead>
              <tr>
                {TABLE_HEADERS.map((h, i) => (
                  <th key={h || `col-${i}`} style={{ whiteSpace: 'nowrap' }}>
                    {i === 0 ? (
                      <input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} aria-label="Select all" />
                    ) : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.caseId}
                  onDoubleClick={() => goCase(c)}
                  style={{ borderTop: `1px solid ${T.borderSubtle}`, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverBg }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                >
                  <td style={{ padding: '10px 12px' }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(c.caseId)} onChange={() => toggleRow(c.caseId)} aria-label={`Select case ${c.caseId}`} />
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: T.primary, fontSize: '12px' }}>{c.caseId}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{c.policyNumber}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: T.textMuted }}>{c.krn}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{c.source}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}>{c.referralDate}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{c.status}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: T.textMuted }}>{c.irisStatus}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{c.assignedTo}</td>
                  <td style={{ padding: '10px 12px' }} onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => goCase(c)} style={{ border: 'none', background: 'none', color: T.primary, fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px', padding: '14px', background: T.surfaceMuted, borderRadius: '10px', border: `1px solid ${T.border}` }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: T.textSecondary }} htmlFor="assign-to-select">Assign To</label>
          <select
            id="assign-to-select"
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            style={fieldInputStyle(T, { height: '38px', minWidth: '180px', padding: '0 12px', borderRadius: '8px', fontSize: '13px' })}
          >
            <option value="">— Select user —</option>
            {users.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <PrimaryBtn onClick={handleAssign} disabled={assigning || !selected.size}>
            {assigning ? 'Assigning…' : `Assign (${selected.size} selected)`}
          </PrimaryBtn>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '24px' }}>
        <ExcelAssignmentTab toast={toast} embedded onComplete={onBulkComplete} />
      </div>
    </div>
  )
}
