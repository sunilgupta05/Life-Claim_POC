// src/pages/Branding.jsx
//
// Per-deployment branding admin (roadmap 2.1). Superuser-only (gated by the
// /superuser/branding route). Edits the active org_profile: name/product/tagline,
// brand colours (live preview via CSS variables), and logo upload. "Set once per
// install" — saving persists to config and re-hydrates the app.

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../components/Toast'
import branding from '../services/brandingService'
import { COMPANY, hydrateCompanyBrand } from '../config/companyBrand'
import { applyBrandColors } from '../config/brandTheme'
import { actionButtonStyle, fieldInputStyle } from '../ui/pageTokens'
import { Palette, UploadCloud } from 'lucide-react'

const COLOR_FIELDS = [
  ['primary', 'Primary'],
  ['accent', 'Accent'],
  ['text', 'Text'],
  ['muted', 'Muted'],
  ['border', 'Border'],
  ['headerBg', 'Header background'],
]
const TEXT_FIELDS = [
  ['name', 'Organization name'],
  ['product', 'Product name'],
  ['tagline', 'Tagline'],
  ['email', 'Support email'],
  ['phone', 'Support phone'],
  ['website', 'Website'],
]
const errMsg = (e, fb) => e?.response?.data?.message || e?.message || fb

export default function Branding() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', product: '', tagline: '', email: '', phone: '', website: '', logoPath: '', colors: {} })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = await branding.getOrgProfile()
      setForm({
        name: p.name || '', product: p.product || '', tagline: p.tagline || '',
        email: p.email || '', phone: p.phone || '', website: p.website || '',
        logoPath: p.logoPath || '', colors: { ...(p.colors || {}) },
      })
    } catch (e) {
      toast('error', 'Load failed', errMsg(e, 'Could not load branding.'))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const setColor = (k, v) => {
    setForm((p) => {
      const colors = { ...p.colors, [k]: v }
      applyBrandColors(colors, { silent: true }) // instant live preview across the app
      return { ...p, colors }
    })
  }

  const onLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { logoPath } = await branding.uploadLogo(file)
      setField('logoPath', logoPath)
      toast('success', 'Logo uploaded', 'Remember to Save to apply it.')
    } catch (err) {
      toast('error', 'Upload failed', errMsg(err, 'Could not upload logo.'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await branding.updateOrgProfile(form)
      await hydrateCompanyBrand()            // re-pull into COMPANY
      applyBrandColors(COMPANY.colors)       // notify → ThemeContext re-renders
      toast('success', 'Branding saved', 'Applied across the app.')
    } catch (e) {
      toast('error', 'Save failed', errMsg(e, 'Could not save branding.'))
    } finally {
      setSaving(false)
    }
  }

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px' }
  const wrap = { padding: '20px 24px', maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '20px' }
  const label = { display: 'block', fontSize: '12px', fontWeight: 700, color: T.textMuted, marginBottom: '6px' }

  return (
    <AppLayout pageTitle="Branding">
      <div style={wrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Palette size={20} style={{ color: T.primary }} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: T.textPrimary, margin: 0 }}>Branding</h1>
            <p style={{ fontSize: '13px', color: T.textMuted, margin: '2px 0 0' }}>
              Set this deployment's name, colours and logo. Applies across the app after Save.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ ...card, textAlign: 'center', color: T.textMuted }}>Loading…</div>
        ) : (
          <>
            {/* Organization details */}
            <div style={card}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: T.textPrimary, marginTop: 0 }}>Organization</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                {TEXT_FIELDS.map(([k, lbl]) => (
                  <div key={k}>
                    <label style={label}>{lbl}</label>
                    <input value={form[k]} onChange={(e) => setField(k, e.target.value)} style={fieldInputStyle(T)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Logo */}
            <div style={card}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: T.textPrimary, marginTop: 0 }}>Logo</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ width: '120px', height: '60px', border: `1px dashed ${T.border}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.pageBg, overflow: 'hidden' }}>
                  {form.logoPath
                    ? <img src={form.logoPath} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: '11px', color: T.textSubtle }}>No logo</span>}
                </div>
                <label style={{ ...actionButtonStyle(T, 'secondary', { size: 'sm' }), cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <UploadCloud size={15} /> {uploading ? 'Uploading…' : 'Upload logo'}
                  <input type="file" accept="image/*" onChange={onLogo} disabled={uploading} style={{ display: 'none' }} />
                </label>
                <span style={{ fontSize: '12px', color: T.textSubtle }}>PNG/JPG/SVG, up to 2MB.</span>
              </div>
            </div>

            {/* Colours + live preview */}
            <div style={card}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: T.textPrimary, marginTop: 0 }}>Colours</h2>
              <p style={{ fontSize: '12px', color: T.textSubtle, marginTop: 0 }}>Changes preview live below. Save to keep them.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                {COLOR_FIELDS.map(([k, lbl]) => (
                  <div key={k}>
                    <label style={label}>{lbl}</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color" value={form.colors[k] || '#000000'} onChange={(e) => setColor(k, e.target.value)}
                        style={{ width: '38px', height: '34px', padding: 0, border: `1px solid ${T.border}`, borderRadius: '6px', background: 'none', cursor: 'pointer' }} />
                      <input value={form.colors[k] || ''} onChange={(e) => setColor(k, e.target.value)} placeholder="#1D4ED8" style={{ ...fieldInputStyle(T), flex: 1 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live preview strip */}
              <div style={{ marginTop: '18px', padding: '16px', borderRadius: '10px', border: `1px solid ${T.border}`, display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: T.textMuted }}>Preview:</span>
                <button type="button" style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '13px' }}>Primary button</button>
                <span style={{ padding: '4px 10px', borderRadius: '999px', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 700 }}>Accent</span>
                <a href="#preview" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '13px' }}>A link</a>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={load} style={actionButtonStyle(T, 'secondary')}>Reset</button>
              <button type="button" onClick={save} disabled={saving} style={actionButtonStyle(T, 'primary')}>
                {saving ? 'Saving…' : 'Save branding'}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
