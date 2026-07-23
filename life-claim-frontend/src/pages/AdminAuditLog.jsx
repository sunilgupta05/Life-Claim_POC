import { useState, useEffect, useMemo } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import { getAuditLogs } from '../services/userService'
import { Search, Download, X, ChevronUp, ChevronDown } from 'lucide-react'
import { resolveDisplayRole, isSuperUserUsername } from '../util/superuserRole'
import { coalesceRoles } from '../util/workflowRole'
import { useTheme } from '../context/ThemeContext'
import { metricCardTokens, roleBadgeTokens, statusPillStyle, selectFieldStyle } from '../ui/pageTokens'

const PAGE_SIZE = 10

const ROLE_FILTER_OPTIONS = ['All', 'Pre Assessor', 'Assessor', 'Verifier', 'Super User']

const TABLE_COLUMNS = [
  { key: 'timestamp', label: 'Signed in' },
  { key: 'user', label: 'User' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'duration', label: 'Duration' },
  { key: 'ip', label: 'IP Address' },
]

function formatDuration(minutes, isActive) {
  const n = Number(minutes)
  if (!Number.isFinite(n) || n < 0) return isActive ? 'In progress' : '—'
  if (n < 1) return isActive ? '< 1 min' : '< 1 min'
  if (n < 60) return `${n} min`
  const h = Math.floor(n / 60)
  const m = n % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function parseAuditRoles(l) {
  if (Array.isArray(l.roles)) return l.roles
  const raw = l.USER_ROLES
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function resolveAuditRole(l) {
  const username = l.username || l.USERNAME || l.user || ''
  const roles = coalesceRoles(parseAuditRoles(l), l.userRole)
  const display = resolveDisplayRole(roles, username)
  if (display) return display
  if (isSuperUserUsername(username)) return 'Super User'
  return '—'
}

function dateRangeForPeriod(period) {
  const to = new Date().toISOString().slice(0, 10)
  if (period === 'today') return { from: to, to }
  if (period === 'week') {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return { from: d.toISOString().slice(0, 10), to }
  }
  return {}
}

export default function AdminAuditLog() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState('All')
  const [period, setPeriod] = useState('week')
  const [page, setPage] = useState(0)
  const [hovRow, setHovRow] = useState(null)
  const [logs, setLogs] = useState([])
  const [sortKey, setSortKey] = useState('timestamp')
  const [sortDir, setSortDir] = useState('desc')

  const mapAuditRow = (l, i) => {
    const loginAt = l.loginAt || l.LOGIN_AT
    const logoutAt = l.logoutAt || l.LOGOUT_AT
    const ended = Boolean(logoutAt)
    const durationMin = Number(l.durationMin ?? l.DURATION_MIN ?? 0)
    return {
      id: l.id ?? i + 1,
      user: l.username || l.USERNAME || l.user || 'Unknown',
      role: resolveAuditRole(l),
      status: ended ? 'Signed out' : 'Active',
      isActive: !ended,
      duration: formatDuration(durationMin, !ended),
      durationMin,
      loginDay: loginAt ? new Date(loginAt).toISOString().slice(0, 10) : '',
      ip: l.ipAddress || l.IP_ADDRESS || l.ip || '—',
      sortAt: loginAt ? new Date(loginAt).getTime() : 0,
      timestamp: loginAt ? new Date(loginAt).toLocaleString('en-IN') : '—',
    }
  }

  const toggleSort = (key) => {
    setPage(0)
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'timestamp' || key === 'duration' ? 'desc' : 'asc')
    }
  }

  const loadLogs = () => {
    const range = dateRangeForPeriod(period)
    getAuditLogs({ limit: 200, ...range })
      .then((data) => {
        const rows = Array.isArray(data?.logs) ? data.logs : []
        setLogs(rows.map(mapAuditRow))
      })
      .catch(() => setLogs([]))
  }

  useEffect(() => {
    setPage(0)
    loadLogs()
  }, [period])

  const actions = ['All', 'Active', 'Signed out']

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    const mQ = !q || l.user.toLowerCase().includes(q) || l.status.toLowerCase().includes(q) || l.role.toLowerCase().includes(q) || l.ip.includes(q)
    const mR = roleFilter === 'All' || l.role === roleFilter
    const mA = actionFilter === 'All' || l.status === actionFilter
    return mQ && mR && mA
  })

  const sorted = useMemo(() => {
    const list = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    const cmpStr = (a, b) => String(a || '').localeCompare(String(b || ''), undefined, { sensitivity: 'base' }) * dir
    list.sort((a, b) => {
      switch (sortKey) {
        case 'timestamp':
          return (a.sortAt - b.sortAt) * dir
        case 'duration':
          return (a.durationMin - b.durationMin) * dir
        case 'user':
          return cmpStr(a.user, b.user)
        case 'role':
          return cmpStr(a.role, b.role)
        case 'status':
          return cmpStr(a.status, b.status)
        case 'ip':
          return cmpStr(a.ip, b.ip)
        default:
          return 0
      }
    })
    return list
  }, [filtered, sortKey, sortDir])

  const exportCsv = () => {
    if (!sorted.length) {
      toast('warning', 'No data', 'Nothing to export for current filters.')
      return
    }
    const header = ['Signed in', 'User', 'Role', 'Status', 'Duration', 'IP Address']
    const lines = sorted.map((l) =>
      [l.timestamp, l.user, l.role, l.status, l.duration, l.ip]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `login-audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('success', 'Exported', `${sorted.length} row(s) downloaded.`)
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      totalSessions: logs.length,
      activeSessions: logs.filter((l) => l.isActive).length,
      loginsToday: logs.filter((l) => l.loginDay === today).length,
      signedOut: logs.filter((l) => !l.isActive).length,
    }
  }, [logs])

  return (
    <AppLayout pageTitle="Login Sessions">
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:'0 0 4px' }}>Login Sessions</h1>
          <p style={{ fontSize:'13px', color:T.textMuted, fontWeight:500 }}>
            Review sign-in and sign-out activity across the platform.
          </p>
        </div>

        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
          {[
            { label:'Total Sessions', value:stats.totalSessions, tone:'info' },
            { label:'Active Now', value:stats.activeSessions, tone:'success' },
            { label:'Logins Today', value:stats.loginsToday, tone:'warn' },
            { label:'Signed Out', value:stats.signedOut, tone:'neutral' },
          ].map(s => {
            const tok = metricCardTokens(T, s.tone)
            return (
            <div key={s.label} style={{ background:T.card, borderRadius:'10px', padding:'16px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:'28px', fontWeight:900, color:tok.color }}>{s.value}</div>
              <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'4px', fontWeight:600 }}>{s.label}</div>
            </div>
          )})}
        </div>

        {/* Filters */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'14px 18px', marginBottom:'16px', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:1, minWidth:'200px', display:'flex', alignItems:'center', gap:'8px', padding:'0 12px', height:'38px', borderRadius:'8px', background: T.inputBg, border:`1.5px solid ${T.border}` }}>
            <Search size={14} style={{ color:T.textSubtle, flexShrink:0 }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, role, status, IP..."
              style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:T.textPrimary, fontWeight:500, fontFamily:'Inter,sans-serif' }}/>
            {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:T.textSubtle, display:'flex' }}><X size={13}/></button>}
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(0) }}
            aria-label="Filter by role"
            style={selectFieldStyle(T, { padding:'0 12px', height:'38px', borderRadius:'8px', border:`1.5px solid ${T.border}`, fontSize:'13px', fontWeight:500 })}
          >
            {ROLE_FILTER_OPTIONS.map((r) => <option key={r} value={r}>{r === 'All' ? 'All roles' : r}</option>)}
          </select>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            style={selectFieldStyle(T, { padding:'0 12px', height:'38px', borderRadius:'8px', border:`1.5px solid ${T.border}`, fontSize:'13px', fontWeight:500 })}>
            {actions.map(a => <option key={a}>{a}</option>)}
          </select>
          {['today', 'week', 'all'].map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)} style={{ padding:'0 14px', height:'38px', borderRadius:'8px', border:`1px solid ${period === p ? T.primary : T.border}`, background: period === p ? T.primaryLight : T.inputBg, fontWeight:700, fontSize:'12px', cursor:'pointer', fontFamily:'Inter,sans-serif', color: period === p ? T.primary : T.textMuted }}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This week' : 'All'}
            </button>
          ))}
          <button type="button" onClick={exportCsv} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'0 16px', height:'38px', borderRadius:'8px', border:`1px solid ${T.border}`, background: T.inputBg, fontSize:'13px', fontWeight:700, cursor:'pointer', color:T.textSecondary, fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background=T.primaryLight} onMouseLeave={e => e.currentTarget.style.background=T.inputBg}>
            <Download size={14}/> Export CSV
          </button>
        </div>

        {/* Table */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Audit Trail</div>
            <div style={{ fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{sorted.length} records · page {page + 1}/{Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))}</div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background: T.surfaceMuted, borderBottom:`2px solid ${T.border}` }}>
                  {TABLE_COLUMNS.map(({ key, label }) => {
                    const active = sortKey === key
                    const SortIcon = sortDir === 'asc' ? ChevronUp : ChevronDown
                    return (
                      <th key={key} style={{ padding:'4px 8px', textAlign:'left', whiteSpace:'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => toggleSort(key)}
                          style={{
                            display:'inline-flex', alignItems:'center', gap:'4px',
                            padding:'6px 6px', border:'none', background:'transparent',
                            cursor:'pointer', fontFamily:'Inter,sans-serif',
                            fontSize:'11px', fontWeight:700, color: active ? T.primary : T.textSubtle,
                            textTransform:'uppercase', letterSpacing:'0.05em',
                          }}
                        >
                          {label}
                          {active ? <SortIcon size={12} /> : <ChevronDown size={12} style={{ opacity: 0.35 }} />}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map((log, i) => {
                  const statusTone = log.isActive ? 'success' : 'neutral'
                  const rc = roleBadgeTokens(T, log.role)
                  return (
                    <tr key={`${log.id}-${i}`} style={{ borderBottom:`1px solid ${T.borderSubtle}`, background:hovRow===i ? T.hoverBg : '', transition:'background 0.1s' }}
                      onMouseEnter={() => setHovRow(i)} onMouseLeave={() => setHovRow(null)}>
                      <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textMuted, fontWeight:500, whiteSpace:'nowrap', fontFamily:'monospace' }}>{log.timestamp}</td>
                      <td style={{ padding:'11px 14px', fontSize:'13px', fontWeight:700, color:T.textSecondary }}>{log.user}</td>
                      <td style={{ padding:'11px 14px' }}><span style={{ fontSize:'11px', fontWeight:700, padding:'2px 9px', borderRadius:'99px', background:rc.bg, color:rc.color }}>{log.role}</span></td>
                      <td style={{ padding:'11px 14px' }}><span style={statusPillStyle(T, statusTone, { fontSize:'11px', fontWeight:700, padding:'3px 10px' })}>{log.status}</span></td>
                      <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textMuted, fontWeight:600 }}>{log.duration}</td>
                      <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textMuted, fontFamily:'monospace' }}>{log.ip}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'12px 18px', display:'flex', justifyContent:'flex-end', gap:'8px', borderTop:`1px solid ${T.borderSubtle}` }}>
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={{ padding:'6px 14px', borderRadius:'6px', border:`1px solid ${T.border}`, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Prev</button>
            <button type="button" disabled={(page + 1) * PAGE_SIZE >= sorted.length} onClick={() => setPage((p) => p + 1)} style={{ padding:'6px 14px', borderRadius:'6px', border:`1px solid ${T.border}`, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Next</button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
