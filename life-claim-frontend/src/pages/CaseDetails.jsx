import { useState, useEffect, useCallback } from 'react'
import { useAddUiTokens } from '../components/add/AddUi'
import { useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import AddCaseDetailPanel from '../components/add/AddCaseDetailPanel'
import { getCaseDetails } from '../services/add/AssessmentPool'
import { useToast } from '../components/Toast'
import { ArrowLeft } from 'lucide-react'
import { ROField, ROGrid } from '../components/add/AddUi'

function formatHeaderDate(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw).split('T')[0]
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CaseDetails() {
  const T = useAddUiTokens()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const navCase = location.state?.case
  const resolvedCaseId = String(
    location.state?.caseId || navCase?.caseId || sessionStorage.getItem('activeAddCaseId') || '',
  ).trim()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!resolvedCaseId) return
    try {
      sessionStorage.setItem('activeAddCaseId', resolvedCaseId)
    } catch {
      // ignore storage errors
    }
  }, [resolvedCaseId])

  const loadDetail = useCallback(async () => {
    if (!resolvedCaseId) return
    setLoading(true)
    try {
      const res = await getCaseDetails(resolvedCaseId)
      if (res?.success === false) throw new Error(res.error || 'Failed to load case')
      setDetail(res?.data || res)
    } catch (e) {
      toast('error', 'Case load failed', e?.message || 'Could not open this case.')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [resolvedCaseId, toast])

  useEffect(() => {
    if (!resolvedCaseId) {
      toast('warning', 'Case required', 'Open a case from the Assessment Pool or Case Search.')
      navigate('/add-screen?tab=assess-pool')
      return
    }
    loadDetail()
  }, [resolvedCaseId, loadDetail, navigate, toast])

  const info = detail?.caseInfo || {}
  const caseId = info.caseId || resolvedCaseId
  const policyNo = info.policyNo || navCase?.policyNumber || navCase?.policyId || '—'
  const krn = info.krn || navCase?.krn || '—'
  const status = info.activityStatus || navCase?.status || '—'

  const backToPool = () => {
    const poolSubTab = location.state?.poolSubTab || 'N'
    navigate('/add-screen?tab=assess-pool', {
      state: { addTab: 'assess-pool', poolSubTab },
    })
  }

  return (
    <AppLayout pageTitle={`Case ${caseId}`} pageSubtitle="Advance Intelligence case workspace">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <button
          type="button"
          onClick={backToPool}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.hoverBg, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: T.textMuted }}
        >
          <ArrowLeft size={16} /> Back to Assessment Pool
        </button>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>Loading case workspace…</div>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, margin: '0 0 8px' }}>Case {caseId}</h1>
              <ROGrid cols={3}>
                <ROField label="Policy No" value={policyNo} />
                <ROField label="KRN" value={krn} />
                <ROField label="Activity Status" value={status} />
                <ROField label="Referral Date" value={formatHeaderDate(info.referralDate)} />
                <ROField label="Triggered Date" value={formatHeaderDate(info.triggeredDate)} />
                <ROField label="Exclusion Type" value={info.exclusionType || '—'} />
              </ROGrid>
            </div>

            <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '24px' }}>
              <AddCaseDetailPanel
                caseId={caseId}
                fallback={navCase}
                detail={detail}
                onDetailChange={setDetail}
              />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
