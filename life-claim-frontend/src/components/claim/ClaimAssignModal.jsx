import { useState, useEffect } from 'react'
import { useToast } from '../Toast'
import { claimSearch } from '../../services/claimSearchService'
import { assignClaim } from '../../services/claimsService'
import adminService from '../../services/adminService'
import { getUsers } from '../../services/userService'
import { useTheme } from '../../context/ThemeContext'
import { selectFieldStyle } from '../../ui/pageTokens'

export default function ClaimAssignModal({ open, onClose, claimNumber, mode = 'assessor' }) {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [assignee, setAssignee] = useState('')
  const [role, setRole] = useState(mode === 'verifier' ? 'Verifier' : 'Assessor')
  const [saving, setSaving] = useState(false)
  const [useSuperUserApi, setUseSuperUserApi] = useState(false)

  useEffect(() => {
    if (!open) return
    getUsers()
      .then((list) => setUsers(Array.isArray(list) ? list : []))
      .catch(() => setUsers([]))
  }, [open])

  if (!open) return null

  const handleSave = async () => {
    if (!assignee.trim()) return toast('warning', 'Assignee', 'Select or enter a username.')
    setSaving(true)
    try {
      const username = sessionStorage.getItem('loggedUser') || ''
      if (useSuperUserApi) {
        await adminService.assignClaim({ claimNumber, assignee: assignee.trim(), role })
      } else if (role === 'Verifier') {
        await claimSearch.updateVerifier(assignee.trim(), claimNumber, username)
      } else {
        await claimSearch.updateAssessor(assignee.trim(), claimNumber, username)
      }
      toast('success', 'Assigned', `${claimNumber} → ${assignee} (${role})`)
      onClose(true)
    } catch (e) {
      toast('error', 'Assign failed', e?.message || 'Could not assign claim.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => onClose(false)}>
      <div style={{ background: T.card, borderRadius: '16px', width: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: T.textPrimary }}>Assign claim</div>
          <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '4px' }}>{claimNumber}</div>
        </div>
        <div style={{ padding: '20px 22px', display: 'grid', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: T.textSecondary }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={selectFieldStyle(T, { width: '100%', height: '38px', marginTop: '6px', borderRadius: '8px' })}>
              <option>Assessor</option>
              <option>Verifier</option>
              <option>Pre Assessor</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: T.textSecondary }}>Assignee username</label>
            <input list="assign-users" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="username"
              style={{ width: '100%', height: '38px', marginTop: '6px', padding: '0 10px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' }} />
            <datalist id="assign-users">
              {users.map((u) => (
                <option key={u.username || u.id} value={u.username} />
              ))}
            </datalist>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: T.textMuted }}>
            <input type="checkbox" checked={useSuperUserApi} onChange={(e) => setUseSuperUserApi(e.target.checked)} />
            Use super user assign API
          </label>
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={() => onClose(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.surfaceMuted, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            {saving ? 'Saving…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}
