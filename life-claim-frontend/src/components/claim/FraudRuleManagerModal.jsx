import { useState, useEffect, useMemo } from 'react'
import { useToast } from '../Toast'
import { useTheme } from '../../context/ThemeContext'
import { alertBannerStyle, fieldInputStyle } from '../../ui/pageTokens'
import {
  fraudPreventionService,
  ruleTwoService,
  ruleThreeService,
  ruleFourService,
  addAccessorFeedback,
  getExistingFeedback,
  updateAccessorFeedback,
} from '../../services/fraudPreventionService'


const DECISIONS = ['positive', 'negative', 'suspicious']

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

function normalizeHits(data) {
  if (Array.isArray(data)) return data
  if (typeof data === 'string') return []
  return data?.data || data?.rows || []
}

function claimKey(row) {
  return row?.claim_number || row?.claim_id || row?.CLAIM_NUMBER || row?.CLAIM_ID || ''
}

/** Rule II — keep cross-claim hits tied to this claim's bank/account (not entire DB). */
function filterBankHits(rows, claimNumber, policyId, eagle = {}) {
  const acc = eagle.accNo || eagle.acc_no || ''
  const bank = eagle.bankName || eagle.bank_name || ''
  return rows.filter((row) => {
    const key = claimKey(row)
    if (key && key === claimNumber) return false
    if (acc && String(row.acc_no || row.accNo || '') === String(acc)) return true
    if (bank && String(row.bank_name || row.bankName || '') === String(bank)) return true
    if (policyId && String(row.policy_id || row.policyId || '') === String(policyId)) return true
    return false
  })
}

/** Rule IV — other claims sharing LA mobile(s), excluding this claim. */
function filterMobileHits(rows, claimNumber) {
  return rows.filter((row) => {
    const key = claimKey(row)
    return key && key !== claimNumber
  })
}

function mapExistingRows(rows) {
  const state = {
    rule1: { decision: '', remark: '' },
    rule2: { decision: '', remark: '' },
    rule3: { decision: '', remark: '' },
    rule4: { decision: '', remark: '' },
  }
  if (!Array.isArray(rows)) return state
  rows.forEach((row, idx) => {
    const code = String(row.ruleCode ?? row.RULECODE ?? idx + 1).replace(/\D/g, '') || String(idx + 1)
    const key = `rule${code}`
    if (state[key]) {
      state[key] = {
        decision: row.decision || row.DECISION || '',
        remark: row.remark || row.REMARK || '',
      }
    }
  })
  return state
}

function buildAddPayload(visibleKeys, ruleState) {
  const feedback = {}
  visibleKeys.forEach((key) => {
    const n = key.replace(/\D/g, '')
    const s = ruleState[key]
    if (!s?.decision && !s?.remark?.trim()) return
    feedback[key] = {
      [`status${n}`]: s.decision,
      [`remarks${n}`]: s.remark,
      decision: s.decision,
      remark: s.remark,
    }
  })
  return feedback
}

function buildUpdatePayload(claimNumber, visibleKeys, ruleState) {
  const feedback = {}
  visibleKeys.forEach((key) => {
    const n = key.replace(/\D/g, '')
    feedback[key] = {
      claim_id: claimNumber,
      ruleCode: n,
      decision: ruleState[key].decision,
      remark: ruleState[key].remark,
    }
  })
  return feedback
}

function HitTable({ rows }) {
  const { tokens: T } = useTheme()
  if (!rows?.length) return null
  const keys = Object.keys(rows[0] || {}).slice(0, 5)
  return (
    <div style={{ marginTop: '8px', overflowX: 'auto', maxHeight: '120px', border: `1px solid ${T.border}`, borderRadius: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: T.surfaceMuted }}>
            {keys.map((k) => (
              <th key={k} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: T.textMuted }}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: T.card }}>
              {keys.map((k) => (
                <td key={k} style={{ padding: '6px 8px', color: T.textSecondary }}>{String(row[k] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 8 && <div style={{ padding: '6px 8px', fontSize: '10px', color: T.textSubtle }}>+{rows.length - 8} more (sensitive cross-claim data)</div>}
    </div>
  )
}

function RulePanel({ title, subtitle, children, visible, decision, remark, onDecision, onRemark, disabled }) {
  const { tokens: T } = useTheme()
  const panel = alertBannerStyle(T, 'danger')
  if (!visible) return null
  return (
    <div style={{ marginBottom: '14px', padding: '14px', borderRadius: '10px', ...panel }}>
      <div style={{ fontWeight: 800, fontSize: '13px', color: T.rejected.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '4px', marginBottom: '8px' }}>{subtitle}</div>}
      {children}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
        <div>
          <label style={{ fontSize: '10px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Decision</label>
          <select
            value={decision}
            onChange={(e) => onDecision(e.target.value)}
            disabled={disabled}
            style={fieldInputStyle(T, { width: '100%', height: '36px', marginTop: '4px', borderRadius: '7px', fontSize: '12px' })}
          >
            <option value="">— Select —</option>
            {DECISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Remarks</label>
          <textarea
            value={remark}
            onChange={(e) => onRemark(e.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="Assessor remarks for this rule"
            style={fieldInputStyle(T, { width: '100%', marginTop: '4px', padding: '8px', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' })}
          />
        </div>
      </div>
    </div>
  )
}

/** Section G — per-claim Rule Manager (4 eagle rules). */
export default function FraudRuleManagerModal({
  open,
  onClose,
  claimNumber,
  policyId,
  fraudContext,
  userRole,
  username,
  enableAssessor = false,
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
  const [ruleState, setRuleState] = useState({
    rule1: { decision: '', remark: '' },
    rule2: { decision: '', remark: '' },
    rule3: { decision: '', remark: '' },
    rule4: { decision: '', remark: '' },
  })

  const intimation = fraudContext?.intimation || {}
  const lifeAssured = fraudContext?.lifeAssured || {}
  const eagle = fraudContext?.eagle || {}
  const eagleAcc = eagle.accNo || eagle.acc_no || ''
  const eagleBank = eagle.bankName || eagle.bank_name || ''
  const claimant0 = (fraudContext?.claimant || [])[0] || {}
  const pincode = claimant0.pincode || claimant0.pinCode || claimant0.PINCODE || lifeAssured.pincode || lifeAssured.pinCode || ''
  const city = claimant0.city || claimant0.resCity || claimant0.CITY || lifeAssured.city || lifeAssured.resCity || ''
  const source = intimation.source || ''
  const laMobile1 = lifeAssured.mobileNo1 || lifeAssured.mobile_No1 || lifeAssured.mobileNo || lifeAssured.mobile || ''
  const laMobile2 = lifeAssured.mobileNo2 || lifeAssured.mobile_No2 || ''

  const rule1Visible = rule1 && (rule1.pincodeExist === 'No' || rule1.cityExist === 'No')
  const rule2Visible = rule2.length > 0
  const rule3Visible = rule3.length > 0
  const rule4Visible = rule4.length > 0

  const visibleKeys = useMemo(() => {
    const keys = []
    if (rule1Visible) keys.push('rule1')
    if (rule2Visible) keys.push('rule2')
    if (rule3Visible) keys.push('rule3')
    if (rule4Visible) keys.push('rule4')
    return keys
  }, [rule1Visible, rule2Visible, rule3Visible, rule4Visible])

  useEffect(() => {
    if (!open || !claimNumber) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const [pinRes, bankRes, agentRes, mobileRes, existing] = await Promise.all([
          pincode || city ? fraudPreventionService(pincode, city).catch(() => null) : Promise.resolve(null),
          ruleTwoService(claimNumber).catch(() => []),
          source ? ruleThreeService(source, claimNumber).catch(() => []) : Promise.resolve([]),
          laMobile1 || laMobile2
            ? ruleFourService({ LA_number1: laMobile1, LA_number2: laMobile2 }).catch(() => [])
            : Promise.resolve([]),
          getExistingFeedback(claimNumber),
        ])
        if (cancelled) return
        setRule1(pinRes && typeof pinRes === 'object' && !pinRes.message ? pinRes : null)
        setRule2(filterBankHits(normalizeHits(bankRes), claimNumber, policyId, eagle))
        setRule3(normalizeHits(agentRes))
        setRule4(filterMobileHits(normalizeHits(mobileRes), claimNumber))
        const existingRows = Array.isArray(existing) ? existing : existing?.data || []
        setHasExisting(existingRows.length > 0)
        setRuleState(mapExistingRows(existingRows))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [open, claimNumber, policyId, pincode, city, source, laMobile1, laMobile2, eagleAcc, eagleBank])

  const setRule = (key, field, val) => setRuleState((p) => ({ ...p, [key]: { ...p[key], [field]: val } }))

  if (!open) return null

  const handleSave = async (confirmed = false) => {
    if (!enableAssessor) {
      toast('warning', 'Read-only', 'Open this claim from My Task (work mode) to save eagle feedback.')
      return
    }
    if (visibleKeys.length === 0) {
      toast('info', 'No triggered rules', 'None of the four rules fired for this claim.')
      return
    }
    const incomplete = visibleKeys.some((k) => !ruleState[k].decision)
    if (incomplete) {
      toast('warning', 'Decision required', 'Select positive / negative / suspicious for each visible rule.')
      return
    }
    if (hasExisting && !confirmed) {
      if (!window.confirm('Overwrite existing eagle rule feedback for this claim?')) return
    }
    setSaving(true)
    try {
      const result = hasExisting
        ? await updateAccessorFeedback(buildUpdatePayload(claimNumber, visibleKeys, ruleState), claimNumber)
        : await addAccessorFeedback(buildAddPayload(visibleKeys, ruleState), claimNumber, userRole || 'Assessor', username)
      if (result?.success === false) {
        throw new Error(result.message || 'Save rejected by server')
      }
      toast('success', 'Saved', hasExisting ? 'Eagle rules updated.' : 'Eagle rules saved.')
      onClose()
    } catch (e) {
      toast('error', 'Save failed', e?.message || 'Could not save eagle feedback.')
    } finally {
      setSaving(false)
    }
  }

  const panelStyle = {
    background: T.card,
    borderRadius: '16px',
    width: 'min(760px, 94vw)',
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
            <div style={{ fontWeight: 800, fontSize: '16px' }}>Fraud Prevention — Rule Manager</div>
            <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '4px' }}>
              Claim {claimNumber} · checks run on open · feedback stored in caps_eagle_rule_details 
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
          {!enableAssessor && (
            <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, ...alertBannerStyle(T, 'info') }}>
              Browse mode — review only. Save/update disabled.
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: T.textMuted }}>Running fraud checks…</div>
          ) : visibleKeys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: T.textMuted, fontSize: '13px' }}>
              No rules triggered for this claim (safe city/pincode and no cross-claim hits).
            </div>
          ) : (
            <>
              <RulePanel
                title="Rule I — Safe city / pincode"
                subtitle={`Pincode: ${rule1?.pincodeExist || '—'} · City: ${rule1?.cityExist || '—'} (${pincode || '—'}, ${city || '—'})`}
                visible={rule1Visible}
                decision={ruleState.rule1.decision}
                remark={ruleState.rule1.remark}
                onDecision={(v) => setRule('rule1', 'decision', v)}
                onRemark={(v) => setRule('rule1', 'remark', v)}
                disabled={!enableAssessor}
              />
              <RulePanel
                title="Rule II — Claimant bank details (cross-claim)"
                subtitle={`${rule2.length} hit(s) — banks outside allowed list`}
                visible={rule2Visible}
                decision={ruleState.rule2.decision}
                remark={ruleState.rule2.remark}
                onDecision={(v) => setRule('rule2', 'decision', v)}
                onRemark={(v) => setRule('rule2', 'remark', v)}
                disabled={!enableAssessor}
              >
                <HitTable rows={rule2} />
              </RulePanel>
              <RulePanel
                title="Rule III — Agent trend"
                subtitle={`Source: ${source || '—'} · agent type AG (server-side)`}
                visible={rule3Visible}
                decision={ruleState.rule3.decision}
                remark={ruleState.rule3.remark}
                onDecision={(v) => setRule('rule3', 'decision', v)}
                onRemark={(v) => setRule('rule3', 'remark', v)}
                disabled={!enableAssessor}
              >
                <HitTable rows={rule3} />
              </RulePanel>
              <RulePanel
                title="Rule IV — Mobile number"
                subtitle={`LA mobiles: ${laMobile1 || '—'} / ${laMobile2 || '—'}`}
                visible={rule4Visible}
                decision={ruleState.rule4.decision}
                remark={ruleState.rule4.remark}
                onDecision={(v) => setRule('rule4', 'decision', v)}
                onRemark={(v) => setRule('rule4', 'remark', v)}
                disabled={!enableAssessor}
              >
                <HitTable rows={rule4} />
              </RulePanel>
            </>
          )}
        </div>

        <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.surfaceMuted, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            Close
          </button>
          {visibleKeys.length > 0 && (
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || loading || !enableAssessor}
              style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: enableAssessor ? T.primary : '#CBD5E1', color: '#fff', fontWeight: 700, cursor: enableAssessor ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif' }}
            >
              {saving ? 'Saving…' : hasExisting ? 'Update Eagle Rules' : 'Save Eagle Rules'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
