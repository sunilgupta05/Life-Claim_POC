import { useState, useEffect } from 'react'

import { ROField, EditableField, SubTabNav, useWorkspaceTokens } from '../workspaceUi'

import AcuityDecisionPanel from '../AcuityDecisionPanel'

import { formatCalcAmountSummary } from '../../../../util/workspaceDisplay'
import { alertBannerStyle } from '../../../../ui/pageTokens'
import { useTheme } from '../../../../context/ThemeContext'

import { DECISION_SUB_TAB, getDecisionSubTabs } from '../../../../util/decisionSubTabs'



const fmtRs = (n) => (n ? `₹${Number(n).toLocaleString('en-IN')}` : '—')



export default function DecisionWorkspaceTab({

  claim,

  calcAmt,

  userRoles = [],

  userRole = '',

  claimRole = '',

  assessorCanEdit,

  verifierCanEdit,

  accessorDecision,

  setAccessorDecision,

  accessorReason,

  setAccessorReason,

  accessorAmount,

  setAccessorAmount,

  verificationStatus,

  setVerificationStatus,

  verificationRemarks,

  setVerificationRemarks,

  submitGuard,

  workflowGuard,

  submitting,

  onSubmit,

}) {

  const WS = useWorkspaceTokens()
  const { tokens: T } = useTheme()
  const decisionTabs = getDecisionSubTabs(userRoles, { userRole, claimRole: claimRole || claim?.claimRole })

  const [subTab, setSubTab] = useState(decisionTabs[0])

  const calcRows = calcAmt ? formatCalcAmountSummary(calcAmt) : []



  useEffect(() => {

    if (!decisionTabs.includes(subTab)) {

      setSubTab(decisionTabs[0])

    }

  }, [decisionTabs, subTab])



  return (

    <div>

      {claim?.acuity && <AcuityDecisionPanel acuity={claim.acuity} />}



      <SubTabNav tabs={decisionTabs} active={subTab} onChange={setSubTab} />



      {subTab === DECISION_SUB_TAB.SYSTEM && (

        <div>

          <div style={{ marginBottom: '20px' }}>

            <div style={{ fontSize: '12px', fontWeight: 800, color: WS.primary, textTransform: 'uppercase', marginBottom: '12px' }}>

              System decision (Pre Assessor / registration)

            </div>

            {claim?.sysRecommendation ? (

              <div style={{ padding: '16px', borderRadius: '10px', ...alertBannerStyle(T, claim.sysRecommendation === 'Approve' ? 'success' : 'danger') }}>

                <div style={{ fontSize: '15px', fontWeight: 900, color: claim.sysRecommendation === 'Approve' ? T.approved.text : T.rejected.text }}>

                  {claim.sysRecommendation}

                </div>

                <div style={{ fontSize: '12px', marginTop: '6px', color: claim.sysRecommendation === 'Approve' ? T.approved.text : T.rejected.text, opacity: 0.9 }}>

                  Payable {fmtRs(claim.sysPayableAmount)} · Risk {claim.sysRiskScore || '—'}

                </div>

                {claim.sysReason && (

                  <div style={{ fontSize: '12px', marginTop: '10px', color: WS.textSecondary, lineHeight: 1.6 }}>{claim.sysReason}</div>

                )}

              </div>

            ) : (

              <div style={{ fontSize: '13px', color: WS.textMuted }}>No system decision on file.</div>

            )}

          </div>



          {calcRows.length > 0 && (

            <div style={{ padding: '16px', background: WS.surfaceMuted, borderRadius: '10px', border: `1px solid ${WS.border}` }}>

              <div style={{ fontSize: '12px', fontWeight: 700, color: WS.textMuted, marginBottom: '12px' }}>

                Payable amount breakdown (Transaction API)

              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>

                {calcRows.map((row) => (

                  <div key={row.label} style={{ padding: '10px 12px', background: WS.hoverBg, borderRadius: '8px', border: `1px solid ${WS.border}` }}>

                    <div style={{ fontSize: '10px', fontWeight: 700, color: WS.textMuted, textTransform: 'uppercase' }}>{row.label}</div>

                    <div style={{ fontSize: '14px', fontWeight: 800, color: WS.textPrimary, marginTop: '4px' }}>{row.value}</div>

                  </div>

                ))}

              </div>

            </div>

          )}

        </div>

      )}



      {subTab === DECISION_SUB_TAB.ACCESSOR && (

        <div>

          <div style={{ fontSize: '12px', fontWeight: 800, color: WS.primary, textTransform: 'uppercase', marginBottom: '12px' }}>

            Assessor decision

            {!assessorCanEdit && (

              <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 700, color: WS.textMuted, textTransform: 'none' }}>(read-only)</span>

            )}

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

            <EditableField label="Decision" value={accessorDecision} onChange={setAccessorDecision} disabled={!assessorCanEdit} options={['Approve', 'Reject', 'Refer to Verifier', 'Request More Documents', 'Repudiate']} />

            <EditableField label="Amount" value={accessorAmount} onChange={setAccessorAmount} disabled={!assessorCanEdit} />

            <div style={{ gridColumn: '1/-1' }}>

              <label style={{ fontSize: '11px', fontWeight: 700, color: WS.textSecondary }}>Reason / remarks</label>

              <textarea value={accessorReason} onChange={(e) => setAccessorReason(e.target.value)} readOnly={!assessorCanEdit} rows={4} style={{ width: '100%', marginTop: '4px', padding: '10px', border: `1.5px solid ${WS.border}`, borderRadius: '8px', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box', background: assessorCanEdit ? WS.inputBg : WS.inputBgReadonly, color: assessorCanEdit ? WS.textPrimary : WS.textMuted }} />

            </div>

          </div>

        </div>

      )}



      {subTab === DECISION_SUB_TAB.VERIFICATION && (

        <div>

          <div style={{ fontSize: '12px', fontWeight: 800, color: WS.primary, textTransform: 'uppercase', marginBottom: '12px' }}>

            Verifier decision

            {!verifierCanEdit && (

              <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 700, color: WS.textMuted, textTransform: 'none' }}>(read-only)</span>

            )}

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

            <EditableField label="Status" value={verificationStatus} onChange={setVerificationStatus} disabled={!verifierCanEdit} options={['Pending', 'Verified', 'Rejected']} />

            <div style={{ gridColumn: '1/-1' }}>

              <label style={{ fontSize: '11px', fontWeight: 700 }}>Remarks</label>

              <textarea value={verificationRemarks} onChange={(e) => setVerificationRemarks(e.target.value)} readOnly={!verifierCanEdit} rows={3} style={{ width: '100%', marginTop: '4px', padding: '10px', border: `1px solid ${WS.border}`, borderRadius: '8px', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box', background: verifierCanEdit ? WS.inputBg : WS.inputBgReadonly, color: verifierCanEdit ? WS.textPrimary : WS.textMuted }} />

            </div>

          </div>

        </div>

      )}



      {subTab === DECISION_SUB_TAB.SUMMARY && (

        <div>

          <div style={{ fontSize: '12px', fontWeight: 800, color: WS.textSubtle, textTransform: 'uppercase', marginBottom: '12px' }}>Summary</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>

            <ROField label="Claim" value={claim?.claimId} />

            <ROField label="Policy" value={claim?.policyId} />

            <ROField label="Status" value={claim?.status} />

            <ROField label="Workflow role" value={claim?.claimRole} />

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>

            <ROField label="System recommendation" value={claim?.sysRecommendation || '—'} />

            <ROField label="Assessor decision" value={accessorDecision || '—'} />

            <ROField label="Assessor amount" value={accessorAmount ? fmtRs(accessorAmount) : '—'} />

            <ROField label="Verification status" value={verificationStatus || '—'} />

          </div>

          <div style={{ padding: '16px', borderRadius: '10px', ...alertBannerStyle(T, submitGuard.ok ? 'success' : 'warn') }}>

            <div style={{ fontSize: '13px', fontWeight: 600, color: submitGuard.ok ? T.approved.text : T.pending.text, marginBottom: workflowGuard?.ok ? '12px' : 0 }}>{submitGuard.hint}</div>

            {workflowGuard?.ok && (

              <button type="button" onClick={onSubmit} disabled={!submitGuard.ok || submitting} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: submitGuard.ok ? '#059669' : '#94A3B8', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: !submitGuard.ok || submitting ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', opacity: submitting ? 0.7 : 1 }}>

                {submitting ? 'Submitting…' : 'Submit'}

              </button>

            )}

          </div>

        </div>

      )}

    </div>

  )

}


