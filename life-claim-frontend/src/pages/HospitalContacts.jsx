import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import {
  searchHospitalContacts,
  addHospitalEmail,
  addHospitalFax,
  addHospitalContact,
  deleteHospitalEmail,
  deleteHospitalFax,
  deleteHospitalContact,
  updateHospitalEmail,
  updateHospitalFax,
  updateHospitalContactRow,
} from '../services/hospitalContactService'
import {
  fetchGeneralInfo,
  fetchProcessAutomated,
  fetchMarketing,
  updateGeneralInfo,
  addMarketing,
  deleteMarketing,
} from '../services/generalInfoService'
import { Building2, Search, Plus, Trash2, Pencil } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function ContactSection({ title, rows, valueKey, idKey, onDelete, onAdd, onUpdate, addLabel, addPlaceholder, hospitalId }) {
  const { tokens: T } = useTheme()
  const [value, setValue] = useState('')
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontWeight: 700, fontSize: '13px', color: T.textPrimary, marginBottom: '10px' }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '8px' }}>None on file.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px' }}>
          {rows.map((row, i) => {
            const val = row[valueKey] ?? row[valueKey?.toUpperCase?.()] ?? Object.values(row)[0]
            const rowId = row[idKey] ?? row.HOSPITAL_ID ?? hospitalId
            const isEdit = editing === i
            return (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: T.hoverBg, borderRadius: '8px', marginBottom: '6px', border: `1px solid ${T.border}`, gap: '8px' }}>
                {isEdit ? (
                  <input value={editVal} onChange={(e) => setEditVal(e.target.value)} style={{ flex: 1, height: '32px', padding: '0 8px', borderRadius: '6px', border: `1px solid ${T.border}`, fontSize: '13px' }} />
                ) : (
                  <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>{String(val)}</span>
                )}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {onUpdate && (
                    isEdit ? (
                      <button type="button" onClick={async () => { await onUpdate(rowId, editVal, row); setEditing(null) }} style={{ border: 'none', background: T.primary, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
                    ) : (
                      <button type="button" onClick={() => { setEditing(i); setEditVal(String(val)) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.primary }} title="Edit"><Pencil size={14} /></button>
                    )
                  )}
                  <button type="button" onClick={() => onDelete(val)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.danger }} title="Delete"><Trash2 size={14} /></button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={addPlaceholder} style={{ flex: 1, height: '36px', padding: '0 10px', borderRadius: '8px', border: `1px solid ${T.border}`, fontSize: '13px', fontFamily: 'Inter,sans-serif' }} />
        <button type="button" onClick={async () => { if (!value.trim()) return; await onAdd(value.trim()); setValue('') }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 14px', height: '36px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
          <Plus size={14} /> {addLabel}
        </button>
      </div>
    </div>
  )
}

export default function HospitalContacts() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [pageTab, setPageTab] = useState('contacts')
  const [hospitalId, setHospitalId] = useState('')
  const [data, setData] = useState({ email: [], fax: [], contact: [] })
  const [genInfo, setGenInfo] = useState([])
  const [processAuto, setProcessAuto] = useState([])
  const [marketing, setMarketing] = useState([])
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (!hospitalId.trim()) {
      toast('warning', 'Hospital ID', 'Enter a hospital ID to search.')
      return
    }
    setLoading(true)
    const id = hospitalId.trim()
    try {
      const [contacts, gi, pa, mkt] = await Promise.all([
        searchHospitalContacts(id),
        fetchGeneralInfo(id).catch(() => []),
        fetchProcessAutomated(id).catch(() => []),
        fetchMarketing(id).catch(() => []),
      ])
      setData(contacts)
      setGenInfo(Array.isArray(gi) ? gi : [])
      setProcessAuto(Array.isArray(pa) ? pa : [])
      setMarketing(Array.isArray(mkt) ? mkt : [])
      toast('success', 'Loaded', `Hospital ${id} loaded.`)
    } catch (e) {
      toast('error', 'Search failed', e.message)
      setData({ email: [], fax: [], contact: [] })
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => search()

  const saveGenInfo = async () => {
    try {
      await updateGeneralInfo(hospitalId.trim(), genInfo, [])
      toast('success', 'Saved', 'General info update sent.')
    } catch (e) {
      toast('error', 'Save failed', e.message)
    }
  }

  return (
    <AppLayout pageTitle="Hospital Contacts" pageSubtitle="Contacts, general info & marketing">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif', maxWidth: '900px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['contacts', 'general'].map((t) => (
            <button key={t} type="button" onClick={() => setPageTab(t)} style={{ padding: '10px 16px', borderRadius: '8px', border: pageTab === t ? 'none' : `1px solid ${T.border}`, background: pageTab === t ? T.primary : T.hoverBg, color: pageTab === t ? '#fff' : T.textSecondary, fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textTransform: 'capitalize' }}>
              {t === 'contacts' ? 'Contacts' : 'General & marketing'}
            </button>
          ))}
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Building2 size={20} style={{ color: T.primary }} />
            <span style={{ fontWeight: 800, fontSize: '15px', color: T.textPrimary }}>Search hospital</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} placeholder="Hospital ID" onKeyDown={(e) => e.key === 'Enter' && search()} style={{ flex: 1, height: '42px', padding: '0 12px', borderRadius: '8px', border: `1.5px solid ${T.border}`, fontSize: '14px', fontWeight: 600, fontFamily: 'Inter,sans-serif' }} />
            <button type="button" onClick={search} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 20px', height: '42px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              <Search size={16} /> {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>

        {hospitalId && pageTab === 'contacts' && (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '20px' }}>
            <ContactSection title="Email addresses" rows={data.email} valueKey="hospital_email" idKey="hospital_id" hospitalId={hospitalId} onDelete={async (v) => { await deleteHospitalEmail(v); refresh() }} onAdd={async (email) => { await addHospitalEmail(hospitalId.trim(), email); refresh() }} onUpdate={async (hid, val) => { await updateHospitalEmail(hid || hospitalId.trim(), { hospital_email: val }); refresh() }} addLabel="Add email" addPlaceholder="email@hospital.com" />
            <ContactSection title="Fax numbers" rows={data.fax} valueKey="fax_no" idKey="hospital_id" hospitalId={hospitalId} onDelete={async (v) => { await deleteHospitalFax(v); refresh() }} onAdd={async (fax) => { await addHospitalFax(hospitalId.trim(), fax); refresh() }} onUpdate={async (hid, val) => { await updateHospitalFax(hid || hospitalId.trim(), { fax_no: val }); refresh() }} addLabel="Add fax" addPlaceholder="Fax number" />
            <ContactSection title="Contact numbers" rows={data.contact} valueKey="hospital_phone" idKey="hospital_id" hospitalId={hospitalId} onDelete={async (v) => { await deleteHospitalContact(v); refresh() }} onAdd={async (contact) => { await addHospitalContact(hospitalId.trim(), contact); refresh() }} onUpdate={async (hid, val) => { await updateHospitalContactRow(hid || hospitalId.trim(), { hospital_phone: val }); refresh() }} addLabel="Add phone" addPlaceholder="Phone number" />
          </div>
        )}

        {hospitalId && pageTab === 'general' && (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>General information</div>
            {genInfo.length === 0 && processAuto.length === 0 ? (
              <div style={{ fontSize: '13px', color: T.textMuted, marginBottom: '16px' }}>No general info rows (table may be empty for this hospital).</div>
            ) : (
              <pre style={{ fontSize: '11px', background: T.hoverBg, padding: '12px', borderRadius: '8px', overflow: 'auto', maxHeight: '160px', marginBottom: '16px' }}>{JSON.stringify({ genInfo, processAuto }, null, 2)}</pre>
            )}
            <button type="button" onClick={saveGenInfo} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', marginBottom: '24px' }}>Save general info</button>

            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>Marketing initiatives</div>
            {marketing.length === 0 ? (
              <div style={{ fontSize: '13px', color: T.textMuted }}>No marketing records.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {marketing.map((m, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: '8px', marginBottom: '6px', fontSize: '13px' }}>
                    <span>{m.campaign_type || m.CAMPAIGN_TYPE || JSON.stringify(m)}</span>
                    <button type="button" onClick={async () => { await deleteMarketing(m.campaign_type || m.CAMPAIGN_TYPE); refresh() }} style={{ border: 'none', background: 'none', color: T.danger, cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={async () => { await addMarketing({ hospital_id: hospitalId.trim(), campaign_type: `Campaign_${Date.now()}` }); refresh() }} style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.hoverBg, fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>+ Add marketing row</button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
