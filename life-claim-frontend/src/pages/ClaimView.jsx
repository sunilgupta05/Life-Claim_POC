import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import {
  getClaimWorkspaceInitial,
  getClaimWorkspaceTab,
} from '../services/claimsService'
import { claimSearch } from '../services/claimSearchService'
import updatePolicyService from '../services/updatePolicyService'
import {
  buildPolicyDataFromRaw,
  mergePolicyData,
  buildWorkspaceSubmitPayload,
} from '../util/buildPolicyData'
import { validateWorkspaceRequirementsForSubmit } from '../util/workspaceDisplay'
import {
  areFieldsDisabled,
  enableAssessor,
  enableVerifier,
  workspaceCanEdit,
  getSubmitGuard,
  getWorkspaceSubmitState,
  mapAccessorDecisionToApi,
} from '../util/claimWorkspaceMode'
import { isPreAssessorRole } from '../util/preAssessor'
import { coalesceRoles } from '../util/workflowRole'
import { hasSuperUserAccess } from '../util/superuserRole'
import FraudRuleManagerModal from '../components/claim/FraudRuleManagerModal'
import TransactionDetailsModal from '../components/claim/TransactionDetailsModal'
import ClaimSuccessModal from '../components/claim/ClaimSuccessModal'
import ClaimAssignModal from '../components/claim/ClaimAssignModal'
import CaseSummaryPanel from '../components/claim/workspace/CaseSummaryPanel'
import QuickAccessModal from '../components/claim/workspace/QuickAccessModal'
import DocumentSideSlider from '../components/claim/workspace/DocumentSideSlider'
import DemographicsWorkspaceTab from '../components/claim/workspace/tabs/DemographicsWorkspaceTab'
import RequirementsWorkspaceTab from '../components/claim/workspace/tabs/RequirementsWorkspaceTab'
import AssessmentWorkspaceTab from '../components/claim/workspace/tabs/AssessmentWorkspaceTab'
import DecisionWorkspaceTab from '../components/claim/workspace/tabs/DecisionWorkspaceTab'
import { useWorkspaceTokens } from '../components/claim/workspace/workspaceUi'
import { useTheme } from '../context/ThemeContext'
import AcuityDecisionPanel from '../components/claim/workspace/AcuityDecisionPanel'
import { ShieldAlert, Receipt, UserPlus, FileText, Zap } from 'lucide-react'

const TABS = ['Demographics', 'Requirements', 'Assessment', 'Decision & Summary']
const LAZY_TABS = new Set(['Requirements', 'Assessment', 'Decision & Summary'])

export default function ClaimView() {
  const WS = useWorkspaceTokens()
  const { tokens: T } = useTheme()
  const statusColors = {
    Pending: { ...T.pending, color: T.pending.text },
    Approved: { ...T.approved, color: T.approved.text },
    Rejected: { ...T.rejected, color: T.rejected.text },
    'In Progress': { ...T.info, color: T.info.color },
  }
  const { claimId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { user, can } = useAuth()

  const [claim, setClaim] = useState(null)
  const [workspaceRaw, setWorkspaceRaw] = useState(null)
  const [policyData, setPolicyData] = useState(null)
  const policyDataRef = useRef(null)
  const workspaceRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [loadedTabs, setLoadedTabs] = useState(new Set(['Demographics']))
  const [activeTab, setActiveTab] = useState('Demographics')
  const [showQuick, setShowQuick] = useState(false)
  const [showFraud, setShowFraud] = useState(false)
  const [showTxn, setShowTxn] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [calcResult, setCalcResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(null)
  const [submissionLocked, setSubmissionLocked] = useState(false)

  const [accessorDecision, setAccessorDecision] = useState('')
  const [accessorReason, setAccessorReason] = useState('')
  const [accessorAmount, setAccessorAmount] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('')
  const [verificationRemarks, setVerificationRemarks] = useState('')
  const resolvedClaimId =
    String(location.state?.claimId || claimId || sessionStorage.getItem('activeClaimId') || '').trim()

  useEffect(() => {
    if (!resolvedClaimId) return
    try { sessionStorage.setItem('activeClaimId', resolvedClaimId) } catch { }
  }, [resolvedClaimId])

  useEffect(() => { workspaceRef.current = workspaceRaw }, [workspaceRaw])
  useEffect(() => { policyDataRef.current = policyData }, [policyData])

  const syncFromView = useCallback((view, raw) => {
    setClaim(view)
    setWorkspaceRaw(raw)
    const pd = buildPolicyDataFromRaw(raw, resolvedClaimId, user)
    setPolicyData(pd)
    policyDataRef.current = pd
    setAccessorDecision(view.accessorDecision || '')
    setAccessorReason(view.accessorReason || '')
    const calc = raw?.calcAmt
    if (calc) setCalcResult(calc)
    const payable =
      view.accessorAmount ||
      calc?.totalAmtPayable ||
      calc?.baseSec
    setAccessorAmount(String(payable || ''))
    setVerificationStatus(view.verificationStatus || '')
    setVerificationRemarks(view.verificationRemarks || '')
  }, [resolvedClaimId, user])

  useEffect(() => {
    if (!resolvedClaimId) {
      toast('warning', 'Claim required', 'Open a claim from Claim Search, Dashboard, or My Tasks.')
      navigate('/claim-search')
      return
    }
    setLoading(true)
    setSubmissionLocked(false)
    setLoadedTabs(new Set(['Demographics']))
    getClaimWorkspaceInitial(resolvedClaimId)
      .then(({ view, raw }) => syncFromView(view, raw))
      .catch(() => {
        toast('error', 'Load Failed', 'Could not load claim workspace.')
        navigate('/claim-search')
      })
      .finally(() => setLoading(false))
  }, [resolvedClaimId, navigate, toast, syncFromView])

  const EAGLE_TABLE_KEYS = [
    'hospitalDetailsTable', 'doctorDetailsTable', 'proofDetailsTable',
    'insuranceProofDetailsTable', 'witnessDetailsTable', 'incomeDetailsTable',
  ]

  const patchPolicyData = useCallback((patch) => {
    setPolicyData((prev) => {
      const next = mergePolicyData(prev, patch)
      policyDataRef.current = next
      return next
    })
    setWorkspaceRaw((prev) => {
      if (!prev || !patch) return prev
      const demogs = { ...(prev.demogs || {}) }
      let requirements = prev.requirements ? { ...prev.requirements } : null
      let assessment = prev.assessment ? { ...prev.assessment } : null

      if (patch.intimationDetails) {
        demogs.intimation = { ...(demogs.intimation || {}), ...patch.intimationDetails }
      }
      if (patch.establishedCauseDetails) {
        demogs.establishedCause = { ...(demogs.establishedCause || {}), ...patch.establishedCauseDetails }
      }
      if (patch.lifeAssuredDetails) {
        demogs.lifeAssured = { ...(demogs.lifeAssured || {}), ...patch.lifeAssuredDetails }
      }
      if (patch.contactDetails) {
        demogs.contact = { ...(demogs.contact || {}), ...patch.contactDetails }
      }
      if (patch.claimantDetails) demogs.claimant = patch.claimantDetails
      if (patch.payeeDetails) demogs.payee = patch.payeeDetails
      EAGLE_TABLE_KEYS.forEach((k) => {
        if (patch[k]) demogs[k] = patch[k]
      })
      if (patch.eagleScreenDetails) {
        demogs.eagle = { ...(demogs.eagle || {}), ...patch.eagleScreenDetails }
      }
      if (patch.requirementTable) {
        requirements = { ...(requirements || {}), requirementTable: patch.requirementTable }
      }
      if (patch.claimQuestions) {
        const q = {
          ...(assessment?.assessment || assessment?.claimQuestions || {}),
          ...patch.claimQuestions,
        }
        assessment = { ...(assessment || {}), assessment: q, claimQuestions: q }
      }
      if (patch.iibEnquiryTable) {
        assessment = { ...(assessment || {}), iibEnquiryTable: patch.iibEnquiryTable, iibEnquiry: patch.iibEnquiryTable }
      }
      if (patch.priorityFlagRemarks != null || patch.fraudRemarks != null) {
        const v = patch.fraudRemarks ?? patch.priorityFlagRemarks
        assessment = { ...(assessment || {}), fraudRemarks: v, priorityFlagRemarks: v }
      }

      return {
        ...prev,
        demogs,
        ...(requirements ? { requirements } : {}),
        ...(assessment ? { assessment } : {}),
      }
    })
  }, [])

  const handleTabChange = async (tab) => {
    setActiveTab(tab)
    if (!resolvedClaimId || !LAZY_TABS.has(tab) || loadedTabs.has(tab)) return
    setTabLoading(true)
    try {
      const { view, raw: next } = await getClaimWorkspaceTab(resolvedClaimId, tab, workspaceRef.current || {})
      workspaceRef.current = next
      syncFromView(view, next)
      setLoadedTabs((p) => new Set([...p, tab]))
    } catch {
      toast('error', 'Tab load failed', `Could not load ${tab}. Click the tab again to retry.`)
    } finally {
      setTabLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (submissionLocked) {
      toast('warning', 'Already submitted', 'This claim is already submitted in this session. Reload to view updated state.')
      return
    }
    const guard = getWorkspaceSubmitState(
      getSubmitGuard(claim, user?.username, location.state),
      { accessorDecision, accessorReason, verificationStatus, verificationRemarks },
    )
    if (!guard.ok) {
      toast('warning', 'Cannot submit', guard.hint)
      return
    }
    if (guard.mode === 'assessor' || guard.mode === 'verifier') {
      const reqCheck = validateWorkspaceRequirementsForSubmit(workspaceRef.current?.requirements)
      if (!reqCheck.valid) {
        toast('warning', 'Requirements incomplete', reqCheck.message)
        return
      }
    }
    setSubmitting(true)
    const username = user?.username || sessionStorage.getItem('loggedUser') || ''
    const edits = {
      accessorDecision,
      accessorReason,
      accessorAmount,
      verificationStatus,
      verificationRemarks,
    }
    try {
      if (guard.mode === 'assessor') {
        await claimSearch.updateAssessor(
          { decision: mapAccessorDecisionToApi(accessorDecision), remarks: accessorReason },
          resolvedClaimId,
          username,
        )
      } else if (guard.mode === 'verifier') {
        await claimSearch.updateVerifier(
          { status: verificationStatus, remarks: verificationRemarks },
          resolvedClaimId,
          username,
        )
      }
      const payload = buildWorkspaceSubmitPayload(
        policyDataRef.current,
        edits,
        resolvedClaimId,
        username,
        guard.mode,
      )
      await updatePolicyService(payload)
      setSubmissionLocked(true)
      setSubmitSuccess({ mode: guard.mode, claimId: resolvedClaimId })
    } catch (e) {
      toast('error', 'Submit failed', e?.message || 'Could not complete submit.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !claim) {
    return (
      <AppLayout>
        <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'Inter,sans-serif' }}>
          <div style={{ fontSize: '14px', color: WS.textMuted, fontWeight: 600 }}>Loading claim workspace…</div>
        </div>
      </AppLayout>
    )
  }

  const sc = statusColors[claim.status] || statusColors.Pending
  const userRoles = coalesceRoles(user?.roles, user?.role)
  const browseMode = areFieldsDisabled(location.state)
  const assessorCanEdit = enableAssessor(location.state, claim, userRoles)
  const verifierCanEdit = enableVerifier(location.state, claim, userRoles)
  const canEdit = workspaceCanEdit(location.state, claim, userRoles)
  const effectiveCanEdit = canEdit && !browseMode
  const isPreAssessor = isPreAssessorRole(user?.role, userRoles)
  const showWorkspaceTools = canEdit && !isPreAssessor && !browseMode
  const workflowGuard = getSubmitGuard(claim, user?.username, location.state)
  const submitState = submissionLocked
    ? { ...workflowGuard, ok: false, hint: 'Already submitted for this claim. Re-submit is disabled.' }
    : getWorkspaceSubmitState(workflowGuard, {
      accessorDecision,
      accessorReason,
      verificationStatus,
      verificationRemarks,
    })
  const demogs = workspaceRaw?.demogs || {}

  const modeHint = browseMode
    ? 'Browse mode — read-only'
    : canEdit
      ? 'Work mode — submit on Decision & Summary'
      : null

  const actionBtn = {
    display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '7px',
    border: `1px solid ${WS.border}`, background: WS.card, fontWeight: 700, fontSize: '12px',
    cursor: 'pointer', fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap', color: WS.textSecondary,
  }

  return (
    <AppLayout>
      <div style={{ padding: '12px 16px 16px', fontFamily: 'Inter,sans-serif', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Compact header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate(-1)} style={{ ...actionBtn, background: WS.hoverBg, padding: '6px 10px' }}>← Back</button>
            <h1 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: WS.textPrimary }}>Claim workspace</h1>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>{claim.status}</span>
            {modeHint && (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px', background: browseMode ? T.pending.bg : T.approved.bg, border: `1px solid ${browseMode ? T.pending.border : T.approved.border}`, color: browseMode ? T.pending.text : T.approved.text }}>
                {modeHint}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowDocs(true)} style={actionBtn}>
              <FileText size={14} /> Documents
            </button>
            {showWorkspaceTools && (
              <>
                <button type="button" onClick={() => setShowQuick(true)} style={{ ...actionBtn, border: 'none', background: '#7C3AED', color: '#fff' }}>
                  <Zap size={14} /> Quick Access
                </button>
                <button type="button" onClick={() => setShowTxn(true)} style={actionBtn}>
                  <Receipt size={14} /> Transaction
                </button>
                {can('fraud.view') && (
                <button type="button" onClick={() => setShowFraud(true)} style={{ ...actionBtn, background: T.rejected.bg, color: T.rejected.color, border: `1px solid ${T.rejected.border}` }}>
                  <ShieldAlert size={14} /> Fraud
                </button>
                )}
              </>
            )}
            {!browseMode && hasSuperUserAccess(userRoles, user?.username) && (
              <button type="button" onClick={() => setShowAssign(true)} style={actionBtn}>
                <UserPlus size={14} /> Assign
              </button>
            )}
          </div>
        </div>

        {claim.acuity && (
          <div style={{ marginBottom: '8px' }}>
            <AcuityDecisionPanel acuity={claim.acuity} inline />
          </div>
        )}

        <CaseSummaryPanel claim={claim} demogs={demogs} />

        {/* Main tabs — primary content, visible immediately */}
        <div style={{ background: WS.card, borderRadius: '10px', border: `1px solid ${WS.border}`, overflow: 'hidden' }}>
          {tabLoading && (
            <div style={{ padding: '6px 12px', fontSize: '11px', background: T.pending.bg, color: T.pending.text }}>Loading tab data…</div>
          )}
          <div style={{ display: 'flex', borderBottom: `1px solid ${WS.border}`, overflowX: 'auto', background: WS.surfaceSubtle }}>
            {TABS.filter((tab) => (
              tab === 'Assessment' ? can('assessment.view')
              : tab === 'Decision & Summary' ? can('decision.view')
              : true
            )).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderBottom: activeTab === tab ? `2px solid ${WS.primary}` : '2px solid transparent',
                  background: activeTab === tab ? WS.card : 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: activeTab === tab ? 700 : 600,
                  color: activeTab === tab ? WS.primary : WS.textSecondary,
                  fontFamily: 'Inter,sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div style={{ padding: '16px' }}>
            {activeTab === 'Demographics' && (
              <DemographicsWorkspaceTab
                claim={claim}
                demogs={demogs}
                canEdit={effectiveCanEdit}
                onPatch={patchPolicyData}
                onOpenFraud={can('fraud.view') ? () => setShowFraud(true) : undefined}
              />
            )}
            {activeTab === 'Requirements' && (
              loadedTabs.has('Requirements') ? (
                <RequirementsWorkspaceTab
                  requirements={workspaceRaw?.requirements}
                  canEdit={effectiveCanEdit}
                  onPatch={patchPolicyData}
                />
              ) : (
                <div style={{ color: WS.textMuted }}>Open this tab to load requirements.</div>
              )
            )}
            {activeTab === 'Assessment' && (
              loadedTabs.has('Assessment') ? (
                <AssessmentWorkspaceTab
                  assessment={workspaceRaw?.assessment}
                  canEdit={effectiveCanEdit && can('assessment.act')}
                  onPatch={patchPolicyData}
                />
              ) : (
                <div style={{ color: WS.textMuted }}>Open this tab to load assessment.</div>
              )
            )}
            {activeTab === 'Decision & Summary' && (
              loadedTabs.has('Decision & Summary') ? (
                <DecisionWorkspaceTab
                  claim={claim}
                  calcAmt={calcResult}
                  userRoles={userRoles}
                  userRole={user?.role}
                  claimRole={claim?.claimRole}
                  assessorCanEdit={assessorCanEdit && can('decision.act')}
                  verifierCanEdit={verifierCanEdit && can('decision.act')}
                  accessorDecision={accessorDecision}
                  setAccessorDecision={setAccessorDecision}
                  accessorReason={accessorReason}
                  setAccessorReason={setAccessorReason}
                  accessorAmount={accessorAmount}
                  setAccessorAmount={setAccessorAmount}
                  verificationStatus={verificationStatus}
                  setVerificationStatus={setVerificationStatus}
                  verificationRemarks={verificationRemarks}
                  setVerificationRemarks={setVerificationRemarks}
                  submitGuard={submitState}
                  workflowGuard={workflowGuard}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                />
              ) : (
                <div style={{ color: WS.textMuted }}>Open this tab to load decision & summary.</div>
              )
            )}
          </div>
        </div>
      </div>

      <QuickAccessModal open={showQuick} onClose={() => setShowQuick(false)} policyData={policyData} onSave={patchPolicyData} disabled={!canEdit} />
      {can('fraud.view') && (
      <FraudRuleManagerModal
        open={showFraud}
        onClose={() => setShowFraud(false)}
        claimNumber={resolvedClaimId}
        policyId={claim.policyId}
        fraudContext={{
          ...claim.fraudContext,
          intimation: demogs?.intimation || claim.fraudContext?.intimation,
          lifeAssured: demogs?.lifeAssured || claim.fraudContext?.lifeAssured,
          claimant: demogs?.claimant || claim.fraudContext?.claimant,
          eagle: demogs?.eagle,
        }}
        userRole={userRoles[0]}
        username={user?.username || sessionStorage.getItem('loggedUser')}
        enableAssessor={canEdit}
      />
      )}
      <TransactionDetailsModal
        open={showTxn}
        onClose={() => setShowTxn(false)}
        policyId={claim.policyId}
        claimId={resolvedClaimId}
        txnDate={demogs?.intimation?.intimationDate || demogs?.intimation?.initiationDate || claim.intimationDate}
        calcAmt={calcResult}
      />
      <ClaimSuccessModal
        open={Boolean(submitSuccess)}
        title={submitSuccess?.mode === 'verifier' ? 'Verification Submitted!' : 'Assessment Submitted!'}
        message={
          submitSuccess?.mode === 'verifier'
            ? 'Your verification decision has been saved successfully and the claim has been updated.'
            : 'Your assessment decision has been saved successfully and the claim has been updated.'
        }
        claimNo={submitSuccess?.claimId}
        primaryLabel={submitSuccess?.mode === 'verifier' ? 'Back to Claim Search' : 'Back to My Tasks'}
        onPrimary={() => {
          const mode = submitSuccess?.mode
          setSubmitSuccess(null)
          navigate(mode === 'verifier' ? '/claim-search' : '/my-task')
        }}
        secondaryLabel="Stay on Claim"
        onSecondary={() => setSubmitSuccess(null)}
      />
      <ClaimAssignModal open={showAssign} onClose={() => setShowAssign(false)} claimNumber={resolvedClaimId} mode={verifierCanEdit ? 'verifier' : 'assessor'} />
      <DocumentSideSlider open={showDocs} onClose={() => setShowDocs(false)} claimId={resolvedClaimId} readOnly={!canEdit || !can('documents.upload')} />
    </AppLayout>
  )
}
