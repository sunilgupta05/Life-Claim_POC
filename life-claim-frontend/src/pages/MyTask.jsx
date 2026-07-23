import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/AuthContext'
import { CheckSquare, Eye, Search, ChevronLeft, ChevronRight, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { getClaimsByUser } from '../services/claimsService'
import { getWorkflowPoolRoles } from '../util/workflowRoles'
import { workflowStatusFromRow, workflowRoleFromRow } from '../util/claimSearchMap'
import { filterClaimRows, sortClaimRows, uniqueFieldValues, CLAIM_TABLE_COLUMNS } from '../util/claimTableFilters'
import ClaimHoverPreview from '../components/claim/ClaimHoverPreview'
import HelpLink from '../components/HelpLink'
import { openClaimWorkspace } from '../util/navigation'
import { useTheme } from '../context/ThemeContext'
import {
  PremiumGrid, PremiumGridToolbar, PremiumGridScroll, PremiumGridFooter,
  SortableTh, GridStatusBadge, GridIconBtn,
} from '../ui/PremiumDataGrid'
import { statusToGridTone } from '../util/statusBadgeTone'
import { selectFieldStyle } from '../ui/pageTokens'


const PAGE_SIZE = 10

function mapTaskRow(c) {
  const status = workflowStatusFromRow(c)
  const role = workflowRoleFromRow(c)
  return {
    claimId: c.CLAIM_NUMBER || c.id || c.claimNumber,
    policyId: c.POLICY_ID || c.policy || '',
    createdOn: (c.CREATED_AT || c.CREATED_ON || '').toString().split('T')[0] || '—',
    createdBy: c.CREATED_BY || c.createdBy || '—',
    status,
    role,
    claimType: c.CLAIM_TYPE || c.type || '',
    assignedTo: c.ASSIGNED_TO || c.assignedTo || '',
  }
}

export default function MyTask() {
  const { tokens: T } = useTheme()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const workflowRoles = getWorkflowPoolRoles(user)

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [sortCol, setSortCol] = useState('status')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)
  const [hoverClaim, setHoverClaim] = useState(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const loggedUser = sessionStorage.getItem('loggedUser') || user?.username || ''

  useEffect(() => {
    if (!loggedUser) return
    setLoading(true)
    getClaimsByUser(loggedUser)
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.claims || []
        setTasks(arr.map(mapTaskRow).filter((t) => t.claimId))
      })
      .catch(() => toast('error', 'Load Failed', 'Could not load your tasks.'))
      .finally(() => setLoading(false))
  }, [loggedUser, toast])

  const applySearch = () => {
    const q = searchQ.trim()
    setSearchApplied(q)
    setPage(0)
    if (q && !tasks.some((t) => String(t.claimId).toLowerCase() === q.toLowerCase())) {
      toast('info', 'Not in list', 'That claim number is not in your loaded tasks.')
    }
  }

  const statusOptions = useMemo(() => ['All Statuses', ...uniqueFieldValues(tasks, 'status')], [tasks])

  const filtered = useMemo(() => {
    const list = filterClaimRows(tasks, {
      search: searchApplied,
      statusFilter,
      roleFilter,
    })
    return sortClaimRows(list, sortCol, sortDir)
  }, [tasks, searchApplied, statusFilter, roleFilter, sortCol, sortDir])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
    setPage(0)
  }

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown size={11} style={{ color: T.textSubtle, marginLeft: '4px', opacity: 0.5 }} />
    return sortDir === 'asc'
      ? <ArrowUp size={11} style={{ color: T.primary, marginLeft: '4px' }} />
      : <ArrowDown size={11} style={{ color: T.primary, marginLeft: '4px' }} />
  }

  const singleResultMode = searchApplied && filtered.length <= 1
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = singleResultMode ? filtered : filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages - 1) setPage(0)
  }, [page, totalPages])

  const handleOpen = (task) => {
    openClaimWorkspace(navigate, task.claimId, { from: 'myTask' })
  }

  const roleOptions = ['All Roles', ...workflowRoles]

  return (
    <AppLayout pageTitle="My Tasks">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }} onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, margin: 0 }}>My Task</h1>
          <p style={{ fontSize: '13px', color: T.textMuted, marginTop: '4px' }}>
            Claims linked to you (assigned, modified, or assessor/approver username). Open in work mode — no browse-only flag.
          </p>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '40px', borderRadius: '8px', border: `1.5px solid ${T.border}`, background: T.inputBg }}>
            <Search size={14} style={{ color: T.textSubtle }} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Search claim, policy, or creator"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', fontFamily: 'Inter,sans-serif' }}
            />
            {searchQ && (
              <button type="button" onClick={() => { setSearchQ(''); setSearchApplied(''); setPage(0) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.textSubtle }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button type="button" onClick={applySearch} style={{ padding: '0 18px', height: '40px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            Search
          </button>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
            style={selectFieldStyle(T, { height: '40px', padding: '0 12px', borderRadius: '8px', border: `1.5px solid ${T.border}`, fontSize: '13px', fontWeight: 600, minWidth: '180px' })}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(0) }}
            style={selectFieldStyle(T, { height: '40px', padding: '0 12px', borderRadius: '8px', border: `1.5px solid ${T.border}`, fontSize: '13px', fontWeight: 600 })}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <PremiumGrid>
          <PremiumGridToolbar>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Your claims</div>
                <div style={{ fontSize: '12px', color: T.textMuted }}>{filtered.length} claim{filtered.length === 1 ? '' : 's'} shown</div>
              </div>
              {!singleResultMode && filtered.length > PAGE_SIZE && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" disabled={safePage <= 0} onClick={() => setPage((p) => p - 1)} className="premium-grid__icon-btn" style={{ width: 'auto', padding: '0 8px' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: T.textMuted }}>Page {safePage + 1} / {totalPages}</span>
                  <button type="button" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="premium-grid__icon-btn" style={{ width: 'auto', padding: '0 8px' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </PremiumGridToolbar>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: T.textMuted }}>Loading tasks…</div>
          ) : pageRows.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <CheckSquare size={32} style={{ color: T.success, margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, color: T.textPrimary }}>No tasks match</div>
              <div style={{ fontSize: '13px', color: T.textMuted, marginTop: '6px' }}>Assign claims from Pool Selection to see them here.</div>
              <HelpLink questionId="tp-mytask">How does My Tasks work?</HelpLink>
              <HelpLink questionId="tp-pool" style={{ marginLeft: '8px' }}>About Pool Selection</HelpLink>
            </div>
          ) : (
            <PremiumGridScroll>
              <table>
                <thead>
                  <tr>
                    {CLAIM_TABLE_COLUMNS.map(({ label, key }) => (
                      <SortableTh key={key} active={sortCol === key} onClick={() => handleSort(key)} sortIcon={<SortIcon col={key} />}>
                        {label}
                      </SortableTh>
                    ))}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((task) => (
                    <tr key={task.claimId}>
                      <td
                        onMouseEnter={() => setHoverClaim(task)}
                        onMouseLeave={() => setHoverClaim(null)}
                      >
                        <div className="premium-grid__cell-primary">{task.claimId}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: T.textMuted }}>{task.policyId}</td>
                      <td style={{ fontSize: '12px', color: T.textMuted }}>{task.createdOn}</td>
                      <td style={{ fontSize: '12px', color: T.textMuted }}>{task.createdBy}</td>
                      <td>
                        <GridStatusBadge tone={statusToGridTone(task.status)}>{task.status}</GridStatusBadge>
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 600 }}>{task.role}</td>
                      <td>
                        <GridIconBtn title="Open in work mode" onClick={() => handleOpen(task)}>
                          <Eye size={14} />
                        </GridIconBtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PremiumGridScroll>
          )}
        </PremiumGrid>

        <ClaimHoverPreview claim={hoverClaim} x={mouse.x} y={mouse.y} />
      </div>
    </AppLayout>
  )
}
