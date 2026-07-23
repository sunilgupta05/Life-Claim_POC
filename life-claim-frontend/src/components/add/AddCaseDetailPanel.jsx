import { useState, useEffect } from 'react'
import { useAddUiTokens } from '../../components/add/AddUi'
import { useToast } from '../Toast'
import { getCaseDetails, refreshLifeAsiaData } from '../../services/add/AssessmentPool'
import { getDecisionMasterData } from '../../services/add/decisionService'
import CapsDecisionPanel from './CapsDecisionPanel'
import { formatProductName } from '../../util/formatProductName'
import { ROField, ROGrid, SectionTitle, PrimaryBtn } from './AddUi'

const CASE_SUB_TABS = ['Demographics', 'Assessment', 'Decisions', 'Requirement & Comm']

function formatHeaderDate(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw).split('T')[0]
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AddCaseDetailPanel({
  caseId,
  fallback,
  detail: detailProp,
  onDetailChange,
  compact = false,
}) {
  const T = useAddUiTokens()
  const toast = useToast()
  const [subTab, setSubTab] = useState('Demographics')
  const [loading, setLoading] = useState(!detailProp && !!caseId)
  const [detail, setDetail] = useState(detailProp || null)
  const [master, setMaster] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = async ({ silent = false } = {}) => {
    if (!caseId) return
    if (!silent) setLoading(true)
    try {
      const [caseRes, masterRes] = await Promise.all([
        getCaseDetails(caseId),
        getDecisionMasterData().catch(() => null),
      ])
      if (caseRes?.success === false) {
        throw new Error(caseRes.error || 'Failed to load case')
      }
      const data = caseRes?.data || caseRes
      setDetail(data)
      onDetailChange?.(data)
      setMaster(masterRes?.data || masterRes)
    } catch (e) {
      if (!silent) {
        toast('error', 'Load failed', e?.message || 'Could not load case details.')
        setDetail(null)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const refreshAfterSave = () => load({ silent: true })

  useEffect(() => {
    if (detailProp) {
      setDetail(detailProp)
      setLoading(false)
      return
    }
    load()
  }, [caseId, detailProp])

  useEffect(() => {
    if (!master) {
      getDecisionMasterData().then((res) => setMaster(res?.data || res)).catch(() => {})
    }
  }, [])

  const info = detail?.caseInfo || {}
  const la = detail?.lifeAssured || {}
  const contract = detail?.contractDetails || detail?.contract || {}

  const handleRefreshAsia = async () => {
    setRefreshing(true)
    try {
      const res = await refreshLifeAsiaData(caseId)
      if (res?.success === false) throw new Error(res.error || 'Refresh failed')
      toast('success', 'Refreshed', 'Life Asia data refreshed; exclusion rules re-applied.')
      await load()
    } catch (e) {
      toast('error', 'Refresh failed', e?.message || 'Could not refresh.')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return <div style={{ padding: compact ? '16px' : '24px', color: T.textMuted, fontSize: '13px' }}>Loading case {caseId}…</div>
  }

  if (!detail && fallback) {
    return (
      <ROGrid cols={compact ? 2 : 3}>
        {[['Case ID', fallback.caseId], ['Policy', fallback.policyNumber], ['KRN', fallback.krn], ['Status', fallback.status], ['Assigned', fallback.assignedTo]].map(([k, v]) => (
          <ROField key={k} label={k} value={v} />
        ))}
      </ROGrid>
    )
  }

  const tabContent = {
    Demographics: (
      <>
        <SectionTitle>Case summary</SectionTitle>
        <ROGrid cols={compact ? 2 : 3}>
          <ROField label="Case ID" value={info.caseId || caseId} />
          <ROField label="Policy No" value={info.policyNo} />
          <ROField label="KRN" value={info.krn} />
          <ROField label="Triggered Date" value={formatHeaderDate(info.triggeredDate)} />
          <ROField label="Referral Date" value={formatHeaderDate(info.referralDate)} />
          <ROField label="Activity Status" value={info.activityStatus} />
          <ROField label="Exclusion Type" value={info.exclusionType} />
          <ROField label="User Id" value={info.userId} />
          <ROField label="Assigned To" value={info.assignedTo || 'Unassigned'} />
          <ROField label="Initial Remark" value={info.initialCaseRemark} span />
        </ROGrid>
        <div style={{ marginTop: '16px' }}>
          <SectionTitle>Life assured</SectionTitle>
          <ROGrid cols={compact ? 2 : 3}>
            <ROField label="Name" value={la.name} />
            <ROField label="Client ID" value={la.clientID} />
            <ROField label="DOB" value={formatHeaderDate(la.dob)} />
            <ROField label="Age" value={la.age} />
            <ROField label="Gender" value={la.gender} />
            <ROField label="Occupation" value={la.occupation} />
            <ROField label="Education" value={la.education} />
            <ROField label="Income" value={la.income} />
            <ROField label="Resident Status" value={la.residentStatus} />
            <ROField label="Address" value={[la.flat, la.area, la.road, la.city, la.state, la.pinCode].filter(Boolean).join(', ') || '—'} span />
            <ROField label="Mobile" value={la.mobileNo || la.mobile_no} />
          </ROGrid>
        </div>
        <div style={{ marginTop: '16px' }}>
          <SectionTitle>Contract</SectionTitle>
          <ROGrid cols={compact ? 2 : 3}>
            <ROField label="Application No" value={contract.applicationNo} />
            <ROField label="Product" value={formatProductName(contract.productName || contract.product_name)} />
            <ROField label="Product Code" value={contract.productCode || contract.product_code} />
            <ROField label="Base SA" value={contract.baseSA || contract.baseSa || contract.base_sa} />
            <ROField label="Policy Status" value={contract.policyStatus || contract.policy_status} />
            <ROField label="RCD" value={formatHeaderDate(contract.rcd)} />
            <ROField label="Annual Premium" value={contract.annualPremium} />
            <ROField label="UW Decision" value={contract.uwDecision || contract.uw_decision} />
            <ROField label="Agent FSC" value={contract.agentFscName || contract.agentFscCode} />
          </ROGrid>
        </div>
        <div style={{ marginTop: '14px' }}>
          <PrimaryBtn onClick={handleRefreshAsia} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh from Life Asia'}
          </PrimaryBtn>
        </div>
      </>
    ),
    Assessment: (
      <div>
        <SectionTitle>Assessment (IRIS / investigation)</SectionTitle>
        <p style={{ fontSize: '12px', color: T.textMuted, marginBottom: '12px', lineHeight: 1.5 }}>
          IRIS investigation workflow is not fully wired in this build. Use <strong>Decisions</strong> for findings and SCN/SDDR, or refresh Life Asia on Demographics to update pool exclusion flags.
        </p>
        <ROGrid cols={2}>
          <ROField label="IRIS Status (from case)" value={info.irisStatus || '—'} />
          <ROField label="Suggested recommendation" value="—" />
          <ROField label="Investigation findings" value="—" span />
        </ROGrid>
      </div>
    ),
    Decisions: (
      <CapsDecisionPanel
        caseId={caseId}
        policyNo={info.policyNo}
        krn={info.krn}
        caseStatus={info.activityStatus}
        master={master}
        savedFindings={detail?.findings || []}
        savedDecision={detail?.decision}
        onSaved={refreshAfterSave}
        toast={toast}
      />
    ),
    'Requirement & Comm': (
      <div style={{ color: T.textMuted, fontSize: '13px', padding: '12px', background: T.surfaceMuted, borderRadius: '8px', border: `1px solid ${T.border}` }}>
        Letter and SMS communication for case <strong style={{ color: T.primary }}>{caseId}</strong> will be available here. Requirements for linked life claims are managed in the main claim workspace.
      </div>
    ) }

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: '16px', flexWrap: 'wrap' }}>
        {CASE_SUB_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSubTab(t)}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderBottom: subTab === t ? `2px solid ${T.primary}` : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: subTab === t ? 700 : 500,
              color: subTab === t ? T.primary : T.textMuted,
              fontFamily: 'Inter,sans-serif',
              marginBottom: '-1px' }}
          >
            {t}
          </button>
        ))}
      </div>
      {tabContent[subTab]}
    </div>
  )
}
