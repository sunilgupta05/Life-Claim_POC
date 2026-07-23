import { useWorkspaceTokens } from './workspaceUi'

const TABLE_DEFS = [
  {
    policyKey: 'hospitalDetailsTable',
    label: 'Hospital details',
    cols: [
      { key: 'hospitalName', label: 'Hospital' },
      { key: 'admissionDate', label: 'Admission', type: 'date' },
      { key: 'dischargeDate', label: 'Discharge', type: 'date' },
      { key: 'diagnosis', label: 'Diagnosis' },
      { key: 'natureOfIllness', label: 'Illness' },
    ],
    emptyRow: { hospitalName: '', admissionDate: '', dischargeDate: '', diagnosis: '', natureOfIllness: '' },
  },
  {
    policyKey: 'doctorDetailsTable',
    label: 'Doctor details',
    cols: [
      { key: 'doctorName', label: 'Doctor' },
      { key: 'regNo', label: 'Reg. no' },
      { key: 'qualification', label: 'Qualification' },
      { key: 'firstConsultDate', label: 'First consult', type: 'date' },
      { key: 'causeOfDeath', label: 'Cause' },
    ],
    emptyRow: { doctorName: '', regNo: '', qualification: '', firstConsultDate: '', causeOfDeath: '' },
  },
  {
    policyKey: 'proofDetailsTable',
    label: 'Proof details',
    cols: [
      { key: 'proofType', label: 'Type' },
      { key: 'documentType', label: 'Document' },
      { key: 'issueDate', label: 'Issue date', type: 'date' },
      { key: 'documentId', label: 'Document ID' },
      { key: 'holderName', label: 'Holder' },
    ],
    emptyRow: { proofType: '', documentType: '', issueDate: '', documentId: '', holderName: '' },
  },
  {
    policyKey: 'insuranceProofDetailsTable',
    label: 'Insurance proof',
    cols: [
      { key: 'proofType', label: 'Type' },
      { key: 'documentId', label: 'Document ID' },
      { key: 'holderName', label: 'Holder' },
      { key: 'issueDate', label: 'Issue date', type: 'date' },
      { key: 'aadhaarMatch', label: 'Aadhaar' },
      { key: 'panMatch', label: 'PAN' },
    ],
    emptyRow: { proofType: '', documentId: '', holderName: '', issueDate: '', aadhaarMatch: '', panMatch: '' },
  },
  {
    policyKey: 'witnessDetailsTable',
    label: 'Witness details',
    cols: [
      { key: 'witnessName', label: 'Name' },
      { key: 'relation', label: 'Relation' },
      { key: 'mobileNo', label: 'Mobile' },
      { key: 'address', label: 'Address' },
    ],
    emptyRow: { witnessName: '', relation: '', mobileNo: '', address: '' },
  },
  {
    policyKey: 'incomeDetailsTable',
    label: 'Income details',
    cols: [
      { key: 'financialYear', label: 'FY' },
      { key: 'proofType', label: 'Proof' },
      { key: 'incomeAmount', label: 'Amount' },
      { key: 'issueDate', label: 'Issue date', type: 'date' },
    ],
    emptyRow: { financialYear: '', proofType: '', incomeAmount: '', issueDate: '' },
  },
]

function EagleTable({ columns, rows, canEdit, onCellChange, onDeleteRow, empty = 'No rows.' }) {
  const WS = useWorkspaceTokens()
  if (!rows?.length) {
    return <div style={{ fontSize: '13px', color: WS.textSubtle, padding: '12px' }}>{empty}</div>
  }

  const cellStyle = {
    padding: '6px 8px',
    fontSize: '12px',
    color: WS.textSecondary,
    verticalAlign: 'top',
  }

  const inputStyle = {
    width: '100%',
    minWidth: '72px',
    padding: '6px 8px',
    border: `1px solid ${WS.border}`,
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'Inter,sans-serif',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${WS.border}`, borderRadius: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: WS.surfaceSubtle, borderBottom: `2px solid ${WS.border}` }}>
            {columns.map((c) => (
              <th key={c.key} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: WS.textSubtle, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {c.label}
              </th>
            ))}
            {canEdit && <th style={{ width: '48px' }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ borderBottom: `1px solid ${WS.borderSubtle}` }}>
              {columns.map((c) => (
                <td key={c.key} style={cellStyle}>
                  {canEdit ? (
                    <input
                      type={c.type === 'date' ? 'date' : 'text'}
                      value={row[c.key] ?? ''}
                      onChange={(e) => onCellChange(rowIndex, c.key, e.target.value)}
                      style={inputStyle}
                    />
                  ) : (
                    row[c.key] ?? '—'
                  )}
                </td>
              ))}
              {canEdit && (
                <td style={cellStyle}>
                  <button
                    type="button"
                    onClick={() => onDeleteRow(rowIndex)}
                    title="Remove row"
                    style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${WS.border}`, background: WS.card, fontSize: '11px', cursor: 'pointer', color: '#DC2626', fontWeight: 700 }}
                  >
                    ×
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function EagleScreenSection({ demogs, canEdit, onPatch, onOpenFraud }) {
  const WS = useWorkspaceTokens()
  const eagle = demogs?.eagle || {}

  const patchTable = (policyKey, rows) => {
    onPatch({ [policyKey]: rows, eagleScreenDetails: { ...eagle, updated: true } })
  }

  const addRow = (policyKey, emptyRow) => {
    const current = demogs?.[policyKey] || []
    patchTable(policyKey, [...current, { ...emptyRow }])
  }

  const updateCell = (policyKey, rowIndex, colKey, value) => {
    const current = [...(demogs?.[policyKey] || [])]
    current[rowIndex] = { ...(current[rowIndex] || {}), [colKey]: value }
    patchTable(policyKey, current)
  }

  const deleteRow = (policyKey, rowIndex) => {
    const current = (demogs?.[policyKey] || []).filter((_, i) => i !== rowIndex)
    patchTable(policyKey, current)
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: WS.textMuted, marginBottom: '12px', lineHeight: 1.5 }}>
        Eagle investigative tables persist on Summary Submit via register-claim/update. Use Fraud Prevention for the four automated cross-claim rules.
      </p>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onOpenFraud}
          style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
        >
          Fraud Prevention (Rule Manager)
        </button>
      </div>
      {TABLE_DEFS.map((def) => (
        <div key={def.policyKey} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: WS.textSecondary, textTransform: 'uppercase' }}>{def.label}</span>
            {canEdit && (
              <button
                type="button"
                onClick={() => addRow(def.policyKey, def.emptyRow)}
                style={{ padding: '4px 12px', borderRadius: '6px', border: `1px solid ${WS.border}`, background: WS.card, fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
              >
                + Add row
              </button>
            )}
          </div>
          <EagleTable
            columns={def.cols}
            rows={demogs?.[def.policyKey] || []}
            canEdit={canEdit}
            onCellChange={(rowIndex, colKey, value) => updateCell(def.policyKey, rowIndex, colKey, value)}
            onDeleteRow={(rowIndex) => deleteRow(def.policyKey, rowIndex)}
          />
        </div>
      ))}
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: WS.textSubtle, marginBottom: '6px' }}>Eagle screen (bank / agent)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px' }}>
          {[['Bank', eagle.bank_name || eagle.bankName], ['Account', eagle.acc_no || eagle.accountNo || eagle.accNo], ['Agent', eagle.agent_code || eagle.agentCode]].map(([k, v]) => (
            <div key={k} style={{ padding: '8px', background: WS.surfaceMuted, borderRadius: '6px' }}>
              <div style={{ color: WS.textSubtle, fontWeight: 700, fontSize: '10px' }}>{k}</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{v || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
