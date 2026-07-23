import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, X } from 'lucide-react'
import { searchCaseTableData } from '../../../services/add/searchCaseData'
import { useAddUiTokens } from '../AddUi'
import { CASE_SEARCH_ATTRIBUTES, extractCaseRows, mapCaseRow } from '../addCaseMappers'
import { openAddCaseWorkspace } from '../../../util/navigation'
import { fieldInputStyle } from '../../../ui/pageTokens'

const TABLE_HEADERS = ['Case ID', 'Policy', 'KRN', 'Source', 'Referral', 'Status', 'IRIS', 'Exclusion', 'Assigned', '']

export default function CaseSearchTab({ toast }) {
  const T = useAddUiTokens()
  const navigate = useNavigate()
  const [attribute, setAttribute] = useState('policy_number')
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [searched, setSearched] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const runSearch = async (e) => {
    e?.preventDefault?.()
    if (!attribute || !value.trim()) {
      setErrorMessage('Please select an attribute and enter a value to search.')
      setResults([])
      setTotal(0)
      setSearched(false)
      toast('warning', 'Search', 'Select an attribute and enter a value.')
      return
    }
    setLoading(true)
    setErrorMessage('')
    try {
      const result = await searchCaseTableData(attribute, value.trim())
      const rows = extractCaseRows(result)
      const mapped = rows.map(mapCaseRow)
      setResults(mapped)
      setTotal(result?.totalCount ?? mapped.length)
      setSearched(true)
      if (!mapped.length) {
        setErrorMessage('No cases found for the selected filters.')
      }
    } catch (err) {
      setResults([])
      setTotal(0)
      setSearched(true)
      setErrorMessage('Unable to fetch cases right now. Please try again.')
      toast('error', 'Search failed', err?.message || 'Could not search cases.')
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setAttribute('policy_number')
    setValue('')
    setResults([])
    setTotal(0)
    setSearched(false)
    setErrorMessage('')
  }

  const goCase = (c) => {
    openAddCaseWorkspace(navigate, c.caseId, { case: c, fromTab: 'case-search' })
  }

  return (
    <div style={{ padding: '24px' }}>
      <p style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>
        Search CAPS cases by policy number, case ID, or other attributes. Select View to open a case.
      </p>

      <form onSubmit={runSearch}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <select
            value={attribute}
            onChange={(e) => setAttribute(e.target.value)}
            style={fieldInputStyle(T, { height: '42px', padding: '0 12px', borderRadius: '8px', fontSize: '13px' })}
          >
            {CASE_SEARCH_ATTRIBUTES.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', height: '42px', borderRadius: '8px', background: T.inputBg, border: `1.5px solid ${T.border}` }}>
            <Search size={15} style={{ color: T.textSubtle }} />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search value…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'Inter,sans-serif', color: T.textPrimary }}
            />
            {value && (
              <button type="button" onClick={() => setValue('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={13} />
              </button>
            )}
          </div>
          <button type="submit" disabled={loading} style={{ padding: '0 20px', height: '42px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button type="button" onClick={clearSearch} style={{ padding: '0 16px', height: '42px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.card, fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: T.textMuted }}>
            Clear
          </button>
        </div>
      </form>

      {errorMessage && (
        <div style={{ fontSize: '13px', color: '#B45309', marginBottom: '12px', fontWeight: 600 }}>{errorMessage}</div>
      )}

      {searched && total > 0 && (
        <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '10px' }}>Search results ({total})</div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>Searching…</div>
      ) : !searched ? (
        <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>Select an attribute and value, then search.</div>
      ) : results.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>No data found</div>
      ) : (
        <div className="premium-grid">
          <div className="premium-grid__scroll">
          <table>
            <thead>
              <tr>
                {TABLE_HEADERS.map((h) => (
                  <th key={h || 'action'} style={{ whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((c) => (
                <tr
                  key={c.caseId}
                  onDoubleClick={() => goCase(c)}
                  style={{ borderBottom: `1px solid ${T.borderSubtle}`, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverBg }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                >
                  <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontWeight: 700, color: T.primary, fontSize: '12px' }}>{c.caseId}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px' }}>{c.policyNumber}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: T.textMuted }}>{c.krn}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px' }}>{c.source}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>{c.referralDate}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px' }}>{c.status}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: T.textMuted }}>{c.irisStatus}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: T.textMuted }}>{c.exclusionType}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px' }}>{c.assignedTo}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button type="button" onClick={() => goCase(c)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: `1px solid ${T.border}`, background: T.inputBg, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                      <Eye size={11} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
