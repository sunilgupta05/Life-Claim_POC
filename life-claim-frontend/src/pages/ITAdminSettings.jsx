// src/pages/ITAdminSettings.jsx
//
// IT Administrator settings (roadmap 3.5). Superuser-only. A curated, grouped form
// over the runtime config service (0.3): integration URLs (also drives the 3.2
// runtime-editable endpoints), timeouts/resilience knobs and the log level. Edits
// save to app_config and hot-reload immediately — no restart, no code change.

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../components/Toast'
import systemConfig from '../services/systemConfigService'
import { actionButtonStyle } from '../ui/pageTokens'
import { ServerCog, RotateCcw } from 'lucide-react'

const errMsg = (e, fb) => e?.response?.data?.message || e?.message || fb

const SOURCE_STYLE = {
  db: { label: 'custom', fg: '#1E40AF', bg: '#DBEAFE' },
  env: { label: '.env', fg: '#3F3F46', bg: '#E4E4E7' },
  default: { label: 'default', fg: '#3F3F46', bg: '#F4F4F5' },
}

function SourceTag({ source }) {
  const s = SOURCE_STYLE[source] || SOURCE_STYLE.default
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
                   color: s.fg, background: s.bg, borderRadius: '5px', padding: '2px 6px' }}>{s.label}</span>
  )
}

export default function ITAdminSettings() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [groups, setGroups] = useState([])
  const [values, setValues] = useState({})   // key -> current input value
  const [meta, setMeta] = useState({})        // key -> { source, default, value }
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await systemConfig.getSettings()
      setGroups(res.groups || [])
      const v = {}, m = {}
      for (const g of res.groups || []) {
        for (const it of g.items) { v[it.key] = it.value ?? ''; m[it.key] = it }
      }
      setValues(v)
      setMeta(m)
    } catch (e) {
      toast('error', 'Load failed', errMsg(e, 'Could not load settings.'))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const dirty = (key) => String(values[key] ?? '') !== String(meta[key]?.value ?? '')

  const save = async (key) => {
    setSavingKey(key)
    try {
      await systemConfig.updateSetting(key, values[key])
      toast('success', 'Saved', `${meta[key]?.label || key} applied.`)
      setMeta((m) => ({ ...m, [key]: { ...m[key], value: values[key], source: 'db' } }))
    } catch (e) {
      toast('error', 'Save failed', errMsg(e, 'Could not save setting.'))
    } finally {
      setSavingKey('')
    }
  }

  const reset = async (key) => {
    if (!window.confirm(`Revert ${meta[key]?.label || key} to its .env/default value?`)) return
    try {
      await systemConfig.resetSetting(key)
      toast('success', 'Reverted', `${meta[key]?.label || key} reset.`)
      load()
    } catch (e) {
      toast('error', 'Reset failed', errMsg(e, 'Could not revert setting.'))
    }
  }

  const wrap = { padding: '20px 24px', maxWidth: '900px', margin: '0 auto' }
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '18px' }
  const input = { height: '36px', padding: '0 10px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.inputBg, color: T.textPrimary, fontSize: '13px', width: '100%' }

  const renderField = (it) => {
    if (it.type === 'boolean') {
      return (
        <select value={String(values[it.key])} onChange={(e) => setValues((v) => ({ ...v, [it.key]: e.target.value }))} style={input}>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      )
    }
    if (it.type === 'enum') {
      return (
        <select value={String(values[it.key])} onChange={(e) => setValues((v) => ({ ...v, [it.key]: e.target.value }))} style={input}>
          {(it.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }
    return (
      <input type={it.type === 'number' ? 'number' : 'text'} value={values[it.key] ?? ''}
        onChange={(e) => setValues((v) => ({ ...v, [it.key]: e.target.value }))}
        placeholder={it.default} style={input} />
    )
  }

  return (
    <AppLayout pageTitle="System Settings">
      <div style={wrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <ServerCog size={20} style={{ color: T.primary }} />
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: T.textPrimary, margin: 0 }}>System Settings</h1>
        </div>
        <p style={{ fontSize: '13px', color: T.textMuted, marginTop: 0, marginBottom: '18px' }}>
          Edit integration endpoints, timeouts/resilience and logging at runtime. Changes apply immediately — no restart required.
        </p>

        {loading ? (
          <div style={{ ...card, padding: '40px', textAlign: 'center', color: T.textMuted }}>Loading…</div>
        ) : (
          groups.map((g) => (
            <div key={g.name} style={card}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, fontSize: '13px', fontWeight: 800, color: T.textPrimary, background: T.bgSubtle || 'transparent' }}>
                {g.name}
              </div>
              <div>
                {g.items.map((it) => (
                  <div key={it.key} style={{ display: 'grid', gridTemplateColumns: '1fr 260px auto', gap: '12px', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${T.borderSubtle}` }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: T.textPrimary }}>{it.label}</span>
                        <SourceTag source={meta[it.key]?.source} />
                      </div>
                      <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '2px' }}>{it.help}</div>
                      <div style={{ fontSize: '10px', color: T.textSubtle }}><code>{it.key}</code></div>
                    </div>
                    <div>{renderField(it)}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => save(it.key)} disabled={!dirty(it.key) || savingKey === it.key}
                        style={{ ...actionButtonStyle(T, 'primary'), padding: '7px 12px', fontSize: '12px', opacity: dirty(it.key) ? 1 : 0.5 }}>
                        {savingKey === it.key ? '…' : 'Save'}
                      </button>
                      {meta[it.key]?.source === 'db' && (
                        <button type="button" onClick={() => reset(it.key)} title="Revert to .env/default"
                          style={{ ...actionButtonStyle(T, 'secondary'), padding: '7px 9px', fontSize: '12px' }}>
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  )
}
