import { useState, useEffect } from 'react'
import { useToast } from '../Toast'
import { useTheme } from '../../context/ThemeContext'
import { alertBannerStyle } from '../../ui/pageTokens'
import {
  fraudPreventionService,
  ruleTwoService,
  ruleThreeService,
  ruleFourService,
  addAccessorFeedback,
  getExistingFeedback,
  updateAccessorFeedback,
} from '../../services/fraudPreventionService'


const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(3px)',
}

function RuleBlock({ title, children, flagged }) {
  const { tokens: T } = useTheme()
  const panel = flagged ? alertBannerStyle(T, 'danger') : { background: T.surfaceMuted, border: `1px solid ${T.border}` }
  return (
    <div
      style={{
        marginBottom: '12px',
        padding: '14px',
        borderRadius: '10px',
        ...panel,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '13px', color: T.textPrimary, marginBottom: '8px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function ClaimFraudPreventionModal({
  open,
  onClose,
  claimNumber,
  fraudContext,
  userRole,
  username,
}) {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)
  const [rule1, setRule1] = useState(null)
  const [rule2, setRule2] = useState([])
  const [rule3, setRule3] = useState([])
  const [rule4, setRule4] = useState([])
  const [remarks, setRemarks] = useState({
    rule1: '',
    rule2: '',
    rule3: '',
    rule4: '',
  })

  const intimation = fraudContext?.intimation || {}
  const lifeAssured = fraudContext?.lifeAssured || {}
  const pincode = lifeAssured.pincode || lifeAssured.pinCode || lifeAssured.resPincode || ''
  const city = lifeAssured.city || lifeAssured.resCity || ''
  const source = intimation.source || ''

  useEffect(() => {
    if (!open || !claimNumber) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        const [pinRes, bankRes, agentRes, mobileRes, existing] = await Promise.all([
          fraudPreventionService(pincode, city).catch(() => null),
          ruleTwoService().catch(() => []),
          ruleThreeService(source).catch(() => []),
          ruleFourService([lifeAssured.mobileNo, lifeAssured.mobile].filter(Boolean)).catch(() => []),
          getExistingFeedback(claimNumber),
        ])

        if (cancelled) return
        setRule1(pinRes && typeof pinRes === 'object' ? pinRes : null)
        setRule2(Array.isArray(bankRes) ? bankRes : bankRes?.data || [])
        setRule3(Array.isArray(agentRes) ? agentRes : agentRes?.data || [])
        setRule4(Array.isArray(mobileRes) ? mobileRes : mobileRes?.data || [])
        setHasExisting(Boolean(existing && Object.keys(existing).length))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [open, claimNumber, pincode, city, source, lifeAssured.mobileNo, lifeAssured.mobile])

  if (!open) return null

  const buildFeedback = () => {
    const feedback = {}
    if (rule1 && (rule1.pincodeExist === 'No' || rule1.cityExist === 'No')) {
      feedback.rule1 = { status: 'Flagged', remark: remarks.rule1 }
    }
    if (rule2?.length) feedback.rule2 = { status: 'Review', remark: remarks.rule2 }
    if (rule3?.length) feedback.rule3 = { status: 'Review', remark: remarks.rule3 }
    if (rule4?.length) feedback.rule4 = { status: 'Review', remark: remarks.rule4 }
    return feedback
  }

  const handleSave = async () => {
    const feedback = buildFeedback()
    if (!Object.keys(feedback).length) {
      toast('warning', 'Nothing to save', 'No flagged rules to record.')
      return
    }
    setSaving(true)
    try {
      const role = userRole || 'Assessor'
      if (hasExisting) {
        await updateAccessorFeedback(feedback, claimNumber)
      } else {
        await addAccessorFeedback(feedback, claimNumber, role, username)
      }
      toast('success', 'Saved', 'Fraud prevention remarks saved for this claim.')
      onClose()
    } catch (e) {
      toast('error', 'Save failed', e?.message || 'Could not save fraud remarks.')
    } finally {
      setSaving(false)
    }
  }

  const rule1Flagged = rule1 && (rule1.pincodeExist === 'No' || rule1.cityExist === 'No')

  const panelStyle = {
    background: T.card,
    borderRadius: '16px',
    width: 'min(720px, 94vw)',
    maxHeight: '88vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: T.textPrimary }}>Fraud Prevention</div>
            <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '4px' }}>Claim {claimNumber} — per-claim eagle rules (v1)</div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', color: T.textMuted }}>×</button>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: T.textMuted, padding: '24px' }}>Running fraud checks…</div>
          ) : (
            <>
              <RuleBlock title="Rule I — Safe city / pincode" flagged={rule1Flagged}>
                {rule1 ? (
                  <div style={{ fontSize: '12px', color: T.textMuted }}>
                    Pincode match: {rule1.pincodeExist || '—'} · City match: {rule1.cityExist || '—'}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: T.textMuted }}>No pincode/city data.</div>
                )}
                {rule1Flagged && (
                  <textarea
                    value={remarks.rule1}
                    onChange={(e) => setRemarks((p) => ({ ...p, rule1: e.target.value }))}
                    placeholder="Assessor remark for Rule I"
                    rows={2}
                    style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif', fontSize: '12px' }}
                  />
                )}
              </RuleBlock>

              <RuleBlock title="Rule II — Claimant bank details" flagged={rule2.length > 0}>
                <div style={{ fontSize: '12px', color: T.textMuted }}>{rule2.length} match(es) from watchlist.</div>
                {rule2.length > 0 && (
                  <textarea
                    value={remarks.rule2}
                    onChange={(e) => setRemarks((p) => ({ ...p, rule2: e.target.value }))}
                    placeholder="Remark for Rule II"
                    rows={2}
                    style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif', fontSize: '12px' }}
                  />
                )}
              </RuleBlock>

              <RuleBlock title="Rule III — Agent trend" flagged={rule3.length > 0}>
                <div style={{ fontSize: '12px', color: T.textMuted }}>Source: {source || '—'} · {rule3.length} hit(s)</div>
                {rule3.length > 0 && (
                  <textarea
                    value={remarks.rule3}
                    onChange={(e) => setRemarks((p) => ({ ...p, rule3: e.target.value }))}
                    placeholder="Remark for Rule III"
                    rows={2}
                    style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif', fontSize: '12px' }}
                  />
                )}
              </RuleBlock>

              <RuleBlock title="Rule IV — Mobile number" flagged={rule4.length > 0}>
                <div style={{ fontSize: '12px', color: T.textMuted }}>{rule4.length} match(es)</div>
                {rule4.length > 0 && (
                  <textarea
                    value={remarks.rule4}
                    onChange={(e) => setRemarks((p) => ({ ...p, rule4: e.target.value }))}
                    placeholder="Remark for Rule IV"
                    rows={2}
                    style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif', fontSize: '12px' }}
                  />
                )}
              </RuleBlock>
            </>
          )}
        </div>

        <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.surfaceMuted, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'Inter,sans-serif' }}
          >
            {saving ? 'Saving…' : 'Save remarks'}
          </button>
        </div>
      </div>
    </div>
  )
}
