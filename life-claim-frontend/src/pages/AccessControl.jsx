// src/pages/AccessControl.jsx
//
// Access Control admin console (roadmap 1.5) — the first admin screen over the
// dynamic RBAC data. Superuser-only (gated by the /superuser/access route).
// CRUD over roles + permissions (1.1), the role×permission matrix, and per-module
// role assignment (1.5, rbac_module). All calls go through accessControlService.

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../components/Toast'
import rbac from '../services/accessControlService'
import { actionButtonStyle, fieldInputStyle, statusPillStyle } from '../ui/pageTokens'
import { ShieldCheck, Trash2, Plus, Check, X } from 'lucide-react'

const TABS = [
  { id: 'roles', label: 'Roles' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'matrix', label: 'Role × Permission' },
  { id: 'modules', label: 'Modules' },
]

const errMsg = (e, fallback) =>
  e?.response?.data?.message || e?.response?.data?.error_description || e?.message || fallback

function Th({ children, T, style }) {
  return <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.textMuted, borderBottom: `1px solid ${T.border}`, ...style }}>{children}</th>
}
function Td({ children, T, style }) {
  return <td style={{ padding: '10px 12px', fontSize: '13px', color: T.textSecondary, borderBottom: `1px solid ${T.borderSubtle}`, ...style }}>{children}</td>
}

function EnabledToggle({ enabled, onChange, T, disabled }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!enabled)}
      title={enabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}
      style={{ width: '42px', height: '24px', borderRadius: '999px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
               background: enabled ? (T.primary || '#1D4ED8') : T.border, position: 'relative', transition: 'background 0.15s', opacity: disabled ? 0.5 : 1 }}>
      <span style={{ position: 'absolute', top: '2px', left: enabled ? '20px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
    </button>
  )
}

export default function AccessControl() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [tab, setTab] = useState('roles')
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [matrix, setMatrix] = useState({ roles: [], permissions: [] })
  const [modules, setModules] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, p, mx, mods] = await Promise.all([
        rbac.getRoles(), rbac.getPermissions(), rbac.getMatrix(), rbac.getModules(),
      ])
      setRoles(r); setPermissions(p); setMatrix(mx); setModules(mods)
    } catch (e) {
      toast('error', 'Load failed', errMsg(e, 'Could not load access-control data.'))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  // ---- roles ----
  const [newRole, setNewRole] = useState({ name: '', description: '' })
  const addRole = async () => {
    if (!newRole.name.trim()) return
    try {
      await rbac.createRole({ name: newRole.name.trim(), description: newRole.description.trim() || null })
      setNewRole({ name: '', description: '' })
      toast('success', 'Role created', newRole.name)
      load()
    } catch (e) { toast('error', 'Create failed', errMsg(e, 'Could not create role.')) }
  }
  const toggleRole = async (key, enabled) => {
    try { await rbac.setRoleEnabled(key, enabled); load() }
    catch (e) { toast('error', 'Update failed', errMsg(e, 'Could not update role.')) }
  }
  const removeRole = async (key) => {
    if (!window.confirm(`Delete role "${key}"? This cannot be undone.`)) return
    try { await rbac.deleteRole(key); toast('success', 'Role deleted', key); load() }
    catch (e) { toast('error', 'Delete failed', errMsg(e, 'Could not delete role.')) }
  }

  // ---- permissions ----
  const [newPerm, setNewPerm] = useState({ key: '', name: '', module: '' })
  const addPerm = async () => {
    if (!newPerm.key.trim() || !newPerm.name.trim()) return
    try {
      await rbac.createPermission({ key: newPerm.key.trim(), name: newPerm.name.trim(), module: newPerm.module.trim() || null })
      setNewPerm({ key: '', name: '', module: '' })
      toast('success', 'Permission created', newPerm.key)
      load()
    } catch (e) { toast('error', 'Create failed', errMsg(e, 'Could not create permission.')) }
  }
  const togglePerm = async (key, enabled) => {
    try { await rbac.setPermissionEnabled(key, enabled); load() }
    catch (e) { toast('error', 'Update failed', errMsg(e, 'Could not update permission.')) }
  }
  const removePerm = async (key) => {
    if (!window.confirm(`Delete permission "${key}"?`)) return
    try { await rbac.deletePermission(key); toast('success', 'Permission deleted', key); load() }
    catch (e) { toast('error', 'Delete failed', errMsg(e, 'Could not delete permission.')) }
  }

  // ---- matrix ----
  const roleHasPerm = (roleKey, permKey) => {
    const row = matrix.roles.find((r) => r.key === roleKey)
    return !!row?.permissions?.some((p) => p.key === permKey && p.enabled)
  }
  const toggleCell = async (roleKey, permKey, next) => {
    try {
      await rbac.setRolePermission(roleKey, permKey, next)
      const mx = await rbac.getMatrix()
      setMatrix(mx)
    } catch (e) { toast('error', 'Update failed', errMsg(e, 'Could not update mapping.')) }
  }

  // ---- modules ----
  const toggleModule = async (key, enabled) => {
    try { await rbac.setModuleEnabled(key, enabled); load() }
    catch (e) { toast('error', 'Update failed', errMsg(e, 'Could not update module.')) }
  }
  // allowedRoles stores the human ROLE_NAME (e.g. "Assessor") so it matches how
  // the registry/hasRole compares. Clicking a role name toggles it in the list;
  // clearing the list reverts the module to "any operational" (null).
  const displayRoleName = (roleKey) => (roles.find((x) => x.key === roleKey)?.name) || roleKey
  const toggleModuleRole = async (mod, roleKey) => {
    const name = displayRoleName(roleKey)
    const current = Array.isArray(mod.allowedRoles) ? mod.allowedRoles : []
    const next = current.includes(name) ? current.filter((x) => x !== name) : [...current, name]
    try { await rbac.setModuleRoles(mod.key, next.length ? next : null); load() }
    catch (e) { toast('error', 'Update failed', errMsg(e, 'Could not update module roles.')) }
  }
  const setModuleAny = async (mod) => {
    try { await rbac.setModuleRoles(mod.key, null); load() }
    catch (e) { toast('error', 'Update failed', errMsg(e, 'Could not update module roles.')) }
  }

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }
  const wrap = { padding: '20px 24px', maxWidth: '1100px', margin: '0 auto' }

  return (
    <AppLayout pageTitle="Access Control">
      <div style={wrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <ShieldCheck size={20} style={{ color: T.primary }} />
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: T.textPrimary, margin: 0 }}>Access Control</h1>
        </div>
        <p style={{ fontSize: '13px', color: T.textMuted, marginTop: 0, marginBottom: '18px' }}>
          Manage roles, permissions, and which modules each role can see. Changes apply at runtime.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: `1px solid ${T.border}` }}>
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t.id ? 700 : 500,
                       color: tab === t.id ? (T.primary || '#1D4ED8') : T.textMuted, borderBottom: tab === t.id ? `2px solid ${T.primary || '#1D4ED8'}` : '2px solid transparent', marginBottom: '-1px' }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted, fontSize: '13px' }}>Loading…</div>
        ) : (
          <>
            {tab === 'roles' && (
              <div style={card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><Th T={T}>Role</Th><Th T={T}>Key</Th><Th T={T}>Enabled</Th><Th T={T}></Th></tr></thead>
                  <tbody>
                    {roles.map((r) => (
                      <tr key={r.key}>
                        <Td T={T}><strong>{r.name}</strong>{r.isSystem && <span style={{ ...statusPillStyle(T, 'neutral'), marginLeft: '8px' }}>system</span>}<div style={{ color: T.textSubtle, fontSize: '12px' }}>{r.description}</div></Td>
                        <Td T={T}><code>{r.key}</code></Td>
                        <Td T={T}><EnabledToggle enabled={r.isEnabled} onChange={(v) => toggleRole(r.key, v)} T={T} /></Td>
                        <Td T={T} style={{ textAlign: 'right' }}>
                          {!r.isSystem && <button type="button" onClick={() => removeRole(r.key)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.danger }}><Trash2 size={15} /></button>}
                        </Td>
                      </tr>
                    ))}
                    <tr>
                      <Td T={T}><input value={newRole.name} onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))} placeholder="New role name" style={fieldInputStyle(T)} /></Td>
                      <Td T={T} style={{ color: T.textSubtle }}>auto-slug</Td>
                      <Td T={T}><input value={newRole.description} onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" style={fieldInputStyle(T)} /></Td>
                      <Td T={T} style={{ textAlign: 'right' }}><button type="button" onClick={addRole} style={actionButtonStyle(T, 'primary', { size: 'sm' })}><Plus size={14} /> Add</button></Td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'permissions' && (
              <div style={card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><Th T={T}>Permission</Th><Th T={T}>Module</Th><Th T={T}>Key</Th><Th T={T}>Enabled</Th><Th T={T}></Th></tr></thead>
                  <tbody>
                    {permissions.map((p) => (
                      <tr key={p.key}>
                        <Td T={T}>{p.name}</Td>
                        <Td T={T}>{p.module || '—'}</Td>
                        <Td T={T}><code>{p.key}</code></Td>
                        <Td T={T}><EnabledToggle enabled={p.isEnabled} onChange={(v) => togglePerm(p.key, v)} T={T} /></Td>
                        <Td T={T} style={{ textAlign: 'right' }}><button type="button" onClick={() => removePerm(p.key)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.danger }}><Trash2 size={15} /></button></Td>
                      </tr>
                    ))}
                    <tr>
                      <Td T={T}><input value={newPerm.name} onChange={(e) => setNewPerm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" style={fieldInputStyle(T)} /></Td>
                      <Td T={T}><input value={newPerm.module} onChange={(e) => setNewPerm((p) => ({ ...p, module: e.target.value }))} placeholder="module" style={fieldInputStyle(T)} /></Td>
                      <Td T={T}><input value={newPerm.key} onChange={(e) => setNewPerm((p) => ({ ...p, key: e.target.value }))} placeholder="e.g. claims.export" style={fieldInputStyle(T)} /></Td>
                      <Td T={T} colSpan={2} style={{ textAlign: 'right' }}><button type="button" onClick={addPerm} style={actionButtonStyle(T, 'primary', { size: 'sm' })}><Plus size={14} /> Add</button></Td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'matrix' && (
              <div style={{ ...card, overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <Th T={T} style={{ position: 'sticky', left: 0, background: T.card }}>Permission</Th>
                      {roles.map((r) => <Th T={T} key={r.key} style={{ textAlign: 'center' }}>{r.name}</Th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((p) => (
                      <tr key={p.key}>
                        <Td T={T} style={{ position: 'sticky', left: 0, background: T.card }}><code style={{ fontSize: '12px' }}>{p.key}</code></Td>
                        {roles.map((r) => {
                          const on = roleHasPerm(r.key, p.key)
                          return (
                            <Td T={T} key={r.key} style={{ textAlign: 'center' }}>
                              <button type="button" onClick={() => toggleCell(r.key, p.key, !on)}
                                style={{ width: '26px', height: '26px', borderRadius: '6px', cursor: 'pointer',
                                         border: `1px solid ${on ? (T.primary || '#1D4ED8') : T.border}`, background: on ? (T.primary || '#1D4ED8') : 'transparent', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                {on ? <Check size={14} /> : <X size={12} style={{ color: T.textSubtle }} />}
                              </button>
                            </Td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'modules' && (
              <div style={card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><Th T={T}>Module</Th><Th T={T}>Enabled</Th><Th T={T}>Roles that can see it</Th></tr></thead>
                  <tbody>
                    {modules.map((m) => {
                      const any = !Array.isArray(m.allowedRoles)
                      return (
                        <tr key={m.key}>
                          <Td T={T}><strong>{m.label}</strong><div style={{ color: T.textSubtle, fontSize: '12px' }}><code>{m.key}</code> · {m.path}</div></Td>
                          <Td T={T}><EnabledToggle enabled={m.isEnabled} onChange={(v) => toggleModule(m.key, v)} T={T} /></Td>
                          <Td T={T}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                              <button type="button" onClick={() => setModuleAny(m)}
                                style={{ ...statusPillStyle(T, any ? 'approved' : 'neutral'), cursor: 'pointer', border: 'none' }}>
                                Any operational
                              </button>
                              {roles.filter((r) => r.key !== 'superuser').map((r) => {
                                const selected = !any && m.allowedRoles.includes(r.name)
                                return (
                                  <button key={r.key} type="button" onClick={() => toggleModuleRole(m, r.key)}
                                    style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                             border: `1px solid ${selected ? (T.primary || '#1D4ED8') : T.border}`,
                                             background: selected ? (T.primary || '#1D4ED8') : 'transparent',
                                             color: selected ? '#fff' : T.textSecondary }}>
                                    {r.name}
                                  </button>
                                )
                              })}
                            </div>
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
