import React, { useState } from 'react'
import { useRegTokens } from '../../pages/Registration/shared'
import { Field, Input, Select, Textarea, SubTabNav, Grid, Btn, InfoCard } from './shared'
import { getSystemDecision } from '../../services/masterService'
import { useToast } from '../../components/Toast'
import { validateAssessment, showValidationToast } from '../../util/registrationValidation'
import { statusPillStyle, fieldInputStyle, alertBannerStyle } from '../../ui/pageTokens'
import { REGISTRATION_ASSESSMENT_QUESTIONS } from '../../config/registrationCatalog'

export default function AssessmentTab({
  userRole,
  isPreAssessor: isPreAssessorProp,
  data,
  update,
  policy,
  onComplete,
}) {
  const T = useRegTokens()
  const toast = useToast()
  const isPreAssessor = isPreAssessorProp ?? (userRole === 'Pre Assessor')
  const isAssessorPlus = !isPreAssessor
  const [subTab, setSubTab] = useState('Questions')
  const questions = REGISTRATION_ASSESSMENT_QUESTIONS
  const [finishing, setFinishing] = useState(false)

  const setAnswer = (id, val) => update({ assessmentAnswers: { ...(data.assessmentAnswers || {}), [id]: val } })
  const selectAllYes = () => {
    const allYes = Object.fromEntries(questions.map((q) => [q.id, 'Yes']))
    update({ assessmentAnswers: { ...(data.assessmentAnswers || {}), ...allYes } })
  }
  const ans = data.assessmentAnswers || {}

  const answeredCount = questions.filter((q) => ans[q.id]).length
  const allAnswered = answeredCount >= questions.length
  const validation = validateAssessment(data, { questions, isPreAssessor })
  const assessmentComplete = validation.valid

  const goToMissing = (missing) => {
    if (missing.some((m) => m.includes('question'))) setSubTab('Questions')
    else if (missing.some((m) => m.includes('Remarks') || m.includes('Case Trigger') || m.includes('Priority'))) setSubTab('Remarks')
  }

  return (
    <div style={{ padding: '24px' }}>
      <SubTabNav
        tabs={isAssessorPlus
          ? ['Questions', 'IIB Enquiry', 'Telecalling', 'Remarks', 'Fraud Remarks', 'Assessor Remarks']
          : ['Questions', 'IIB Enquiry', 'Telecalling', 'Remarks']}
        active={subTab}
        onChange={setSubTab}
      />

      {subTab === 'Questions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: T.textMuted }}>
              {answeredCount} of {questions.length} questions answered <span style={{ color: T.danger }}>*</span> required
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Btn variant="secondary" size="sm" onClick={selectAllYes}>
                Select all Yes
              </Btn>
              {allAnswered && (
                <span style={statusPillStyle(T, 'success')}>
                  ✓ All answered
                </span>
              )}
            </div>
          </div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surfaceMuted, borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.05em', width: '40px' }}>#</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.05em', width: '140px' }}>
                    Answer<span style={{ color: T.danger }}> *</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => {
                  const a = ans[q.id]
                  return (
                    <tr
                      key={q.id}
                      style={{
                        borderBottom: `1px solid ${T.borderSubtle}`,
                        background: T.card,
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 700, color: T.textSubtle, verticalAlign: 'top' }}>{q.id}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 500, color: T.textPrimary, lineHeight: 1.5, verticalAlign: 'top' }}>{q.question}</td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'top', width: '140px' }}>
                        <Select
                          value={a || ''}
                          onChange={(e) => setAnswer(q.id, e.target.value)}
                          options={['Yes', 'No']}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'IIB Enquiry' && (
        <div>
          <div style={{ marginBottom: '16px' }}><InfoCard type="info">IIB (Insurance Information Bureau) enquiry checks the life assured&apos;s existing insurance portfolio across all insurers.</InfoCard></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { key: 'iibRefNo', label: 'IIB Reference Number' },
              { key: 'iibEnquiryDate', label: 'Enquiry Date', type: 'date' },
              { key: 'iibStatus', label: 'Enquiry Status', opts: ['Pending', 'Completed', 'Failed', 'Not Initiated'] },
              { key: 'iibPoliciesFound', label: 'No. of Policies Found' },
              { key: 'iibTotalSA', label: 'Total Sum Assured (₹)' },
              { key: 'iibFraudFlag', label: 'Fraud Flag', opts: ['Yes', 'No', 'NA'] },
              { key: 'iibMultiplePolicy', label: 'Multiple Policy Detected', opts: ['Yes', 'No'] },
              { key: 'iibNonDisclosure', label: 'Non-Disclosure Detected', opts: ['Yes', 'No', 'NA'] },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.textSecondary, marginBottom: '5px' }}>{f.label}</label>
                {f.opts ? (
                  <select value={data[f.key] || ''} onChange={(e) => update({ [f.key]: e.target.value })}
                    style={fieldInputStyle(T, { width: '100%', height: '38px', padding: '0 10px', border: `1.5px solid ${T.border}`, borderRadius: '7px', outline: 'none' })}>
                    <option value="">-- Select --</option>
                    {f.opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type || 'text'} value={data[f.key] || ''} onChange={(e) => update({ [f.key]: e.target.value })}
                    style={fieldInputStyle(T, { width: '100%', height: '38px', padding: '0 10px', border: `1.5px solid ${T.border}`, borderRadius: '7px', outline: 'none', boxSizing: 'border-box' })} />
                )}
              </div>
            ))}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.textSecondary, marginBottom: '5px' }}>IIB Remarks</label>
              <textarea value={data.iibRemarks || ''} onChange={(e) => update({ iibRemarks: e.target.value })} rows={3} placeholder="Enter IIB enquiry findings..."
                style={fieldInputStyle(T, { width: '100%', padding: '8px 10px', border: `1.5px solid ${T.border}`, borderRadius: '7px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', height: 'auto' })} />
            </div>
          </div>
        </div>
      )}

      {subTab === 'Telecalling' && (
        <div>
          <div style={{ marginBottom: '16px' }}><InfoCard type="info">Telecalling details are recorded after initial field verification is complete.</InfoCard></div>
          <Grid cols={2}>
            <Field label="Telecalling Date"><Input type="date" value={data.telecallingDate} onChange={(e) => update({ telecallingDate: e.target.value })} /></Field>
            <Field label="Telecaller Name"><Input value={data.telecallerName} onChange={(e) => update({ telecallerName: e.target.value })} /></Field>
            <Field label="Called Number"><Input value={data.telecalledNumber} onChange={(e) => update({ telecalledNumber: e.target.value })} maxLength={10} /></Field>
            <Field label="Call Status"><Select value={data.telecallStatus} onChange={(e) => update({ telecallStatus: e.target.value })} options={['Connected', 'Not Connected', 'Switched Off', 'Invalid Number', 'Callback Requested']} /></Field>
            <Field label="Call Duration (mins)"><Input value={data.telecallDuration} onChange={(e) => update({ telecallDuration: e.target.value })} /></Field>
            <Field label="Verification Outcome"><Select value={data.telecallOutcome} onChange={(e) => update({ telecallOutcome: e.target.value })} options={['Verified', 'Not Verified', 'Partial Verification', 'Suspicious', 'Requires Follow-up']} /></Field>
            <Field label="Telecalling Remarks" full><Textarea value={data.telecallingRemarks} onChange={(e) => update({ telecallingRemarks: e.target.value })} placeholder="Enter detailed telecalling remarks..." rows={4} /></Field>
          </Grid>
        </div>
      )}

      {subTab === 'Remarks' && (
        <div>
          {isPreAssessor ? (
            <Grid cols={2}>
              <Field label="Case Trigger" required>
                <Select value={data.caseTrigger} onChange={(e) => update({ caseTrigger: e.target.value })} options={['Yes', 'No', 'NA']} />
              </Field>
              <Field label="Priority Flag" required>
                <Select value={data.priorityFlag} onChange={(e) => update({ priorityFlag: e.target.value })} options={['High', 'Normal', 'Low']} />
              </Field>
            </Grid>
          ) : (
            <Grid cols={2}>
              <Field label="Case Trigger" required>
                <Select value={data.caseTrigger} onChange={(e) => update({ caseTrigger: e.target.value })} options={['Yes', 'No', 'NA']} />
              </Field>
              <Field label="Priority Flag" required>
                <Select value={data.priorityFlag} onChange={(e) => update({ priorityFlag: e.target.value })} options={['High', 'Normal', 'Low']} />
              </Field>
              <Field label="Fraud Remarks" full>
                <Textarea value={data.fraudRemarks} onChange={(e) => update({ fraudRemarks: e.target.value })} placeholder="Enter fraud-related observations (if any)..." rows={5} />
              </Field>
              <Field label="Assessor Remarks" full required>
                <Textarea value={data.assessorRemarks} onChange={(e) => update({ assessorRemarks: e.target.value })} placeholder="Enter detailed assessment remarks here..." rows={5} />
              </Field>
              <Field label="System Assessor Remarks" full>
                <Textarea value={data.systemAssessorRemarks} onChange={(e) => update({ systemAssessorRemarks: e.target.value })} placeholder="System-generated assessment remarks..." rows={3} />
              </Field>
            </Grid>
          )}
        </div>
      )}

      {subTab === 'Fraud Remarks' && isAssessorPlus && (
        <div>
          <div style={{ marginBottom: '16px' }}><InfoCard type="warning">Fraud remarks are confidential and visible only to Assessors and Verifiers.</InfoCard></div>
          <Grid cols={2}>
            <Field label="Fraud Suspicion Level">
              <Select value={data.fraudSuspicionLevel} onChange={(e) => update({ fraudSuspicionLevel: e.target.value })} options={['None', 'Low', 'Medium', 'High', 'Very High']} />
            </Field>
            <Field label="Fraud Category">
              <Select value={data.fraudCategory} onChange={(e) => update({ fraudCategory: e.target.value })} options={['None', 'Misrepresentation', 'Non-Disclosure', 'Document Forgery', 'Identity Fraud', 'Agent Fraud', 'Others']} />
            </Field>
            <Field label="Fraud Investigation Required">
              <Select value={data.fraudInvestigationRequired} onChange={(e) => update({ fraudInvestigationRequired: e.target.value })} options={['Yes', 'No', 'NA']} />
            </Field>
            <Field label="Investigation Assigned To">
              <Input value={data.fraudInvestigationAssignedTo} onChange={(e) => update({ fraudInvestigationAssignedTo: e.target.value })} placeholder="Investigator name or team" />
            </Field>
            <Field label="Fraud Remarks" full>
              <Textarea value={data.fraudRemarks} onChange={(e) => update({ fraudRemarks: e.target.value })} placeholder="Detailed fraud observations, suspicious patterns, evidence noted..." rows={6} />
            </Field>
            <Field label="Action Recommended" full>
              <Select value={data.fraudActionRecommended} onChange={(e) => update({ fraudActionRecommended: e.target.value })} options={['No Action', 'Monitor', 'Investigate', 'Repudiate', 'Report to IRDAI', 'Refer to Legal']} />
            </Field>
          </Grid>
        </div>
      )}

      {subTab === 'Assessor Remarks' && isAssessorPlus && (
        <div>
          <div style={{ marginBottom: '16px' }}><InfoCard type="info">System assessor remarks are auto-generated based on data patterns and manually supplemented by the assessor.</InfoCard></div>
          <Grid cols={2}>
            <Field label="System Observation">
              <Select value={data.sysObservation} onChange={(e) => update({ sysObservation: e.target.value })} options={['Clean', 'Minor Discrepancy', 'Major Discrepancy', 'Suspicious', 'Refer to Senior']} />
            </Field>
            <Field label="Priority Flag" required>
              <Select value={data.priorityFlag} onChange={(e) => update({ priorityFlag: e.target.value })} options={['High', 'Normal', 'Low']} />
            </Field>
            <Field label="Case Trigger" required>
              <Select value={data.caseTrigger} onChange={(e) => update({ caseTrigger: e.target.value })} options={['Yes', 'No', 'NA']} />
            </Field>
            <Field label="Trigger Reason">
              <Input value={data.triggerReason} onChange={(e) => update({ triggerReason: e.target.value })} placeholder="Reason for case trigger if Yes" />
            </Field>
            <Field label="System Generated Remarks" full>
              <Textarea value={data.systemAssessorRemarks} onChange={(e) => update({ systemAssessorRemarks: e.target.value })} placeholder="System-generated assessment observations. Can be supplemented by assessor." rows={4} />
            </Field>
            <Field label="Assessor Additional Remarks" full required>
              <Textarea value={data.assessorRemarks} onChange={(e) => update({ assessorRemarks: e.target.value })} placeholder="Additional remarks from assessor beyond system observations..." rows={4} />
            </Field>
          </Grid>
        </div>
      )}

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
        {!assessmentComplete && (
          <div style={{ ...alertBannerStyle(T, 'warn'), marginRight: 'auto', flex: '1 1 280px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', padding: '12px 16px', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 800, marginBottom: '6px', color: T.pending.text ?? T.pending.color }}>
              Still required to complete assessment:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', color: T.pending.color }}>
              {validation.missing.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => goToMissing([item])}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: T.pending.color, fontWeight: 600, fontFamily: 'Inter,sans-serif', textAlign: 'left', textDecoration: 'underline' }}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Btn
          variant="success"
          disabled={!assessmentComplete || finishing}
          onClick={async () => {
            const check = validateAssessment(data, { questions, isPreAssessor })
            if (!check.valid) {
              showValidationToast(toast, check.missing, 'Assessment incomplete')
              goToMissing(check.missing)
              return
            }
            setFinishing(true)
            try {
              const res = await getSystemDecision(data, policy)
              update({
                sysRecommendation: res.recommendation,
                sysPayableAmount: res.payableAmount,
                sysReason: res.reason,
                sysRiskScore: res.riskScore,
                sysProcessedOn: res.processedOn,
                systemDetails: res })
              const title = res.estimated ? 'System decision (estimated)' : 'System decision'
              toast('success', title, `${res.recommendation} — ${res.reason}`)
            } catch (e) {
              toast('warning', 'System decision', e?.message || 'Could not generate system decision. You can retry from the Decision tab.')
            } finally {
              setFinishing(false)
              update({ _assessmentComplete: true })
              onComplete()
            }
          }}
        >
          {finishing ? 'Processing…' : '✓ Complete Assessment →'}
        </Btn>
      </div>
    </div>
  )
}
