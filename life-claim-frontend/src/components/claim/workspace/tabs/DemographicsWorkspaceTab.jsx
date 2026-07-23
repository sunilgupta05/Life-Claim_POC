import { useState } from 'react'
import { formatProductName } from '../../../../util/formatProductName'
import { Accordion, ROField, EditableField, SimpleTable } from '../workspaceUi'
import EagleScreenSection from '../EagleScreenSection'

export default function DemographicsWorkspaceTab({ claim, demogs, canEdit, onPatch, onOpenFraud }) {
  const [open, setOpen] = useState('intimation')
  const toggle = (id) => setOpen((p) => (p === id ? '' : id))
  const intimation = demogs?.intimation || {}
  const cause = demogs?.cause || {}
  const la = demogs?.lifeAssured || {}
  const trap = demogs?.trap || {}
  const established = demogs?.establishedCause || {}
  const contact = demogs?.contact || {}
  const claimants = demogs?.claimant || []

  const patchIntimation = (key, val) => onPatch({ intimationDetails: { ...intimation, [key]: val } })
  const patchEstablished = (key, val) => onPatch({ establishedCauseDetails: { ...established, [key]: val } })
  const patchLa = (key, val) => onPatch({ lifeAssuredDetails: { ...la, [key]: val } })
  const patchContact = (key, val) => onPatch({ contactDetails: { ...contact, [key]: val } })
  const patchClaimant0 = (key, val) => {
    const rows = [...claimants]
    rows[0] = { ...(rows[0] || {}), [key]: val }
    onPatch({ claimantDetails: rows })
  }

  const c0 = claimants[0] || {}

  return (
    <div>
      <Accordion title="Intimation details" subtitle="Dates, source, death certificate" open={open === 'intimation'} onToggle={() => toggle('intimation')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {canEdit ? (
            <>
              <EditableField label="Intimation date" value={intimation.intimationDate} onChange={(v) => patchIntimation('intimationDate', v)} type="date" />
              <EditableField label="Source" value={intimation.source} onChange={(v) => patchIntimation('source', v)} options={['Branch', 'Direct', 'Email', 'Agent', 'Website']} />
              <EditableField label="Place of death" value={intimation.placeOfDeath} onChange={(v) => patchIntimation('placeOfDeath', v)} />
              <EditableField label="Date of death / event" value={intimation.dateOfDeath || intimation.dateOfDeathEvent} onChange={(v) => patchIntimation('dateOfDeath', v)} type="date" />
              <EditableField label="Death certificate" value={intimation.deathCertificate} onChange={(v) => patchIntimation('deathCertificate', v)} />
              <EditableField label="FIR / PM" value={intimation.firPmReceived} onChange={(v) => patchIntimation('firPmReceived', v)} />
            </>
          ) : (
            <>
              <ROField label="Intimation date" value={intimation.intimationDate || claim?.intimationDate} />
              <ROField label="Source" value={intimation.source || claim?.source} />
              <ROField label="Place of death" value={intimation.placeOfDeath || claim?.placeOfDeath} />
              <ROField label="Date of death / event" value={intimation.dateOfDeath || intimation.dateOfDeathEvent} />
              <ROField label="Death certificate" value={intimation.deathCertificate} />
              <ROField label="FIR / PM" value={intimation.firPmReceived} />
            </>
          )}
        </div>
      </Accordion>

      <Accordion title="Trap score" subtitle="Read-only from registration" open={open === 'trap'} onToggle={() => toggle('trap')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <ROField label="Trap score" value={trap.trapScore || trap.score} />
          <ROField label="Risk" value={trap.trapRisk || trap.risk} />
          <ROField label="Date" value={trap.trapDate} />
        </div>
      </Accordion>

      <Accordion title="Declared cause of death / event" open={open === 'declared'} onToggle={() => toggle('declared')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {canEdit ? (
            <>
              <EditableField label="Cause code" value={cause.causeCode || claim?.causeCode} onChange={(v) => onPatch({ establishedCauseDetails: { ...established, causeCode: v } })} />
              <EditableField label="Description" value={cause.causeDescription || claim?.causeDescription} onChange={(v) => onPatch({ establishedCauseDetails: { ...established, causeDescription: v } })} />
              <EditableField label="Category" value={cause.causeCategory || claim?.causeCategory} onChange={(v) => onPatch({ establishedCauseDetails: { ...established, causeCategory: v } })} />
            </>
          ) : (
            <>
              <ROField label="Cause code" value={cause.causeCode || claim?.causeCode} />
              <ROField label="Description" value={cause.causeDescription || claim?.causeDescription} />
              <ROField label="Category" value={cause.causeCategory || claim?.causeCategory} />
            </>
          )}
        </div>
      </Accordion>

      <Accordion title="Established cause of death" open={open === 'established'} onToggle={() => toggle('established')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {canEdit ? (
            <>
              <EditableField label="Established cause" value={established.establishedCause || established.causeDescription} onChange={(v) => patchEstablished('establishedCause', v)} />
              <EditableField label="Remarks" value={established.remarks} onChange={(v) => patchEstablished('remarks', v)} />
            </>
          ) : (
            <>
              <ROField label="Established cause" value={established.establishedCause} />
              <ROField label="Remarks" value={established.remarks} />
            </>
          )}
        </div>
      </Accordion>

      <Accordion title="Payee details" open={open === 'payee'} onToggle={() => toggle('payee')}>
        <SimpleTable columns={[{ key: 'name', label: 'Name' }, { key: 'relation', label: 'Relation' }, { key: 'accountNo', label: 'Account' }]} rows={demogs?.payee || []} />
      </Accordion>

      <Accordion title="Claimant details" open={open === 'claimant'} onToggle={() => toggle('claimant')}>
        {canEdit ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <EditableField label="Name" value={c0.name || c0.claimantName} onChange={(v) => patchClaimant0('name', v)} />
            <EditableField label="Relation" value={c0.relation} onChange={(v) => patchClaimant0('relation', v)} />
            <EditableField label="Mobile" value={c0.mobileNo || c0.mobile} onChange={(v) => patchClaimant0('mobileNo', v)} />
            <EditableField label="PAN" value={c0.panNo || c0.pan} onChange={(v) => patchClaimant0('panNo', v)} />
            <EditableField label="City" value={c0.city || c0.resCity} onChange={(v) => patchClaimant0('city', v)} />
            <EditableField label="Pincode" value={c0.pincode || c0.pinCode} onChange={(v) => patchClaimant0('pinCode', v)} />
          </div>
        ) : null}
        <SimpleTable columns={[{ key: 'name', label: 'Name' }, { key: 'relation', label: 'Relation' }, { key: 'mobileNo', label: 'Mobile' }, { key: 'panNo', label: 'PAN' }]} rows={claimants.map((c) => ({ ...c, name: c.name || c.claimantName }))} />
      </Accordion>

      <Accordion title="Life assured" open={open === 'la'} onToggle={() => toggle('la')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {canEdit ? (
            <>
              <EditableField label="Name" value={la.name || la.laName || claim?.laName} onChange={(v) => patchLa('name', v)} />
              <EditableField label="DOB" value={la.dob || la.dateOfBirth || claim?.laDob} onChange={(v) => patchLa('dob', v)} type="date" />
              <EditableField label="Gender" value={la.gender || claim?.laGender} onChange={(v) => patchLa('gender', v)} />
              <EditableField label="City" value={la.city || la.city1 || la.resCity || claim?.laCity} onChange={(v) => patchLa('city1', v)} />
              <EditableField label="State" value={la.state || la.state1 || la.resState || claim?.laState} onChange={(v) => patchLa('state1', v)} />
              <EditableField label="Mobile" value={la.mobileNo || la.mobileNo1 || claim?.laMobile} onChange={(v) => patchLa('mobileNo1', v)} />
            </>
          ) : (
            <>
              <ROField label="Name" value={la.name || la.laName || claim?.laName} />
              <ROField label="DOB" value={la.dob || la.dateOfBirth || claim?.laDob} />
              <ROField label="Gender" value={la.gender || claim?.laGender} />
              <ROField label="City" value={la.city || la.city1 || la.resCity || claim?.laCity} />
              <ROField label="State" value={la.state || la.state1 || la.resState || claim?.laState} />
            </>
          )}
        </div>
      </Accordion>

      <Accordion title="Agent repudiation history" open={open === 'agent'} onToggle={() => toggle('agent')}>
        <SimpleTable columns={[{ key: 'agentCode', label: 'Agent' }, { key: 'status', label: 'Status' }, { key: 'remarks', label: 'Remarks' }]} rows={demogs?.agentHistoryTable || []} />
      </Accordion>

      <Accordion title="Contract details" open={open === 'contact'} onToggle={() => toggle('contact')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {canEdit ? (
            <>
              <EditableField label="Product" value={formatProductName(contact.productName || claim?.productName)} onChange={(v) => patchContact('productName', v)} />
              <EditableField label="Sum assured" value={contact.sumAssured || claim?.sumAssured} onChange={(v) => patchContact('sumAssured', v)} />
              <EditableField label="Advisor" value={contact.advisorCode || claim?.advisorCode} onChange={(v) => patchContact('advisorCode', v)} />
            </>
          ) : (
            <>
              <ROField label="Product" value={formatProductName(contact.productName || claim?.productName)} />
              <ROField label="Sum assured" value={contact.sumAssured || claim?.sumAssured} />
              <ROField label="Advisor" value={contact.advisorCode || claim?.advisorCode} />
            </>
          )}
        </div>
        <div style={{ marginTop: '12px' }}>
          <SimpleTable columns={[{ key: 'riderCode', label: 'Rider' }, { key: 'riderSA', label: 'SA' }, { key: 'riderStatus', label: 'Status' }]} rows={demogs?.riderDetailsTable || []} empty="No riders." />
        </div>
      </Accordion>

      <Accordion title="Fraud screen (Eagle)" subtitle="Investigative tables + Rule Manager modal" open={open === 'eagle'} onToggle={() => toggle('eagle')}>
        <EagleScreenSection demogs={demogs} canEdit={canEdit} onPatch={onPatch} onOpenFraud={onOpenFraud} />
      </Accordion>
    </div>
  )
}
