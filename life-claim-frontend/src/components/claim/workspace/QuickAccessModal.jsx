import { useState, useEffect } from 'react'
import { useWorkspaceTokens, EditableField } from './workspaceUi'
import { normalizeDateForInput } from '../../../util/workspaceDisplay'

const WHATSAPP_OPTIONS = ['Yes', 'No']
const PROOF_TYPE_OPTIONS = ['Identity', 'Address', 'Age', 'Death Certificate', 'Medical', 'Financial', 'Legal']
const DOCUMENT_TYPE_OPTIONS = ['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving Licence', 'Ration Card', 'Birth Certificate', 'Others']
const COUNTRY_OPTIONS = ['India', 'Other']
const NATIONALITY_OPTIONS = ['Indian', 'Other']

function SectionTitle({ children, first }) {
  const WS = useWorkspaceTokens()
  return (
    <div style={{ gridColumn: '1 / -1', fontSize: '10px', fontWeight: 800, color: WS.textSubtle, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: first ? 0 : '2px', paddingBottom: '2px', borderBottom: `1px solid ${WS.borderSubtle || WS.border}` }}>
      {children}
    </div>
  )
}

function hasValue(...vals) {
  return vals.some((v) => v != null && String(v).trim() !== '')
}

/** Assessor quick edits → policyData (intimation, claimant, proof, witness). */
export default function QuickAccessModal({ open, onClose, policyData, onSave, disabled }) {
  const WS = useWorkspaceTokens()
  const [form, setForm] = useState({})

  useEffect(() => {
    if (!open || !policyData) return
    const i = policyData.intimationDetails || {}
    const c0 = (policyData.claimantDetails || [])[0] || {}
    const p0 = (policyData.proofDetailsTable || [])[0] || {}
    const w0 = (policyData.witnessDetailsTable || [])[0] || {}
    setForm({
      intimationDate: normalizeDateForInput(i.intimationDate || i.initiationDate),
      whatsappFlag: i.whatsappFlag || '',
      dateOfAccident: normalizeDateForInput(i.dateOfAccident || i.accidentDate),
      claimantFlat: c0.flat || '',
      claimantDistrict: c0.state || c0.district || '',
      claimantRoad: c0.road || '',
      claimantArea: c0.area || '',
      claimantCity: c0.city || c0.resCity || '',
      claimantPincode: c0.pincode || c0.pinCode || '',
      claimantCountry: c0.country || 'India',
      claimantNationality: c0.nationality || 'Indian',
      claimantPan: c0.panNo || c0.pan || '',
      proofType: p0.proofType || '',
      documentType: p0.documentType || '',
      documentId: p0.documentId || p0.documentNo || '',
      issueDate: normalizeDateForInput(p0.issueDate),
      witnessInstanceNo: w0.instanceNo != null && w0.instanceNo !== '' ? String(w0.instanceNo) : '',
    })
  }, [open, policyData])

  if (!open) return null

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = () => {
    const claimants = [...(policyData.claimantDetails || [])]
    const claimantPatch = {
      flat: form.claimantFlat,
      road: form.claimantRoad,
      area: form.claimantArea,
      city: form.claimantCity,
      state: form.claimantDistrict,
      pincode: form.claimantPincode,
      pinCode: form.claimantPincode,
      country: form.claimantCountry,
      nationality: form.claimantNationality,
      panNo: form.claimantPan,
    }
    const hasClaimantEdits = hasValue(...Object.values(claimantPatch))
    if (claimants.length) {
      claimants[0] = { ...claimants[0], ...claimantPatch }
    } else if (hasClaimantEdits) {
      claimants.push(claimantPatch)
    }

    const proofRows = [...(policyData.proofDetailsTable || [])]
    const proofPatch = {
      proofType: form.proofType,
      documentType: form.documentType,
      documentId: form.documentId,
      issueDate: form.issueDate,
    }
    if (hasValue(...Object.values(proofPatch))) {
      if (proofRows.length) proofRows[0] = { ...proofRows[0], ...proofPatch }
      else proofRows.push(proofPatch)
    }

    const witnessRows = [...(policyData.witnessDetailsTable || [])]
    if (hasValue(form.witnessInstanceNo)) {
      const instanceNo = form.witnessInstanceNo
      if (witnessRows.length) {
        witnessRows[0] = { ...witnessRows[0], instanceNo }
      } else {
        witnessRows.push({ instanceNo })
      }
    }

    onSave({
      intimationDetails: {
        ...(policyData.intimationDetails || {}),
        intimationDate: form.intimationDate,
        whatsappFlag: form.whatsappFlag,
        dateOfAccident: form.dateOfAccident,
        accidentDate: form.dateOfAccident,
      },
      claimantDetails: claimants,
      ...(proofRows.length ? { proofDetailsTable: proofRows } : {}),
      ...(witnessRows.length ? { witnessDetailsTable: witnessRows } : {}),
    })
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: WS.card, borderRadius: '16px', width: 'min(1080px, 96vw)', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${WS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '15px' }}>Quick Access</span>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 12px', alignContent: 'start' }}>
          <SectionTitle first>Intimation</SectionTitle>
          <EditableField label="Intimation Date" value={form.intimationDate} onChange={(v) => set('intimationDate', v)} disabled={disabled} type="date" />
          <EditableField label="WhatsApp Flag" value={form.whatsappFlag} onChange={(v) => set('whatsappFlag', v)} disabled={disabled} options={WHATSAPP_OPTIONS} />
          <EditableField label="Date of Accident" value={form.dateOfAccident} onChange={(v) => set('dateOfAccident', v)} disabled={disabled} type="date" />

          <SectionTitle>Claimant address</SectionTitle>
          <EditableField label="Claimant Flat No" value={form.claimantFlat} onChange={(v) => set('claimantFlat', v)} disabled={disabled} />
          <EditableField label="Claimant District" value={form.claimantDistrict} onChange={(v) => set('claimantDistrict', v)} disabled={disabled} />
          <EditableField label="Claimant Road" value={form.claimantRoad} onChange={(v) => set('claimantRoad', v)} disabled={disabled} />
          <EditableField label="Claimant Area/Landmark" value={form.claimantArea} onChange={(v) => set('claimantArea', v)} disabled={disabled} />
          <EditableField label="Claimant City" value={form.claimantCity} onChange={(v) => set('claimantCity', v)} disabled={disabled} />
          <EditableField label="Claimant Pincode" value={form.claimantPincode} onChange={(v) => set('claimantPincode', v)} disabled={disabled} />
          <EditableField label="Claimant Country" value={form.claimantCountry} onChange={(v) => set('claimantCountry', v)} disabled={disabled} options={COUNTRY_OPTIONS} />
          <EditableField label="Claimant Nationality" value={form.claimantNationality} onChange={(v) => set('claimantNationality', v)} disabled={disabled} options={NATIONALITY_OPTIONS} />
          <EditableField label="Claimant Pan No" value={form.claimantPan} onChange={(v) => set('claimantPan', v)} disabled={disabled} />

          <SectionTitle>Proof & witness</SectionTitle>
          <EditableField label="Proof Type" value={form.proofType} onChange={(v) => set('proofType', v)} disabled={disabled} options={PROOF_TYPE_OPTIONS} />
          <EditableField label="Document Type" value={form.documentType} onChange={(v) => set('documentType', v)} disabled={disabled} options={DOCUMENT_TYPE_OPTIONS} />
          <EditableField label="Document Id" value={form.documentId} onChange={(v) => set('documentId', v)} disabled={disabled} />
          <EditableField label="Issue Date" value={form.issueDate} onChange={(v) => set('issueDate', v)} disabled={disabled} type="date" />
          <EditableField label="Witness Instance No" value={form.witnessInstanceNo} onChange={(v) => set('witnessInstanceNo', v)} disabled={disabled} />
        </div>
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${WS.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${WS.border}`, background: WS.hoverBg, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancel</button>
          <button type="button" onClick={handleSave} disabled={disabled} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: disabled ? '#CBD5E1' : WS.primary, color: '#fff', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif' }}>Save</button>
        </div>
      </div>
    </div>
  )
}
