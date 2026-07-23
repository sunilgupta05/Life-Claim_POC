import { useState } from 'react'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService'
import { getRoles } from '../services/masterService'
import roleService from '../services/roleService'
import { useEffect } from 'react'
import { Users, Plus, Edit3, Trash2, X, Save, Search } from 'lucide-react'
import { formatSuperUserLabel } from '../util/superuserRole'
import { useTheme } from '../context/ThemeContext'
import { roleBadgeTokens, metricCardTokens, fieldInputStyle, outlineButtonStyle } from '../ui/pageTokens'


const BLANK = { name:'', username:'', email:'', role:'Pre Assessor', status:'Active' }

function Modal({ title, onClose, children }) {
  const { tokens: T } = useTheme()
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(2px)' }}>
      <div style={{ background:T.card, borderRadius:'16px', width:'480px', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', overflow:'hidden', animation:'fadeUp 0.2s ease' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', borderBottom:`1px solid ${T.border}` }}>
          <span style={{ fontWeight:700, fontSize:'15px', color:T.textPrimary }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.textMuted, display:'flex', padding:'4px', borderRadius:'6px' }}
            onMouseEnter={e=>e.currentTarget.style.background=T.hoverBg} onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <X size={18}/>
          </button>
        </div>
        {children}
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

function UserForm({ data, onChange, onSave, onClose, title, roleOptions = [] }) {
  const { tokens: T } = useTheme()
  const roles = roleOptions.length ? roleOptions : ['Pre Assessor', 'Assessor', 'Verifier', 'Super User', 'Clerk']
  const inp = (label, key, opts={}) => (
    <div key={key}>
      <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:T.textSecondary, marginBottom:'5px' }}>{label}</label>
      {opts.options ? (
        <select value={data[key]} onChange={e=>onChange(key,e.target.value)}
          style={{ ...fieldInputStyle(T, { width:'100%', height:'40px', padding:'0 12px', border:`1.5px solid ${T.border}`, borderRadius:'8px', fontSize:'13px', fontWeight:500, outline:'none' }) }}>
          {opts.options.map(o=><option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={opts.type||'text'} value={data[key]} onChange={e=>onChange(key,e.target.value)} placeholder={opts.placeholder||''}
          style={{ ...fieldInputStyle(T, { width:'100%', height:'40px', padding:'0 12px', border:`1.5px solid ${T.border}`, borderRadius:'8px', fontSize:'13px', fontWeight:500, outline:'none', boxSizing:'border-box' }) }}
          onFocus={e=>{ e.target.style.borderColor=T.primary; e.target.style.background=T.inputBgFocus }}
          onBlur={e=>{ e.target.style.borderColor=T.border; e.target.style.background=T.inputBgReadonly }}/>
      )}
    </div>
  )

  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
        {inp('Full Name','name',{ placeholder:'e.g. Priya Sharma' })}
        {inp('Username','username',{ placeholder:'e.g. psharma' })}
        {inp('Email Address','email',{ type:'email', placeholder:'email@dhdigital.co.in' })}
        {inp('Role','role',{ options: roles })}
        {inp('Status','status',{ options:['Active','Inactive'] })}
      </div>
      <div style={{ padding:'16px 20px', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'flex-end', gap:'10px' }}>
        <button onClick={onClose} style={{ ...outlineButtonStyle(T, { padding:'9px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:700 }) }}>Cancel</button>
        <button onClick={onSave} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 22px', borderRadius:'8px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(29,78,216,0.3)' }}>
          <Save size={14}/> Save User
        </button>
      </div>
    </Modal>
  )
}

function DeleteConfirm({ user, onConfirm, onCancel }) {
  const { tokens: T } = useTheme()
  return (
    <Modal title="Delete User" onClose={onCancel}>
      <div style={{ padding:'24px' }}>
        <div style={{ width:'48px', height:'48px', borderRadius:'12px', background: T.rejected.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
          <Trash2 size={22} style={{ color:'#DC2626' }}/>
        </div>
        <div style={{ fontWeight:800, fontSize:'15px', color:T.textPrimary, marginBottom:'8px' }}>Delete {user.name}?</div>
        <div style={{ fontSize:'13px', color:T.textMuted, lineHeight:1.6, marginBottom:'24px' }}>
          This will permanently remove <strong>{user.username}</strong> from the system. This cannot be undone.
        </div>
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ ...outlineButtonStyle(T, { padding:'9px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:700 }) }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:'9px 22px', borderRadius:'8px', border:'none', background:'#DC2626', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(220,38,38,0.3)' }}
            onMouseEnter={e=>e.currentTarget.style.background='#B91C1C'} onMouseLeave={e=>e.currentTarget.style.background='#DC2626'}>
            Delete User
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function UserManagement() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [newUser, setNewUser] = useState(BLANK)
  const [hovRow, setHovRow] = useState(null)
  const [roleOptions, setRoleOptions] = useState(Object.keys(ROLE_COLORS))
  const [newRoleName, setNewRoleName] = useState('')
  const [showAddRole, setShowAddRole] = useState(false)

  const reloadUsers = () => {
    getUsers().then((data) => {
      const mapped = (data || []).map((u) => ({
        id: u.id,
        name: `${u.first_Name || ''} ${u.last_Name || ''}`.trim(),
        username: u.username,
        email: u.email,
        role: Array.isArray(u.roles) ? u.roles[0] : (u.roles || 'Pre Assessor'),
        status: u.active === false ? 'Inactive' : 'Active',
        lastLogin: u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : '—',
        claimsHandled: u.claims_handled || 0,
      }))
      setUsers(mapped)
    }).catch(() => {})
  }

  useEffect(() => {
    getRoles().then((r) => {
      const names = (r || []).map((x) => x.role_name || x.name || x.ROLE_NAME || x).filter(Boolean)
      if (names.length) setRoleOptions(names)
    }).catch(() => {})
  }, [])

  useEffect(() => { reloadUsers() }, [])

  const allRoles = ['All', ...Object.keys(ROLE_COLORS)]

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchR = roleFilter === 'All' || u.role === roleFilter
    return matchQ && matchR
  })

  const handleAdd = async () => {
    if (!newUser.name || !newUser.username || !newUser.email) { toast('warning','Missing Fields','Please fill all required fields.'); return }
    try {
      const parts = newUser.name.trim().split(' ')
      await createUser({ firstName: parts[0], lastName: parts.slice(1).join(' ') || '.', username: newUser.username, email: newUser.email, password: 'Password@123', roles: [newUser.role || 'Pre Assessor'] })
      reloadUsers()
      toast('success','User Added',`${newUser.name} has been added.`)
    } catch (e) { toast('error','Failed', e.response?.data?.message || e.message) }
    setShowAdd(false); setNewUser(BLANK)
  }

  const handleEdit = async () => {
    try {
      const parts = editUser.name?.split(' ') || ['User']
      await updateUser(editUser.username, { first_Name: parts[0], last_Name: parts.slice(1).join(' ') || '.', email: editUser.email, roles: [editUser.role], active: editUser.status === 'Active' })
      setUsers(p => p.map(u => u.id === editUser.id ? editUser : u))
      toast('success','User Updated',`${editUser.name}'s details have been updated.`)
    } catch (e) { toast('error','Failed', e.response?.data?.message || e.message) }
    setEditUser(null)
  }

  const handleDelete = async () => {
    try {
      await deleteUser(deleteUser.username)
      setUsers(p => p.filter(u => u.id !== deleteUser.id))
      toast('success','User Deleted',`${deleteUser.name} has been removed.`)
    } catch (e) { toast('error','Failed', e.response?.data?.message || e.message) }
    setDeleteUser(null)
  }

  const toggleStatus = async (user) => {
    const ns = user.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const parts = user.name?.split(' ') || ['User']
      await updateUser(user.username, {
        first_Name: parts[0],
        last_Name: parts.slice(1).join(' ') || '.',
        email: user.email,
        roles: [user.role],
        active: ns === 'Active',
      })
      setUsers((p) => p.map((u) => (u.id === user.id ? { ...u, status: ns } : u)))
      toast('success', 'Status Updated', `${user.name} is now ${ns}.`)
    } catch (e) {
      toast('error', 'Failed', e?.message || 'Could not update user status.')
    }
  }

  return (
    <AppLayout pageTitle="User Management">
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:'0 0 4px' }}>User Management</h1>
            <p style={{ fontSize:'13px', color:T.textMuted, fontWeight:500 }}>Manage user accounts, roles, and access permissions.</p>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button type="button" onClick={() => setShowAddRole(true)} style={{ ...outlineButtonStyle(T, { padding:'10px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:700, color:T.textSecondary }) }}>+ Role</button>
            <button type="button" onClick={()=>setShowAdd(true)} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'8px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(29,78,216,0.3)' }}>
              <Plus size={15}/> Add User
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
          {[
            { label:'Total Users', value: users.length, tone:'info' },
            { label:'Active', value: users.filter(u=>u.status==='Active').length, tone:'success' },
            { label:'Inactive', value: users.filter(u=>u.status==='Inactive').length, tone:'warn' },
            { label:'Roles Assigned', value: new Set(users.map(u=>u.role)).size, tone:'info' },
          ].map(s=>{
            const tok = metricCardTokens(T, s.tone)
            return (
            <div key={s.label} style={{ background:T.card, borderRadius:'10px', padding:'16px', border:`1px solid ${tok.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:'28px', fontWeight:900, color:tok.color }}>{s.value}</div>
              <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'4px', fontWeight:600 }}>{s.label}</div>
            </div>
          )})}
        </div>

        {/* Filters */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'16px 20px', marginBottom:'16px', display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:1, minWidth:'200px', display:'flex', alignItems:'center', gap:'8px', padding:'0 12px', height:'38px', borderRadius:'8px', background:T.inputBg, border:`1.5px solid ${T.border}` }}>
            <Search size={14} style={{ color:T.textSubtle }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..."
              style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:T.textPrimary, fontWeight:500, fontFamily:'Inter,sans-serif' }}/>
          </div>
          <div style={{ display:'flex', gap:'4px', background:T.surfaceMuted, border:`1px solid ${T.border}`, borderRadius:'8px', padding:'3px' }}>
            {allRoles.map(r=>(
              <button key={r} onClick={()=>setRoleFilter(r)}
                style={{ padding:'5px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:700, fontFamily:'Inter,sans-serif', transition:'all 0.15s', background:roleFilter===r?T.primary:'transparent', color:roleFilter===r?'#fff':T.textSubtle, whiteSpace:'nowrap' }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>All Users</div>
            <div style={{ fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{filtered.length} of {users.length}</div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:T.surfaceMuted, borderBottom:`2px solid ${T.border}` }}>
                  {['Name','Username','Email','Role','Status','Last Login','Claims','Actions'].map(h=>(
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const roleLabel = formatSuperUserLabel(u.role) || u.role
                  const rc = roleBadgeTokens(T, roleLabel) || roleBadgeTokens(T, u.role)
                  return (
                    <tr key={u.id} style={{ borderBottom:`1px solid ${T.borderSubtle}`, background:hovRow===i?T.hoverBg:'', transition:'background 0.1s' }}
                      onMouseEnter={()=>setHovRow(i)} onMouseLeave={()=>setHovRow(null)}>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:T.primary, color:'#fff', fontSize:'11px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                          </div>
                          <div style={{ fontSize:'13px', fontWeight:700, color:T.textSecondary }}>{u.name}</div>
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:'12px', fontWeight:600, color:T.textMuted, fontFamily:'monospace' }}>{u.username}</td>
                      <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{u.email}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'99px', background:rc.bg, color:rc.color, border:`1px solid ${rc.border}` }}>{roleLabel}</span>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <button onClick={()=>toggleStatus(u)}
                          style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'99px', background: u.status==='Active' ? T.approved.bg : T.surfaceMuted, color: u.status==='Active' ? T.approved.color : T.textSubtle, border:`1px solid ${u.status==='Active' ? T.approved.border : T.border}`, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}>
                          {u.status}
                        </button>
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{u.lastLogin}</td>
                      <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:700, color:T.textSecondary }}>{u.claimsHandled}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', gap:'5px', opacity: hovRow===i?1:0, transition:'opacity 0.15s' }}>
                          <button onClick={()=>setEditUser({...u})} style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${T.border}`, background:T.surfaceMuted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.textMuted, transition:'all 0.15s' }}
                            onMouseEnter={e=>{ e.currentTarget.style.background=T.sectionOpenBg; e.currentTarget.style.color=T.primary; e.currentTarget.style.borderColor=T.primaryBorder }}
                            onMouseLeave={e=>{ e.currentTarget.style.background=T.surfaceMuted; e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border }}>
                            <Edit3 size={12}/>
                          </button>
                          <button onClick={()=>setDeleteUser(u)} style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${T.border}`, background:T.surfaceMuted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.textMuted, transition:'all 0.15s' }}
                            onMouseEnter={e=>{ e.currentTarget.style.background=T.rejected.bg; e.currentTarget.style.color=T.danger; e.currentTarget.style.borderColor=T.rejected.border }}
                            onMouseLeave={e=>{ e.currentTarget.style.background=T.surfaceMuted; e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border }}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddRole && (
        <Modal title="Add role" onClose={() => setShowAddRole(false)}>
          <div style={{ padding: '20px' }}>
            <input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role name" style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif' }} />
          </div>
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setShowAddRole(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${T.border}`, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancel</button>
            <button type="button" onClick={async () => {
              if (!newRoleName.trim()) return
              try {
                await roleService.addRoles({ role_name: newRoleName.trim() })
                setRoleOptions((p) => [...p, newRoleName.trim()])
                toast('success', 'Role added', newRoleName)
                setNewRoleName('')
                setShowAddRole(false)
              } catch (e) { toast('error', 'Failed', e.message) }
            }} style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Save role</button>
          </div>
        </Modal>
      )}
      {showAdd && (
        <UserForm title="Add New User" data={newUser} roleOptions={roleOptions} onChange={(k,v)=>setNewUser(p=>({...p,[k]:v}))} onSave={handleAdd} onClose={()=>{ setShowAdd(false); setNewUser(BLANK) }}/>
      )}
      {editUser && (
        <UserForm title="Edit User" data={editUser} roleOptions={roleOptions} onChange={(k,v)=>setEditUser(p=>({...p,[k]:v}))} onSave={handleEdit} onClose={()=>setEditUser(null)}/>
      )}
      {deleteUser && (
        <DeleteConfirm user={deleteUser} onConfirm={handleDelete} onCancel={()=>setDeleteUser(null)}/>
      )}
    </AppLayout>
  )
}
