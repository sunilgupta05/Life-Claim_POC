import { useEffect, useState, useMemo, useCallback } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import adminService from '../services/adminService'
import { getUsers } from '../services/userService'
import { useTheme } from '../context/ThemeContext'
import { selectFieldStyle, outlineButtonStyle } from '../ui/pageTokens'
import { PremiumGrid, PremiumGridScroll, PremiumGridFooter } from '../ui/PremiumDataGrid'
import {
  isPreAssessorRoleName,
  isAssessorRoleName,
  isVerifierRoleName,
  normRole,
} from '../util/workflowRole'


const UNASSIGNED_VALUE = '__UNASSIGNED__'
const PAGE_SIZE = 10

const ASSIGN_SECTIONS = [
  { role: 'Assessor', title: 'Assessor pool', subtitle: 'Pending Assessor Allocation / Action' },
  { role: 'Verifier', title: 'Verifier pool', subtitle: 'Pending Verifier Allocation / Action' },
]

function claimRoleBucket(role) {
  if (isPreAssessorRoleName(role)) return 'Pre Assessor'
  if (isAssessorRoleName(role)) return 'Assessor'
  if (isVerifierRoleName(role)) return 'Verifier'
  const n = normRole(role)
  if (n === 'pre assessor') return 'Pre Assessor'
  if (n === 'assessor') return 'Assessor'
  if (n === 'verifier') return 'Verifier'
  return String(role || '').trim()
}

function updateClaimInList(prev, claimNumber, patch) {
  return prev.map((c) => {
    const cn = c.claimNumber || c.CLAIM_NUMBER
    if (cn !== claimNumber) return c
    return { ...c, ...patch, ASSIGNED_TO: patch.assignedTo ?? patch.ASSIGNED_TO ?? c.ASSIGNED_TO }
  })
}

function RoleSection({
  title,
  subtitle,
  role,
  claims,
  page,
  onPageChange,
  usersByRole,
  draftAssignee,
  setDraftAssignee,
  assigning,
  onAssign,
  onUnassign,
}) {
  const { tokens: T } = useTheme()
  const totalPages = Math.max(1, Math.ceil(claims.length / PAGE_SIZE))
  const pageClaims = claims.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const options = usersByRole[role] || []

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px', color: T.textPrimary }}>{title}</h2>
        <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>
          {subtitle} · {claims.length} claim{claims.length === 1 ? '' : 's'}
        </p>
      </div>

      {claims.length === 0 ? (
        <div style={{ padding: '24px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', color: T.textMuted, fontSize: '13px' }}>
          No claims in this pool.
        </div>
      ) : (
        <PremiumGrid>
          <PremiumGridScroll>
            <table>
              <thead>
                <tr>
                  {['Claim', 'Policy', 'Status', 'Assigned', 'Assign to', ''].map((h) => (
                    <th key={h || 'action'}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageClaims.map((c) => {
                  const cn = c.claimNumber || c.CLAIM_NUMBER
                  const currentAssignee = c.assignedTo || c.ASSIGNED_TO || ''
                  const selectValue = draftAssignee[cn] ?? currentAssignee
                  const wantsUnassign = selectValue === UNASSIGNED_VALUE || selectValue === ''
                  const isBusy = assigning === cn

                  return (
                    <tr key={cn}>
                      <td><div className="premium-grid__cell-primary">{cn}</div></td>
                      <td style={{ fontSize: '12px' }}>{c.policyNumber || c.POLICY_NUMBER || '—'}</td>
                      <td style={{ fontSize: '12px' }}>{c.status || c.STATUS}</td>
                      <td style={{ fontSize: '12px' }}>{currentAssignee || '—'}</td>
                      <td>
                        <select
                          value={selectValue}
                          onChange={(e) => setDraftAssignee((p) => ({ ...p, [cn]: e.target.value }))}
                          style={selectFieldStyle(T, { height: '34px', minWidth: '150px', borderRadius: '6px', fontSize: '12px' })}
                        >
                          <option value={UNASSIGNED_VALUE}>— Unassigned —</option>
                          {options.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                          {currentAssignee && !options.includes(currentAssignee) && (
                            <option value={currentAssignee}>{currentAssignee}</option>
                          )}
                        </select>
                      </td>
                      <td>
                        {wantsUnassign && currentAssignee ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onUnassign(c, role)}
                            style={outlineButtonStyle(T, {
                              padding: '6px 14px',
                              borderRadius: '6px',
                              border: `1px solid ${T.rejected.border}`,
                              color: T.dangerSolid,
                              fontWeight: 700,
                              fontSize: '12px',
                              opacity: isBusy ? 0.6 : 1,
                              background: T.isDark ? T.surfaceMuted : T.rejected.bg,
                            })}
                          >
                            {isBusy ? '…' : 'Unassign'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy || wantsUnassign || !selectValue}
                            onClick={() => onAssign(c, role)}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', opacity: isBusy || wantsUnassign || !selectValue ? 0.6 : 1 }}
                          >
                            {isBusy ? '…' : currentAssignee ? 'Reassign' : 'Assign'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </PremiumGridScroll>
          {totalPages > 1 && (
            <PremiumGridFooter>
              <span>Page {page + 1} of {totalPages}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)} className="premium-grid__pill">Prev</button>
                <button type="button" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)} className="premium-grid__pill">Next</button>
              </div>
            </PremiumGridFooter>
          )}
        </PremiumGrid>
      )}
    </div>
  )
}

export default function AdminClaimSearch() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [assigning, setAssigning] = useState(null)
  const [draftAssignee, setDraftAssignee] = useState({})
  const [assessorPage, setAssessorPage] = useState(0)
  const [verifierPage, setVerifierPage] = useState(0)

  const loadClaims = useCallback(async () => {
    setLoading(true)
    try {
      let list = await adminService.getRecentClaims({ limit: 300, view: 'openByRole' })
      if (!list?.length) {
        const summary = await adminService.getSummary()
        list = summary?.openByRoleClaims || []
      }
      setClaims(Array.isArray(list) ? list : [])
      setAssessorPage(0)
      setVerifierPage(0)
    } catch (e) {
      toast('error', 'Load failed', e?.message || 'Could not load claims.')
      setClaims([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadClaims()
  }, [loadClaims])

  useEffect(() => {
    getUsers()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.users || data?.data || []
        setUsers(list.filter((u) => u.active !== false && u.active !== 0))
      })
      .catch(() => setUsers([]))
  }, [])

  const usersByRole = useMemo(() => {
    const buckets = { 'Pre Assessor': [], Assessor: [], Verifier: [] }
    users.forEach((u) => {
      const username = String(u.username || '').trim()
      if (!username) return
      const roles = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : [])
      const matched = new Set()
      roles.forEach((r) => {
        const bucket = claimRoleBucket(r)
        if (buckets[bucket] && !matched.has(bucket)) {
          buckets[bucket].push(username)
          matched.add(bucket)
        }
      })
    })
    Object.keys(buckets).forEach((k) => {
      buckets[k] = [...new Set(buckets[k])].sort()
    })
    return buckets
  }, [users])

  const claimsByRole = useMemo(() => {
    const buckets = { Assessor: [], Verifier: [] }
    claims.forEach((c) => {
      const bucket = claimRoleBucket(c.role || c.ROLE)
      if (buckets[bucket]) buckets[bucket].push(c)
    })
    return buckets
  }, [claims])

  const handleAssign = async (claim, role) => {
    const claimNumber = claim.claimNumber || claim.CLAIM_NUMBER
    const assignee = draftAssignee[claimNumber] || claim.assignedTo || claim.ASSIGNED_TO
    if (!assignee || assignee === UNASSIGNED_VALUE) {
      toast('warning', 'Assignee', 'Select a user for this claim.')
      return
    }
    setAssigning(claimNumber)
    try {
      const result = await adminService.assignClaim({ claimNumber, assignee, role })
      toast('success', 'Assigned', `${claimNumber} → ${assignee}`)
      setClaims((prev) => updateClaimInList(prev, claimNumber, {
        assignedTo: result?.assignedTo || assignee,
        status: result?.status,
        STATUS: result?.status,
      }))
      setDraftAssignee((p) => ({ ...p, [claimNumber]: result?.assignedTo || assignee }))
    } catch (e) {
      toast('error', 'Assign failed', e?.message || 'Could not assign claim.')
    } finally {
      setAssigning(null)
    }
  }

  const handleUnassign = async (claim, role) => {
    const claimNumber = claim.claimNumber || claim.CLAIM_NUMBER
    setAssigning(claimNumber)
    try {
      const result = await adminService.unassignClaim({ claimNumber, role })
      toast('success', 'Unassigned', `${claimNumber} returned to allocation pool`)
      setClaims((prev) => updateClaimInList(prev, claimNumber, {
        assignedTo: null,
        ASSIGNED_TO: null,
        status: result?.status,
        STATUS: result?.status,
      }))
      setDraftAssignee((p) => ({ ...p, [claimNumber]: UNASSIGNED_VALUE }))
    } catch (e) {
      toast('error', 'Unassign failed', e?.message || 'Could not unassign claim.')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <AppLayout pageTitle="Claim Assignment" pageSubtitle="Assign or reassign open assessor and verifier claims">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px' }}>Claim assignment</h1>
        <p style={{ fontSize: '13px', color: T.textMuted, marginBottom: '20px' }}>
          Open / pending by role · Assign moves a claim to Action; choose — Unassigned — and click Unassign to return it to Allocation.
        </p>

        {loading ? (
          <div style={{ padding: '32px', color: T.textMuted }}>Loading claims…</div>
        ) : (
          ASSIGN_SECTIONS.map(({ role, title, subtitle }) => (
            <RoleSection
              key={role}
              title={title}
              subtitle={subtitle}
              role={role}
              claims={claimsByRole[role] || []}
              page={role === 'Assessor' ? assessorPage : verifierPage}
              onPageChange={role === 'Assessor' ? setAssessorPage : setVerifierPage}
              usersByRole={usersByRole}
              draftAssignee={draftAssignee}
              setDraftAssignee={setDraftAssignee}
              assigning={assigning}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
            />
          ))
        )}
      </div>
    </AppLayout>
  )
}
