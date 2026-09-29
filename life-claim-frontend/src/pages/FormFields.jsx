// src/pages/FormFields.jsx
//
// Form Fields admin console (roadmap 2.3). Superuser-only. For each configurable
// form, shows its full field SUPERSET and lets an admin per-deployment Show/Hide
// each field and override Required (Inherit / Required / Optional). Saves to
// form_field_config; the wizard applies it at runtime — a client's own form
// variant without a code fork.

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../components/Toast'
import { listForms, getBaseFields } from '../config/formSchemas'
import formConfig from '../services/formConfigService'
import { actionButtonStyle } from '../ui/pageTokens'
import { SlidersHorizontal } from 'lucide-react'

const errMsg = (e, fb) => e?.response?.data?.message || e?.message || fb
const FORMS = listForms()

function Toggle({ on, onChange, T }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      style={{ width: '42px', height: '24px', borderRadius: '999px', border: 'none', cursor: 'pointer',
               background: on ? (T.primary || '#1D4ED8') : T.border, position: 'relative', transition: 'background 0.15s' }}>
      <span style={{ position: 'absolute', top: '2px', left: on ? '20px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
    </button>
  )
}

export default function FormFields() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [formKey, setFormKey] = useState(FORMS[0]?.key || '')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (key) => {
    setLoading(true)
    try {
      const overrides = await formConfig.getForm(key).catch(() => ({}))
      const base = getBaseFields(key)
      setRows(base.map((f) => {
        const o = overrides[f.name]
        return {
          name: f.name,
          label: f.label,
          type: f.type || 'text',
          baseRequired: !!f.required,
          visible: o ? o.visible !== false : true,
          // required: null = inherit base; true/false = override
          required: o && o.required !== null && o.required !== undefined ? !!o.required : null,
        }
      }))
    } catch (e) {
      toast('error', 'Load failed', errMsg(e, 'Could not load form configuration.'))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { if (formKey) load(formKey) }, [formKey, load])

  const setRow = (name, patch) => setRows((rs) => rs.map((r) => (r.name === name ? { ...r, ...patch } : r)))

  const save = async () => {
    setSaving(true)
    try {
      await formConfig.saveForm(formKey, rows.map((r, i) => ({
        name: r.name, visible: r.visible, required: r.required, sortOrder: i,
      })))
      toast('success', 'Saved', 'Form configuration applied.')
    } catch (e) {
      toast('error', 'Save failed', errMsg(e, 'Could not save form configuration.'))
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    if (!window.confirm('Reset this form to its default fields? Removes all overrides.')) return
    try {
      await formConfig.resetForm(formKey)
      toast('success', 'Reset', 'Reverted to the base form.')
      load(formKey)
    } catch (e) {
      toast('error', 'Reset failed', errMsg(e, 'Could not reset form.'))
    }
  }

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }
  const wrap = { padding: '20px 24px', maxWidth: '1000px', margin: '0 auto' }
  const th = { textAlign: 'left', padding: '10px 14px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.textMuted, borderBottom: `1px solid ${T.border}` }
  const td = { padding: '10px 14px', fontSize: '13px', color: T.textSecondary, borderBottom: `1px solid ${T.borderSubtle}` }

  return (
    <AppLayout pageTitle="Form Fields">
      <div style={wrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <SlidersHorizontal size={20} style={{ color: T.primary }} />
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: T.textPrimary, margin: 0 }}>Form Fields</h1>
        </div>
        <p style={{ fontSize: '13px', color: T.textMuted, marginTop: 0, marginBottom: '18px' }}>
          Configure which fields appear (and which are required) on each form for this deployment. Changes apply at runtime.
        </p>

        {/* Form picker */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {FORMS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFormKey(f.key)}
              style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: formKey === f.key ? 700 : 500, cursor: 'pointer',
                       border: `1px solid ${formKey === f.key ? (T.primary || '#1D4ED8') : T.border}`,
                       background: formKey === f.key ? (T.primary || '#1D4ED8') : 'transparent',
                       color: formKey === f.key ? '#fff' : T.textSecondary }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ ...card, padding: '40px', textAlign: 'center', color: T.textMuted }}>Loading…</div>
        ) : (
          <div style={card}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Field</th>
                  <th style={th}>Type</th>
                  <th style={{ ...th, width: '100px' }}>Visible</th>
                  <th style={{ ...th, width: '190px' }}>Required</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} style={{ opacity: r.visible ? 1 : 0.55 }}>
                    <td style={td}><strong>{r.label}</strong><div style={{ fontSize: '11px', color: T.textSubtle }}><code>{r.name}</code></div></td>
                    <td style={td}>{r.type}</td>
                    <td style={td}><Toggle on={r.visible} onChange={(v) => setRow(r.name, { visible: v })} T={T} /></td>
                    <td style={td}>
                      <select
                        value={r.required === null ? 'inherit' : r.required ? 'required' : 'optional'}
                        onChange={(e) => {
                          const v = e.target.value
                          setRow(r.name, { required: v === 'inherit' ? null : v === 'required' })
                        }}
                        disabled={!r.visible}
                        style={{ height: '34px', padding: '0 8px', borderRadius: '7px', border: `1px solid ${T.border}`, background: T.inputBg, color: T.textPrimary, fontSize: '13px' }}
                      >
                        <option value="inherit">Inherit ({r.baseRequired ? 'Required' : 'Optional'})</option>
                        <option value="required">Required</option>
                        <option value="optional">Optional</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button type="button" onClick={reset} style={actionButtonStyle(T, 'secondary')}>Reset to defaults</button>
          <button type="button" onClick={save} disabled={saving || loading} style={actionButtonStyle(T, 'primary')}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
