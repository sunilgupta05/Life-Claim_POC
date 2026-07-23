import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'
import { DataSearch, updateAssignedUser } from '../services/poolSelectionService'
import { getWorkflowPoolRoles, defaultPoolRole } from '../util/workflowRoles'
import { workflowStatusFromRow, workflowRoleFromRow } from '../util/claimSearchMap'
import ClaimHoverPreview from '../components/claim/ClaimHoverPreview'
import { Layers, UserPlus, ChevronDown, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { filterClaimRows, sortClaimRows, uniqueFieldValues } from '../util/claimTableFilters'
import { useTheme } from '../context/ThemeContext'
import { alertBannerStyle, selectFieldStyle } from '../ui/pageTokens'
import { PremiumGrid, PremiumGridScroll, SortableTh, GridStatusBadge } from '../ui/PremiumDataGrid'
import { statusToGridTone } from '../util/statusBadgeTone'


const POOL_TABLE_COLUMNS = [
  { label: 'Claim Number', key: 'claimId' },
  { label: 'Policy Number', key: 'policyId' },
  { label: 'Status', key: 'status' },
  { label: 'Role', key: 'role' },
  { label: 'Created On', key: 'createdOn' },
  { label: 'Created By', key: 'createdBy' },
]

function mapPoolRow(c) {
  return {
    claimId: c.CLAIM_NUMBER || c.claimNumber || c.claimId,
    policyId: c.POLICY_ID || c.POLICY_NUMBER || c.policyId || '',
    status: workflowStatusFromRow(c),
    role: workflowRoleFromRow(c),
    createdOn: (c.CREATED_AT || c.CREATED_ON || '').toString().split('T')[0] || '—',
    createdBy: c.CREATED_BY || c.createdBy || '—',
    claimType: c.CLAIM_TYPE || c.claimType || '',
  }
}

export default function PoolSelection() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const { user } = useAuth()
  const roleKey = Array.isArray(user?.roles) ? user.roles.join('|') : String(user?.role ?? '')
  const poolRoles = useMemo(() => getWorkflowPoolRoles(user), [roleKey])
  const [poolType, setPoolType] = useState(() => defaultPoolRole(user))
  const [pool, setPool] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [poolOpen, setPoolOpen] = useState(false)
  const [hoverClaim, setHoverClaim] = useState(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [searchQ, setSearchQ] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [sortCol, setSortCol] = useState('status')
  const [sortDir, setSortDir] = useState('asc')

  const loggedUser = sessionStorage.getItem('loggedUser') || user?.username || ''

  const loadPool = useCallback(async (role) => {
    if (!role) return
    setLoading(true)
    setSelected(new Set())
    try {
      const data = await DataSearch(role)
      if (data == null) {
        setPool([])
        toast('error', 'Load failed', 'Could not load pool. Wait a moment and refresh the page.')
        return
      }
      setPool((Array.isArray(data) ? data : []).map(mapPoolRow).filter((r) => r.claimId))
    } catch (e) {
      setPool([])
      toast('error', 'Load failed', e?.message || 'Could not load pool.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (poolRoles.length && !poolRoles.includes(poolType)) {
      setPoolType(poolRoles[0])
      return
    }
    loadPool(poolType)
  }, [poolType, poolRoles, loadPool])

  const toggleSelect = (claimId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(claimId)) next.delete(claimId)
      else next.add(claimId)
      return next
    })
  }

  const statusOptions = useMemo(() => ['All Statuses', ...uniqueFieldValues(pool, 'status')], [pool])

  const displayPool = useMemo(() => {
    const list = filterClaimRows(pool, { search: searchApplied, statusFilter })
    return sortClaimRows(list, sortCol, sortDir)
  }, [pool, searchApplied, statusFilter, sortCol, sortDir])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown size={11} style={{ color: T.textSubtle, marginLeft: '4px', opacity: 0.5 }} />
    return sortDir === 'asc'
      ? <ArrowUp size={11} style={{ color: T.primary, marginLeft: '4px' }} />
      : <ArrowDown size={11} style={{ color: T.primary, marginLeft: '4px' }} />
  }

  const toggleAll = () => {
    const ids = displayPool.map((p) => p.claimId)
    const allSelected = ids.length > 0 && ids.every((id) => selected.has(id))
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(ids))
  }

  const handleAssignToSelf = async () => {
    if (!selected.size) {
      toast('warning', 'Select claims', 'Tick one or more claims to assign.')
      return
    }
    if (!loggedUser) {
      toast('error', 'Not signed in', 'No logged-in user for self-assign.')
      return
    }
    setAssigning(true)
    let ok = 0
    let fail = 0
    for (const claimId of selected) {
      try {
        await updateAssignedUser(claimId, loggedUser, poolType, true)
        ok += 1
      } catch {
        fail += 1
      }
    }
    setAssigning(false)
    setSelected(new Set())
    await loadPool(poolType)
    if (ok) toast('success', 'Assigned', `${ok} claim(s) assigned to you. Open My Task to work them.`)
    if (fail) toast('warning', 'Some failed', `${fail} claim(s) could not be assigned (may already be taken).`)
  }

  return (
    <AppLayout pageTitle="Pool Selection">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }} onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, margin: 0 }}>Pool Selection</h1>
            <p style={{ fontSize: '13px', color: T.textMuted, marginTop: '4px' }}>
              Pick unassigned claims from the {poolType} pool, then assign to yourself and work them in My Task.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', ...alertBannerStyle(T, 'warn') }}>
            <Layers size={15} style={{ color: T.warning }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: T.pending.text ?? T.pending.color }}>
              {displayPool.length === pool.length ? `${pool.length} unassigned` : `${displayPool.length} shown · ${pool.length} unassigned`}
            </span>
          </div>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: T.textMuted }}>Pool type</span>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setPoolOpen((p) => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', height: '40px', borderRadius: '8px', border: `1.5px solid ${T.border}`, background: T.inputBg, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: T.textSecondary }}
            >
              {poolType}
              <ChevronDown size={14} />
            </button>
            {poolOpen && (
              <div style={{ position: 'absolute', top: '44px', left: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, minWidth: '140px' }}>
                {poolRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setPoolType(r); setPoolOpen(false) }}
                    style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: poolType === r ? T.sectionOpenBg : 'transparent', textAlign: 'left', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: poolType === r ? T.primary : T.textSecondary, fontFamily: 'Inter,sans-serif' }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAssignToSelf}
            disabled={assigning || !selected.size}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', height: '40px', borderRadius: '8px', border: 'none', background: selected.size && !assigning ? T.primary : '#CBD5E1', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: selected.size && !assigning ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif' }}
          >
            <UserPlus size={16} />
            {assigning ? 'Assigning…' : `Assign to self (${selected.size})`}
          </button>
        </div>

        {pool.length > 0 && (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '360px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: T.textSubtle }} />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setSearchApplied(searchQ.trim()) }}
                placeholder="Search claim, policy, or creator"
                style={{ width: '100%', height: '40px', padding: '0 12px 0 36px', borderRadius: '8px', border: `1.5px solid ${T.border}`, fontSize: '13px', fontFamily: 'Inter,sans-serif' }}
              />
              {searchQ && (
                <button type="button" onClick={() => { setSearchQ(''); setSearchApplied('') }} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: T.textSubtle, display: 'flex' }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSearchApplied(searchQ.trim())}
              style={{ height: '40px', padding: '0 16px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
            >
              Search
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectFieldStyle(T, { height: '40px', padding: '0 12px', borderRadius: '8px', border: `1.5px solid ${T.border}`, fontSize: '13px', fontWeight: 600, minWidth: '180px' })}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: T.textMuted, fontWeight: 600 }}>Loading pool…</div>
          ) : pool.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: T.textPrimary }}>Pool is empty</div>
              <div style={{ fontSize: '13px', color: T.textMuted, marginTop: '6px' }}>
                No unassigned {poolType} claims (ROLE = {poolType}, ASSIGNED_TO is null).
                {poolType === 'Assessor' ? ' New registrations appear with status Pending Assessor Allocation.' : ''}
              </div>
              <button
                type="button"
                onClick={() => loadPool(poolType)}
                style={{ marginTop: '16px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.inputBg, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
              >
                Refresh pool
              </button>
            </div>
          ) : displayPool.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: T.textPrimary }}>No matching claims</div>
              <div style={{ fontSize: '13px', color: T.textMuted, marginTop: '6px' }}>Try clearing search or status filter.</div>
              <button
                type="button"
                onClick={() => { setSearchQ(''); setSearchApplied(''); setStatusFilter('All Statuses') }}
                style={{ marginTop: '16px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.inputBg, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <PremiumGrid>
              <PremiumGridScroll>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', padding: '11px 12px' }}>
                        <input
                          type="checkbox"
                          checked={displayPool.length > 0 && displayPool.every((p) => selected.has(p.claimId))}
                          onChange={toggleAll}
                        />
                      </th>
                      {POOL_TABLE_COLUMNS.map(({ label, key }) => (
                        <SortableTh key={key} active={sortCol === key} onClick={() => handleSort(key)} sortIcon={<SortIcon col={key} />}>
                          {label}
                        </SortableTh>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayPool.map((item) => (
                      <tr key={item.claimId}>
                        <td style={{ padding: '12px' }}>
                          <input type="checkbox" checked={selected.has(item.claimId)} onChange={() => toggleSelect(item.claimId)} />
                        </td>
                        <td
                          onMouseEnter={() => setHoverClaim(item)}
                          onMouseLeave={() => setHoverClaim(null)}
                        >
                          <div className="premium-grid__cell-primary">{item.claimId}</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: T.textMuted }}>{item.policyId}</td>
                        <td><GridStatusBadge tone={statusToGridTone(item.status)}>{item.status}</GridStatusBadge></td>
                        <td style={{ fontSize: '12px', fontWeight: 600 }}>{item.role}</td>
                        <td style={{ fontSize: '12px', color: T.textMuted }}>{item.createdOn}</td>
                        <td style={{ fontSize: '12px', color: T.textMuted }}>{item.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PremiumGridScroll>
            </PremiumGrid>
          )}
        </div>

        <p style={{ fontSize: '12px', color: T.textSubtle, marginTop: '12px' }}>
          There is no open-claim link here. After assign, go to <strong>My Task</strong> to open the claim in work mode.
        </p>

        <ClaimHoverPreview claim={hoverClaim} x={mouse.x} y={mouse.y} />
      </div>
    </AppLayout>
  )
}
