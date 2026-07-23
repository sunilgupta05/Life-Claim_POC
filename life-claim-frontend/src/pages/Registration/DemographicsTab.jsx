// DemographicsTab v2 — null-safe
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Field, Input, Select, Textarea, SectionHeader, Grid, Btn, SubTabNav, InfoCard, useRegTokens } from './shared'
import { fetchPolicyDetails as fetchPolicyAPI, fetchAgentRepudiation } from '../../services/policyService'
import { getPortfolioService } from '../../services/statesService'
import { getCountries } from '../../services/masterService'
import { getCauseEvents } from '../../services/masterService'
import statesService from '../../services/statesService'
import placeOfDeathService from '../../services/placeOfDeathService'
import trapScoreService from '../../services/trapScoreService'
import { useToast } from '../../components/Toast'
import {
  validateDemographicsSection,
  validateDemographicsComplete,
  validateRowFields,
  validateClaimantDraft,
  showValidationToast
} from '../../util/registrationValidation'
import { validateIntimationDates, todayIsoDate } from '../../util/intimationDateValidation'
import {
  buildTrapScoreApiPayload,
  buildLocalTrapScoreFallback,
  computePolicyAge,
  syncDemographicsSections,
  asArray
} from '../../util/buildRegistrationPayload'
import { filterCauseEvents } from '../../util/normalizeCauseEvent'
import {
  getPolicyClients,
  buildPayeeDetailsArray,
  clientToPayeeRow,
  findSelectedPayee
} from '../../util/policyClients'
import { tonePanelStyle, toneLabelStyle, toneValueStyle, statusPillStyle, alertBannerStyle } from '../../ui/pageTokens'
import { buildPolicyRegistrationPrefill, countPrefillFields } from '../../util/prefillRegistrationFromPolicy'

/* ── Cause of Death Modal ── */
function CauseModal({ causes, loading, loadError, onSelect, onClose, onRetry }) {
  const T = useRegTokens()
  const [q, setQ] = useState('')
  const filtered = filterCauseEvents(causes, q)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ background: T.card, borderRadius: '16px', width: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '15px', color: T.textPrimary }}>Select Cause of Death / Event</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.textMuted }}>×</button>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search cause..." autoFocus
            style={{ width: '100%', height: '36px', padding: '0 12px', border: `1.5px solid ${T.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box', background: T.inputBg, color: T.textPrimary }}
            onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: '200px' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: T.textMuted }}>Loading cause master…</div>
          ) : loadError ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#B45309', marginBottom: '12px' }}>{loadError}</div>
              <Btn size='sm' onClick={onRetry}>Retry</Btn>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: T.textMuted }}>
              {causes.length === 0 ? 'No causes returned from the server.' : 'No causes match your search.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: T.surfaceMuted }}>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Code', 'Description', 'Category', 'Sub Type'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={`${c.causeCode || 'cause'}-${i}`} onClick={() => onSelect(c)} style={{ borderBottom: `1px solid ${T.borderSubtle}`, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.hoverBg} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: T.primary, fontFamily: 'monospace' }}>{c.causeCode}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: T.textSecondary }}>{c.causeDescription}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: T.textMuted }}>{c.causeCategory || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: T.textMuted }}>{c.claimSubType || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Dynamic table for Eagle Screen ── */
function DynamicTable({ title, columns, rows, onAdd, onDelete }) {
  const T = useRegTokens()
  const [selectedIndex, setSelectedIndex] = useState(null)

  useEffect(() => {
    if (selectedIndex == null) return
    if (selectedIndex >= rows.length) {
      setSelectedIndex(rows.length > 0 ? rows.length - 1 : null)
    }
  }, [rows.length, selectedIndex])

  const handleDeleteSelected = () => {
    if (selectedIndex == null || !rows.length) return
    onDelete(selectedIndex)
    setSelectedIndex(null)
  }

  const handleDeleteAt = (index, e) => {
    e?.stopPropagation?.()
    onDelete(index)
    if (selectedIndex === index) setSelectedIndex(null)
    else if (selectedIndex != null && selectedIndex > index) setSelectedIndex(selectedIndex - 1)
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn size='sm' variant='secondary' onClick={onAdd}>+ Add Row</Btn>
          <Btn
            size='sm'
            variant='danger'
            onClick={handleDeleteSelected}
            disabled={selectedIndex == null || rows.length === 0}
          >
            − Delete Row
          </Btn>
        </div>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', background: T.surfaceMuted, borderRadius: '8px', border: `1px dashed ${T.border}`, fontSize: '13px', color: T.textSubtle }}>
          No records added. Click &ldquo;+ Add Row&rdquo; to begin.
        </div>
      ) : (
        <>
          <div style={{ fontSize: '11px', color: T.textMuted, marginBottom: '6px' }}>
            Click a row to select it, then use &ldquo;Delete Row&rdquo; or the × action to remove.
          </div>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: T.surfaceMuted, borderBottom: `2px solid ${T.border}` }}>
                  {columns.map(c => <th key={c.key} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{c.label}</th>)}
                  <th style={{ padding: '8px 12px', width: '56px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase' }}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedIndex(i)}
                    style={{
                      borderBottom: `1px solid ${T.borderSubtle}`,
                      transition: 'background 0.1s',
                      cursor: 'pointer',
                      background: selectedIndex === i ? T.sectionOpenBg : 'transparent',
                      outline: selectedIndex === i ? `2px solid ${T.primary}` : 'none',
                      outlineOffset: '-2px'
                    }}
                  >
                    {columns.map(c => <td key={c.key} style={{ padding: '8px 12px', fontSize: '12px', color: T.textSecondary }}>{row[c.key] || '—'}</td>)}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteAt(i, e)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}
                        title="Delete this row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Add Row Modal ── */
function AddRowModal({ title, fields, onSave, onClose, onInvalid }) {
  const T = useRegTokens()
  const [form, setForm] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ background: T.card, borderRadius: '14px', width: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 48px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '14px', color: T.textPrimary }}>Add — {title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.textMuted }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {fields.map(f => (
              <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                <Field label={f.label} required={f.required}>
                  {f.options
                    ? <Select value={form[f.key]} onChange={e => set(f.key, e.target.value)} options={f.options} />
                    : <Input type={f.type || 'text'} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                  }
                </Field>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Btn variant='secondary' onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => {
            const { valid, missing } = validateRowFields(fields, form)
            if (!valid) { onInvalid?.(missing); return }
            onSave(form); onClose()
          }}>Save Row</Btn>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════
   DEMOGRAPHICS TAB
════════════════════════════════════ */
export default function DemographicsTab({ data, update, policy, setPolicy, onComplete }) {
  const T = useRegTokens()
  const toast = useToast()
  const fromRegisterGate = Boolean(policy?.registerForm)
  const secNum = (base) => (fromRegisterGate ? base - 1 : base)
  const secTitle = (base, label) => `${secNum(base)}. ${label}`
  const [open, setOpen] = useState(fromRegisterGate ? 'intimation' : 'register')
  const [completed, setCompleted] = useState(() => (fromRegisterGate ? new Set(['register']) : new Set()))
  const [causes, setCauses] = useState([])
  const [loadingCauses, setLoadingCauses] = useState(false)
  const [causeLoadError, setCauseLoadError] = useState('')
  const [showCauseModal, setShowCauseModal] = useState(false)
  const [showCauseWarning, setShowCauseWarning] = useState(false)
  const [loadingPolicy, setLoadingPolicy] = useState(false)
  const [addingRowFor, setAddingRowFor] = useState(null)
  const [generatingTrap, setGeneratingTrap] = useState(false)
  const [states, setStates] = useState([])
  const [placesOfDeath, setPlacesOfDeath] = useState([])
  const [countries, setCountries] = useState([])
  const sectionRefs = useRef({})

  useEffect(() => {
    if (!open) return undefined
    const el = sectionRefs.current[open]
    if (!el) return undefined
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [open])

  const policyClients = useMemo(() => getPolicyClients(policy), [policy])
  console.log("policy clients check", policyClients)
  console.log("life assured check", policyClients[0].city)
  console.log("life assured check name", policyClients[0].name)
  // Section 5 (Life Assured Address) only *displays* data.laCity||policyClients[0]?.city
  // as a fallback — it never commits that fallback into `data`. If the policy-load
  // prefill effect hasn't run yet (or runs before policyClients is populated), laCity/
  // laState/laPincode stay undefined and never reach the /register-claim payload.
  // Commit the fallback into state as soon as a life-assured client is available so the
  // value is guaranteed to be sent on submit.
  useEffect(() => {
    const la = policyClients[0]
    if (!la) return
    const patch = {}
    if (!data.laCity && la.city) patch.laCity = la.city
    if (!data.laState && la.state) patch.laState = la.state
    if (!data.laPincode && la.pincode) patch.laPincode = la.pincode
    if (!data.laFlat && la.flat) patch.laFlat = la.flat
    if (!data.laRoad && la.road) patch.laRoad = la.road
    if (!data.laArea && la.area) patch.laArea = la.area
    if (Object.keys(patch).length) update(patch)
  }, [policyClients])

  const todayMax = todayIsoDate()
  const intimationDateCheck = useMemo(
    () => validateIntimationDates(data, {
      policy,
      laDob: data.laDob || policyClients[0]?.dob
    }),
    [data, policy, policyClients]
  )
  const dateFieldErrors = intimationDateCheck.fieldErrors

  const policyAgeInfo = useMemo(
    () => computePolicyAge(data.dateOfDeathEvent, data.riskCommencementDate || policy?.riskCommencementDate),
    [data.dateOfDeathEvent, data.riskCommencementDate, policy?.riskCommencementDate]
  )

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const patch = {}
    if (!data.initiationDate) patch.initiationDate = today
    if (!data.intimationDate) patch.intimationDate = today
    if (fromRegisterGate && policy && !data.portfolioType && policy.productCode) {
      getPortfolioService(policy.productCode, policy.productName, policy.sumAssured)
        .then((pt) => { if (pt) update({ portfolioType: pt }) })
        .catch(() => { })
    }
    if (Object.keys(patch).length) update(patch)
  }, [])

  useEffect(() => {
    if (!policyAgeInfo.policyAgeLabel) return
    if (data.policyAge !== policyAgeInfo.policyAgeLabel || data.policyAge1 !== policyAgeInfo.policyAge1) {
      update({ policyAge: policyAgeInfo.policyAgeLabel, policyAge1: policyAgeInfo.policyAge1 })
    }
  }, [policyAgeInfo.policyAgeLabel, policyAgeInfo.policyAge1])

  const loadCauses = async () => {
    setLoadingCauses(true)
    setCauseLoadError('')
    try {
      const list = await getCauseEvents()
      setCauses(list)
      if (!list.length) {
        setCauseLoadError('Cause of claim list is not available. Please contact your administrator.')
      }
      return list
    } catch (e) {
      setCauses([])
      setCauseLoadError(e?.message || 'Could not load cause master list.')
      return []
    } finally {
      setLoadingCauses(false)
    }
  }

  useEffect(() => {
    loadCauses().catch(() => { })
    statesService.getAllStates().then(list => {
      setStates(list.map(s => s.STATE_NAME || s.state_name || s.name || s).filter(Boolean))
    })
    placeOfDeathService().then(list => {
      setPlacesOfDeath(list.map(p => p.place || p.PLACE || p).filter(Boolean))
    })
    getCountries().then((list) => {
      setCountries((list || []).map((c) => c.COUNTRY_NAME || c.country_name || c.name || c).filter(Boolean))
    }).catch(() => { })
  }, [])

  const toggle = (s) => setOpen(p => p === s ? null : s)
  const done = (s) => completed.has(s)
  const markDone = (s, { silent = false } = {}) => {
    setCompleted((p) => new Set([...p, s]))
    if (!silent) toast('success', 'Section Saved', `${s} saved successfully.`)
  }

  const sectionValidationOpts = { policy, fromRegisterGate }
  const canContinueSection = (sectionId) =>
    validateDemographicsSection(sectionId, data, sectionValidationOpts).valid
  const canCompleteDemographics = validateDemographicsComplete(data, sectionValidationOpts).valid

  const tryContinue = (sectionId, nextSection) => {
    const { valid, missing } = validateDemographicsSection(sectionId, data, sectionValidationOpts)
    if (!valid) {
      if (sectionId === 'cause') setShowCauseWarning(true)
      showValidationToast(toast, missing, 'Complete required fields')
      return
    }
    if (sectionId === 'cause') setShowCauseWarning(false)
    markDone(sectionId)
    setOpen(nextSection)
  }

  /* Policy fetch */
  const applyPolicyPrefill = (p, existing = data) => {
    const patch = buildPolicyRegistrationPrefill(p, existing)
    if (Object.keys(patch).length) update(patch)
    return patch
  }

  const handlePolicySearch = async () => {
    if (!data.policyId) { toast('warning', 'Missing', 'Please enter a policy number.'); return }
    setLoadingPolicy(true)
    try {
      const p = await fetchPolicyAPI(data.policyId.trim())
      setPolicy(p)
      let portfolioType = p.portfolioType
      try {
        portfolioType = await getPortfolioService(p.productCode, p.productName, p.sumAssured) || portfolioType
      } catch { /* keep policy value */ }
      const basePatch = {
        policyId: p.policyId,
        productCode: p.productCode,
        productName: p.productName,
        sumAssured: p.sumAssured,
        portfolioType,
        issueDate: p.issueDate,
        riskCommencementDate: p.riskCommencementDate,
        paidToDate: p.paidToDate,
        premiumStatus: p.premiumStatus,
        premiumFrequency: p.premiumFrequency,
        term: p.term,
        premPaidYrs: p.premPaidYrs,
        totalPremiumPaid: p.totalPremiumPaid,
        currentSA: p.currentSA,
        originalSA: p.originalSA,
        cashValue: p.cashValue,
        maturityValue: p.maturityValue,
        advisorCode: p.advisorCode,
        advisorStatus: p.advisorStatus,
        uwDecision: p.uwDecision,
        uwDecisionDate: p.uwDecisionDate,
      }
      const prefill = buildPolicyRegistrationPrefill(p, { ...data, ...basePatch })
      update({ ...basePatch, ...prefill })
      if (p.advisorCode) {
        fetchAgentRepudiation(p.advisorCode).then((ar) => {
          if (ar) setPolicy((prev) => ({ ...prev, agentRepudiation: asArray(ar?.data || ar) }))
        }).catch(() => { })
      }
      markDone('register', { silent: true })
      setOpen('intimation')
      const n = countPrefillFields(prefill)
      toast('success', 'Policy Loaded', `${p.policyId} — ${p.productName} loaded.${n ? ` ${n} contract/eagle field(s) prefilled.` : ''}`)
    } catch (e) { toast('error', 'Not Found', e.message) }
    finally { setLoadingPolicy(false) }
  }

  const policyStatusOnEvent = () =>
    data.policyStatusOnEvent || data.policyStatusOnDod || policy?.premiumStatus || 'IF'

  const openCauseModal = async () => {
    if (!data.dateOfDeathEvent) {
      toast('warning', 'Intimation required', `Complete Date of Death / Event in section ${secNum(2)} before selecting a cause.`)
      return
    }
    update({
      causeEventDate: data.dateOfDeathEvent,
      policyStatusOnEvent: policyStatusOnEvent(),
      policyStatusOnDod: data.policyStatusOnDod || policyStatusOnEvent()
    })
    setShowCauseModal(true)
    if (!causes.length) await loadCauses()
  }

  const applyPayeeSelection = (client) => {
    const patch = {
      selectedPayeeId: client.clientId,
      payeeName: client.name,
      payeeLastName: client.lastName,
      payeeClientId: client.clientId,
      payeeDob: client.dob,
      payeeGender: client.gender,
      payeeRole: client.role || '',
      payeeIdNumber: client.idNumber,
      payeePanNo: client.panNo,
      payeeFlat: client.flat,
      payeeRoad: client.road,
      payeeArea: client.area,
      payeeCity: client.city,
      payeeState: client.state,
      payeeCountry: client.country,
      payeePincode: client.pincode,
      payeeMobileNo: client.mobileNo,
      payeeTelNo: client.telNo,
      payeeEmailId: client.emailId,
      payeeRiskIndicator: client.riskIndicator
    }
    const merged = { ...data, ...patch }
    update({
      ...patch,
      selectedPayee: clientToPayeeRow(client, merged),
      payeeDetails: buildPayeeDetailsArray(policyClients, client.clientId, merged),
      ...(merged.eagleClaimantMobile ? {} : { eagleClaimantMobile: client.mobileNo || merged.eagleClaimantMobile }),
    })
  }

  const updatePayeeField = (partial) => {
    const next = { ...data, ...partial }
    if (!next.selectedPayeeId) {
      update(partial)
      return
    }
    const client = findSelectedPayee(policyClients, next.selectedPayeeId)
    update({
      ...partial,
      selectedPayee: clientToPayeeRow(client, next),
      payeeDetails: buildPayeeDetailsArray(policyClients, next.selectedPayeeId, next)
    })
  }

  const reloadPolicyClients = async () => {
    const id = (policy?.policyId || data.policyId || '').trim()
    if (!id) {
      toast('warning', 'Policy required', fromRegisterGate ? 'Return to Policy Search and fetch a policy first.' : 'Load a policy in section 1 first.')
      return
    }
    setLoadingPolicy(true)
    try {
      const p = await fetchPolicyAPI(id)
      setPolicy(p)
      const clients = getPolicyClients(p)
      if (!clients.length) {
        toast('warning', 'No clients', 'Life Asia returned no ClientDetails for this policy.')
      } else {
        toast('success', 'Policy reloaded', `${clients.length} client(s) loaded for payee selection.`)
      }
    } catch (e) {
      toast('error', 'Reload failed', e?.message || 'Could not reload policy.')
    } finally {
      setLoadingPolicy(false)
    }
  }

  const selectCause = (c) => {
    update({
      typeOfClaim: c.typeOfClaim,
      causeCode: c.causeCode,
      causeDescription: c.causeDescription,
      causeCategory: c.causeCategory,
      causeOfClaim: c.causeOfClaim || c.causeDescription || c.causeCode,
      causeSubType: c.claimSubType,
      claimSubType: c.claimSubType,
      claimRegistrationType: c.claimRegistrationType,
      causeEventDate: data.dateOfDeathEvent || data.causeEventDate,
      policyStatusOnEvent: policyStatusOnEvent(),
      policyStatusOnDod: data.policyStatusOnDod || policyStatusOnEvent()
    })
    setShowCauseModal(false)
    setShowCauseWarning(false)
    toast('success', 'Cause selected', c.causeDescription || c.causeCode)
  }

  /* Trap score */
  const handleTrapScore = async () => {
    setGeneratingTrap(true)
    const trapPayload = buildTrapScoreApiPayload(data, policy)
    try {
      const res = await trapScoreService(trapPayload)
      update({
        trapScore: res.trapScore,
        trapRisk: res.trapRisk,
        trapRemarks: res.trapRemarks,
        trapDate: res.trapDate,
        laAgeAtDeath: trapPayload.ageAtDeath,
        firPmReceived: trapPayload.firPmReceived
      })
      markDone('trap', { silent: true })
      const title = res.estimated ? 'Trap Score (estimated)' : 'Trap Score Generated'
      toast('success', title, `Score: ${res.trapScore} — Risk: ${res.trapRisk}`)
    } catch (e) {
      const fallback = buildLocalTrapScoreFallback(trapPayload)
      update({
        trapScore: fallback.trapScore,
        trapRisk: fallback.trapRisk,
        trapRemarks: fallback.trapRemarks,
        trapDate: fallback.trapDate,
        laAgeAtDeath: trapPayload.ageAtDeath,
        firPmReceived: trapPayload.firPmReceived
      })
      markDone('trap', { silent: true })
      toast(
        'warning',
        'Trap Score (local estimate)',
        `API error — estimated score ${fallback.trapScore} (${fallback.trapRisk}). ${e.message || ''}`.trim()
      )
    } finally {
      setGeneratingTrap(false)
    }
  }

  /* Eagle screen table columns */
  const HOSPITAL_COLS = [
    { key: 'hospitalName', label: 'Hospital Name' }, { key: 'admissionDate', label: 'Admission' }, { key: 'dischargeDate', label: 'Discharge' }, { key: 'diagnosis', label: 'Diagnosis' }, { key: 'natureOfIllness', label: 'Illness' },
  ]
  const HOSPITAL_FIELDS = [
    { key: 'hospitalName', label: 'Hospital Name', required: true, placeholder: 'Full hospital name' },
    { key: 'hospitalAddress', label: 'Address', placeholder: 'Hospital address' },
    { key: 'admissionDate', label: 'Date of Admission', type: 'date', required: true },
    { key: 'dischargeDate', label: 'Date of Discharge', type: 'date' },
    { key: 'diagnosis', label: 'Diagnosis', placeholder: 'Primary diagnosis' },
    { key: 'doctorName', label: 'Treating Doctor' },
    { key: 'natureOfIllness', label: 'Nature of Illness', full: true, options: ['Acute', 'Chronic', 'Trauma', 'Others'] },
  ]
  const DOCTOR_COLS = [
    { key: 'doctorName', label: 'Doctor Name' }, { key: 'regNo', label: 'Reg No' }, { key: 'qualification', label: 'Qualification' }, { key: 'firstConsultDate', label: 'First Consultation' }, { key: 'causeOfDeath', label: 'Cause' },
  ]
  const DOCTOR_FIELDS = [
    { key: 'doctorName', label: 'Doctor Name', required: true }, { key: 'regNo', label: 'Registration No', required: true },
    { key: 'qualification', label: 'Qualification', options: ['MBBS', 'MD', 'MS', 'BDS', 'BAMS', 'Others'] }, { key: 'specialization', label: 'Specialization' },
    { key: 'firstConsultDate', label: 'First Consultation Date', type: 'date', required: true }, { key: 'causeOfDeath', label: 'Cause of Death Mentioned' },
    { key: 'hospitalName', label: 'Associated Hospital', full: true },
  ]
  const PROOF_COLS = [
    { key: 'proofType', label: 'Proof Type' }, { key: 'documentType', label: 'Document Type' }, { key: 'issueDate', label: 'Issue Date' }, { key: 'documentId', label: 'Document ID' }, { key: 'holderName', label: 'Holder Name' },
  ]
  const PROOF_FIELDS = [
    { key: 'proofType', label: 'Proof Type', required: true, options: ['Identity', 'Address', 'Age', 'Death Certificate', 'Medical', 'Financial', 'Legal'] },
    { key: 'documentType', label: 'Document Type', required: true, options: ['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving Licence', 'Ration Card', 'Birth Certificate', 'Others'] },
    { key: 'documentId', label: 'Document ID / Number', required: true },
    { key: 'issueDate', label: 'Issue Date', type: 'date' }, { key: 'holderName', label: 'Document Holder Name', required: true },
    { key: 'dobOnDoc', label: 'DOB on Document', type: 'date' }, { key: 'isLetterSubmitted', label: 'Letter Submitted', options: ['Yes', 'No'] },
    { key: 'category', label: 'Category', options: ['Original', 'Attested Copy', 'Self-attested', 'Notarized'] },
  ]
  const WITNESS_COLS = [
    { key: 'witnessName', label: 'Name' }, { key: 'relation', label: 'Relation' }, { key: 'mobileNo', label: 'Mobile' }, { key: 'address', label: 'Address' },
  ]
  const WITNESS_FIELDS = [
    { key: 'witnessName', label: 'Witness Name', required: true }, { key: 'relation', label: 'Relation to Life Assured', required: true, options: ['Spouse', 'Parent', 'Sibling', 'Friend', 'Neighbour', 'Employer', 'Others'] },
    { key: 'mobileNo', label: 'Mobile Number' }, { key: 'address', label: 'Address', full: true },
    { key: 'signature', label: 'Signature Available', options: ['Yes', 'No', 'Pending'] },
  ]

  // ── Insurance Proof Details (original: InsuranceProofDetails table)
  const INS_PROOF_COLS = [
    { key: 'proofType', label: 'Proof Type' }, { key: 'documentId', label: 'Document ID' }, { key: 'holderName', label: 'Holder Name' }, { key: 'dobOnDoc', label: 'DOB on Doc' }, { key: 'aadhaarMatch', label: 'Aadhaar Match' }, { key: 'panMatch', label: 'PAN Match' },
  ]
  const INS_PROOF_FIELDS = [
    { key: 'proofType', label: 'Proof Type', required: true, options: ['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving Licence', 'Others'] },
    { key: 'documentId', label: 'Document ID / Number', required: true }, { key: 'holderName', label: 'Holder Name', required: true },
    { key: 'dobOnDoc', label: 'DOB on Document', type: 'date' }, { key: 'issueDate', label: 'Issue Date', type: 'date' },
    { key: 'aadhaarMatch', label: 'Aadhaar Match', options: ['Yes', 'No', 'NA'] },
    { key: 'panMatch', label: 'PAN Name Match', options: ['Yes', 'No', 'NA'] },
    { key: 'dobMatch', label: 'DOB Match', options: ['Yes', 'No', 'NA'] },
    { key: 'category', label: 'Category', options: ['Original', 'Attested Copy', 'Self-attested', 'Notarized'] },
    { key: 'letterSubmitted', label: 'Letter Submitted', options: ['Yes', 'No'] },
    { key: 'panStatus', label: 'PAN Status', options: ['Valid', 'Invalid', 'Not Available'] },
  ]

  // ── Income Document Details (original: IncomeDetails table)
  const INCOME_COLS = [
    { key: 'financialYear', label: 'Financial Year' }, { key: 'proofType', label: 'Proof Type' }, { key: 'incomeAmount', label: 'Income (₹)' }, { key: 'issueDate', label: 'Issue Date' },
  ]
  const INCOME_FIELDS = [
    { key: 'financialYear', label: 'Financial Year', required: true, placeholder: 'e.g. 2024-25' },
    { key: 'proofType', label: 'Proof Type', required: true, options: ['ITR', 'Form 16', 'Salary Slip', 'Bank Statement', 'CA Certificate', 'Others'] },
    { key: 'incomeAmount', label: 'Income Amount (₹)', placeholder: 'Annual income' },
    { key: 'issueDate', label: 'Document Issue Date', type: 'date' },
    { key: 'emailId', label: 'Email on Document' },
    { key: 'mobileNo', label: 'Mobile on Document' },
    { key: 'remarks', label: 'Remarks', full: true },
  ]

  const addRow = (field, row) => update({ [field]: [...(data[field] || []), row] })
  const delRow = (field, i) => update({ [field]: (data[field] || []).filter((_, idx) => idx !== i) })

  const sec = (id, title, sub, children) => (
    <div
      ref={(el) => { sectionRefs.current[id] = el }}
      style={{ borderBottom: `1px solid ${T.border}`, scrollMarginTop: '96px', scrollMarginBottom: '48px' }}
    >
      <SectionHeader title={title} subtitle={sub} open={open === id} onToggle={() => toggle(id)} done={done(id)} />
      {open === id && <div style={{ padding: '20px 22px' }}>{children}</div>}
    </div>
  )

  const policyLoaded = !!policy

  return (
    <div>
      {/* 1. Register Form — skipped when Life Asia gate already completed */}
      {!fromRegisterGate && sec('register', '1. Policy & Claim Setup', 'Search policy and select claim type',
        <div>
          <Grid cols={3}>
            <Field label="Policy Number" required>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input value={data.policyId} onChange={e => update({ policyId: e.target.value })} placeholder="e.g. POL-78432"
                  onFocus={undefined} onBlur={undefined} />
                <Btn onClick={handlePolicySearch} disabled={loadingPolicy} size='sm'>
                  {loadingPolicy ? '...' : '🔍 Fetch'}
                </Btn>
              </div>
            </Field>
            <Field label="Claim Type" required>
              <Select value={data.claimType} onChange={e => update({ claimType: e.target.value })} options={['Death', 'Rider']} />
            </Field>
            <Field label="Information Type" required>
              <Select value={data.informationType} onChange={e => update({ informationType: e.target.value })} options={['Written Information', 'Verbal Information']} />
            </Field>
          </Grid>
          {policyLoaded && (
            <div style={{ ...tonePanelStyle(T, 'success', { marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }) }}>
              {[['Product', policy.productName], ['Sum Assured', `₹${(policy.sumAssured / 1e5).toFixed(1)}L`], ['Issue Date', policy.issueDate], ['Status', policy.premiumStatus]].map(([k, v]) => (
                <div key={k}><div style={toneLabelStyle(T, 'success')}>{k}</div><div style={toneValueStyle(T, 'success', { fontWeight: 800, marginTop: '2px' })}>{v}</div></div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => tryContinue('register', 'intimation')} disabled={!canContinueSection('register')}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 2. Intimation Details */}
      {sec('intimation', secTitle(2, 'Intimation Details'), 'Dates, source and death certificate information',
        <div>
          <div style={{ marginBottom: '16px', padding: '12px 14px', background: T.surfaceMuted, borderRadius: '10px', border: `1px solid ${T.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '10px' }}>
            {[['Claim type', data.claimType], ['Intimation type', data.informationType], ['Portfolio', data.portfolioType], ['Policy status', data.initialPolicyStatus || policy?.premiumStatus]].map(([k, v]) => (
              <div key={k}><div style={{ fontSize: '10px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase' }}>{k}</div><div style={{ fontSize: '13px', fontWeight: 700, color: T.textPrimary }}>{v || '—'}</div></div>
            ))}
          </div>
          <Grid cols={3}>
            <Field label="Intimation Date" required error={dateFieldErrors.intimationDate}>
              <Input type="date" max={todayMax} value={data.intimationDate} onChange={e => update({ intimationDate: e.target.value })} error={dateFieldErrors.intimationDate} />
            </Field>
            <Field label="Source" required><Select value={data.source} onChange={e => update({ source: e.target.value })} options={['Branch', 'Direct', 'Website', 'Email', 'WhatsApp', 'Agent', 'Hospital']} /></Field>
            <Field label="Bond Type" required><Select value={data.bondType} onChange={e => update({ bondType: e.target.value })} options={['Policy Bond', 'Indemnity Bond', 'Not Provided']} /></Field>
            <Field label="FIR / PM Received" required><Select value={data.firPmReceived} onChange={e => update({ firPmReceived: e.target.value })} options={['Yes', 'No', 'Not Required']} /></Field>
            <Field label="Declared by Doctor" required><Select value={data.declaredByDoctor} onChange={e => update({ declaredByDoctor: e.target.value })} options={['Yes', 'No']} /></Field>
            <Field label="WhatsApp Flag"><Select value={data.whatsappFlag} onChange={e => update({ whatsappFlag: e.target.value })} options={['Yes', 'No']} /></Field>
            <Field label="Date of Death / Event" required error={dateFieldErrors.dateOfDeathEvent}>
              <Input
                type="date"
                max={todayMax}
                value={data.dateOfDeathEvent}
                error={dateFieldErrors.dateOfDeathEvent}
                onChange={(e) => {
                  const dateOfDeathEvent = e.target.value
                  update({
                    dateOfDeathEvent,
                    policyStatusOnDod: data.policyStatusOnDod || policy?.premiumStatus || 'IF'
                  })
                }}
              />
            </Field>
            <Field label="Date of Death Registration" required error={dateFieldErrors.dateOfDeathReg}>
              <Input type="date" max={todayMax} value={data.dateOfDeathReg} onChange={e => update({ dateOfDeathReg: e.target.value })} error={dateFieldErrors.dateOfDeathReg} />
            </Field>
            <Field label="Date of Cremation" error={dateFieldErrors.dateOfCremation}>
              <Input type="date" max={todayMax} value={data.dateOfCremation} onChange={e => update({ dateOfCremation: e.target.value })} error={dateFieldErrors.dateOfCremation} />
            </Field>
            <Field label="Date of Accident" error={dateFieldErrors.dateOfAccident}>
              <Input type="date" max={todayMax} value={data.dateOfAccident} onChange={e => update({ dateOfAccident: e.target.value })} error={dateFieldErrors.dateOfAccident} />
            </Field>
            <Field label="Place of Death" required><Select value={data.placeOfDeath} onChange={e => update({ placeOfDeath: e.target.value })} options={placesOfDeath} /></Field>
            <Field label="Policy Status on DOD"><Input value={data.policyStatusOnDod} onChange={e => update({ policyStatusOnDod: e.target.value })} readOnly={true} placeholder="Auto-filled" /></Field>
          </Grid>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Death Certificate Details</div>
            <Grid cols={3}>
              <Field label="Death Certificate Type" required>
                <Select value={data.deathCertificate} onChange={e => {
                  const v = e.target.value; update({ deathCertificate: v, ...(v === 'NA' ? { dcRegNumber: 'NA', dcRegDate: '', dcIssueDistrict: 'NA', dcIssuingAuthority: 'NA', dcTehsil: 'NA', dcIssueState: 'NA', dcPlaceOnCertificate: 'NA', dcVillageBlock: 'NA', dcOfficerPosition: 'NA' } : {}) })
                }} options={['NA', 'Manual', 'Printed']} />
              </Field>
              <Field label="Reg. Number"><Input value={data.dcRegNumber} onChange={e => update({ dcRegNumber: e.target.value })} readOnly={data.deathCertificate === 'NA'} /></Field>
              <Field label="Reg. Date" error={dateFieldErrors.dcRegDate}>
                <Input type="date" max={todayMax} value={data.dcRegDate} onChange={e => update({ dcRegDate: e.target.value })} readOnly={data.deathCertificate === 'NA'} error={dateFieldErrors.dcRegDate} />
              </Field>
              <Field label="Issue District"><Input value={data.dcIssueDistrict} onChange={e => update({ dcIssueDistrict: e.target.value })} readOnly={data.deathCertificate === 'NA'} /></Field>
              <Field label="Issuing Authority"><Input value={data.dcIssuingAuthority} onChange={e => update({ dcIssuingAuthority: e.target.value })} readOnly={data.deathCertificate === 'NA'} /></Field>
              <Field label="Tehsil"><Input value={data.dcTehsil} onChange={e => update({ dcTehsil: e.target.value })} readOnly={data.deathCertificate === 'NA'} /></Field>
              <Field label="Issue State"><Select value={data.dcIssueState} onChange={e => update({ dcIssueState: e.target.value })} options={states} readOnly={data.deathCertificate === 'NA'} /></Field>
              <Field label="Place on Certificate"><Input value={data.dcPlaceOnCertificate} onChange={e => update({ dcPlaceOnCertificate: e.target.value })} readOnly={data.deathCertificate === 'NA'} /></Field>
              <Field label="Village / Block"><Input value={data.dcVillageBlock} onChange={e => update({ dcVillageBlock: e.target.value })} readOnly={data.deathCertificate === 'NA'} /></Field>
              <Field label="Officer Position" full><Input value={data.dcOfficerPosition} onChange={e => update({ dcOfficerPosition: e.target.value })} readOnly={data.deathCertificate === 'NA'} /></Field>
            </Grid>
          </div>
          {!intimationDateCheck.valid && intimationDateCheck.errors.length > 0 && (
            <InfoCard type="warning">
              <div style={{ fontWeight: 700, marginBottom: '8px' }}>Fix these date issues before continuing:</div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', lineHeight: 1.6 }}>
                {intimationDateCheck.errors.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </InfoCard>
          )}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => tryContinue('intimation', 'cause')} disabled={!canContinueSection('intimation')}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 3. Declared Cause */}
      {sec('cause', secTitle(3, 'Declared Cause of Death / Event'), 'Select cause from the cause event list',
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Btn variant='secondary' onClick={openCauseModal}>🔍 Search & Select Cause</Btn>
          </div>
          {data.causeCode || data.causeOfClaim ? (
            <div style={{ padding: '14px', background: T.sectionOpenBg, borderRadius: '10px', border: `1px solid ${T.primaryBorder}`, marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E40AF', marginBottom: '8px' }}>Selected Cause</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                {[
                  ['Type of Claim', data.typeOfClaim],
                  ['Cause Code', data.causeCode],
                  ['Cause of Claim', data.causeOfClaim || data.causeDescription],
                  ['Description', data.causeDescription],
                  ['Category', data.causeCategory],
                  ['Claim Sub Type', data.causeSubType || data.claimSubType],
                  ['Registration Type', data.claimRegistrationType],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '10px', color: '#1D4ED8', fontWeight: 700, textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: T.textPrimary }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : showCauseWarning ? (
            <InfoCard type='warning'>No cause selected. Click "Search & Select Cause" above.</InfoCard>
          ) : null}
          <Grid cols={2}>
            <Field label="Date of Event"><Input type="date" value={data.causeEventDate || data.dateOfDeathEvent} readOnly /></Field>
            <Field label="Policy Status on Event"><Input value={data.policyStatusOnEvent || data.policyStatusOnDod || policyStatusOnEvent()} readOnly /></Field>
            <Field label="If Others – Specify" full><Input value={data.causeIfOthers} onChange={e => update({ causeIfOthers: e.target.value })} placeholder="Specify if cause is 'Others'" /></Field>
          </Grid>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => tryContinue('cause', 'payee')} disabled={!canContinueSection('cause')}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 4. Payee Details */}
      {sec('payee', secTitle(4, 'Payee Details'), 'Select payee from policy clients',
        <div>
          {!policy ? (
            <InfoCard type='warning'>{fromRegisterGate ? 'Please fetch a policy from Policy Search first.' : 'Please load a policy first (Section 1).'}</InfoCard>
          ) : policyClients.length === 0 ? (
            <div>
              <InfoCard type='warning'>
                {fromRegisterGate
                  ? 'No policy clients found. Clients are loaded from Life Asia when the policy is fetched in Policy Search.'
                  : 'No policy clients found. Clients are loaded from Life Asia LifeAssured.ClientDetails when the policy is fetched in section 1.'}
              </InfoCard>
              <div style={{ marginTop: '12px' }}>
                <Btn variant='secondary' onClick={reloadPolicyClients} disabled={loadingPolicy}>
                  {loadingPolicy ? 'Reloading…' : 'Reload policy from Life Asia'}
                </Btn>
              </div>
            </div>
          ) : (
            <>
              {!data.selectedPayeeId ? (
                <InfoCard type="info">
                  <strong>Step 1 — Select payee:</strong> Click the radio button (●) in the first column of the table below to choose who will receive the claim payment. {policyClients.length} policy client{policyClients.length === 1 ? '' : 's'} found.
                </InfoCard>
              ) : (
                <div style={{ ...alertBannerStyle(T, 'success'), marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                  Payee selected — complete relation, status, and contact details below, then click Save & Continue.
                </div>
              )}
              <div style={{ border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '16px', marginTop: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: T.surfaceMuted, borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ padding: '9px 14px', width: '52px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select</th>
                    {['Client ID', 'Name', 'DOB', 'Gender', 'Role', 'Relation', 'Mobile'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {policyClients.map((c, i) => {
                      const selected = data.selectedPayeeId === c.clientId
                      const displayName = selected
                        ? [data.payeeName ?? c.name, data.payeeLastName ?? c.lastName].filter(Boolean).join(' ')
                        : [c.name, c.lastName].filter(Boolean).join(' ')
                      const displayDob = selected ? (data.payeeDob ?? c.dob) : c.dob
                      const displayRole = selected ? (data.payeeRole ?? c.role) : c.role
                      const displayRelation = selected ? (data.payeeRelation ?? c.relation) : c.relation
                      return (
                        <tr
                          key={c.clientId || `client-${i}`}
                          style={{
                            borderBottom: `1px solid ${T.borderSubtle}`,
                            cursor: 'pointer',
                            background: selected ? T.sectionOpenBg : '',
                            outline: selected ? '2px solid #1D4ED8' : 'none',
                            outlineOffset: '-2px'
                          }}
                          onClick={() => applyPayeeSelection(c)}
                        >
                          <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                            <span
                              aria-hidden
                              style={{
                                display: 'inline-flex',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: `2px solid ${selected ? T.primary : T.textSubtle}`,
                                background: selected ? T.primary : T.card,
                                boxShadow: selected ? `0 0 0 3px ${T.primaryLight}` : 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {selected && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.card }} />}
                            </span>
                            <input type='radio' readOnly checked={selected} tabIndex={-1} aria-label={`Select payee ${[c.name, c.lastName].filter(Boolean).join(' ') || c.clientId}`} style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} />
                          </td>
                          <td style={{ padding: '9px 14px', fontSize: '12px', fontWeight: 700, color: T.primary, fontFamily: 'monospace' }}>{c.clientId || '—'}</td>
                          <td style={{ padding: '9px 14px', fontSize: '13px', fontWeight: 600, color: T.textSecondary }}>{displayName || '—'}</td>
                          <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textMuted }}>{displayDob || '—'}</td>
                          <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textMuted }}>{c.gender || '—'}</td>
                          <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textMuted }}>{displayRole || '—'}</td>
                          <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textMuted }}>{displayRelation || '—'}</td>
                          <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textMuted, fontFamily: 'monospace' }}>{c.mobileNo || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {data.selectedPayeeId && (
                <div style={{ padding: '14px', background: T.sectionOpenBg, borderRadius: '10px', border: `1px solid ${T.primaryBorder}` }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: T.primary, marginBottom: '4px' }}>Edit Payee Details</div>
                  <div style={{ fontSize: '11px', color: T.textMuted, marginBottom: '12px' }}>
                    Name, DOB, and country can be corrected here (overrides Life Asia for this claim).
                  </div>
                  <Grid cols={3}>
                    <Field label="First Name">
                      <Input value={data.payeeName || ''} onChange={e => updatePayeeField({ payeeName: e.target.value })} placeholder="Payee first name" />
                    </Field>
                    <Field label="Last Name">
                      <Input value={data.payeeLastName || ''} onChange={e => updatePayeeField({ payeeLastName: e.target.value })} placeholder="Payee last name" />
                    </Field>
                    <Field label="Date of Birth">
                      <Input type="date" value={data.payeeDob || ''} onChange={e => updatePayeeField({ payeeDob: e.target.value })} />
                    </Field>
                    <Field label="Country">
                      <Select
                        value={data.payeeCountry || ''}
                        onChange={e => updatePayeeField({ payeeCountry: e.target.value })}
                        options={countries.length ? countries : ['India', 'Monaco', 'Maldives', 'Malta']}
                      />
                    </Field>
                    <Field label="Relation with Life Assured" required>
                      <Select value={data.payeeRelation || ''} onChange={e => updatePayeeField({ payeeRelation: e.target.value })} options={['Self', 'Spouse', 'Mother', 'Father', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative - Others', 'Friend', 'Not Related']} />
                    </Field>
                    <Field label="Status" required>
                      <Select value={data.payeeStatus || ''} onChange={e => updatePayeeField({ payeeStatus: e.target.value })} options={['Alive', 'Deceased']} />
                    </Field>
                    <Field label="Role">
                      <Input value={data.payeeRole || ''} onChange={e => updatePayeeField({ payeeRole: e.target.value })} placeholder="Optional role" />
                    </Field>
                    <Field label="PAN No"><Input value={data.payeePanNo || ''} onChange={e => updatePayeeField({ payeePanNo: e.target.value })} /></Field>
                    <Field label="Mobile No"><Input value={data.payeeMobileNo || ''} onChange={e => updatePayeeField({ payeeMobileNo: e.target.value })} maxLength={10} /></Field>
                    <Field label="Tel No"><Input value={data.payeeTelNo || ''} onChange={e => updatePayeeField({ payeeTelNo: e.target.value })} maxLength={7} /></Field>
                    <Field label="Email"><Input type="email" value={data.payeeEmailId || ''} onChange={e => updatePayeeField({ payeeEmailId: e.target.value })} /></Field>
                  </Grid>
                </div>
              )}
            </>
          )}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => tryContinue('payee', 'claimant')} disabled={!canContinueSection('payee')}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 5. Claimant Details */}
      {sec('claimant', secTitle(5, 'Claimant Details'), 'Add one or more claimants',
        <div>
          <ClaimantSection data={data} update={update} policy={policy} states={states} toast={toast} />
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => tryContinue('claimant', 'la')} disabled={!canContinueSection('claimant')}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 6. Life Assured Details */}
      {sec('la', secTitle(6, 'Life Assured Details'), 'Details of the insured person',
        <div>
          <Grid cols={3}>
            <Field label="Name" required><Input value={data.laName || (policyClients[0] ? [policyClients[0].name, policyClients[0].lastName].filter(Boolean).join(' ') : '')} onChange={e => update({ laName: e.target.value })} readOnly={!!policy} /></Field>
            <Field label="Client ID"><Input value={data.laClientId || (policyClients[0]?.clientId)} readOnly={true} /></Field>
            <Field label="Date of Birth"><Input type="date" value={data.laDob || (policyClients[0]?.dob)} onChange={e => update({ laDob: e.target.value })} readOnly={!!policy} /></Field>
            <Field label="Gender"><Select value={data.laGender || (policyClients[0]?.gender)} onChange={e => update({ laGender: e.target.value })} options={['Male', 'Female', 'Other']} readOnly={!!policy} /></Field>
            <Field label="Risk Indicator"><Input value={data.laRiskIndicator || (policyClients[0]?.riskIndicator)} readOnly={true} placeholder="From policy" /></Field>
            <Field label="Age at Death (Auto)"><Input value={data.laAgeAtDeath || (data.dateOfDeathEvent && (data.laDob || policyClients[0]?.dob) ? `${new Date(data.dateOfDeathEvent).getFullYear() - new Date(data.laDob || policyClients[0]?.dob).getFullYear()} yrs` : 'Auto-calc')} readOnly={true} /></Field>
            <Field label="ID Proof Type"><Select value={data.laIdProofType} onChange={e => update({ laIdProofType: e.target.value })} options={['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Others']} /></Field>
            <Field label="ID Number"><Input value={data.laIdNumber || (policyClients[0]?.idNumber)} onChange={e => update({ laIdNumber: e.target.value })} /></Field>
            <Field label="Mobile No"><Input value={data.laMobileNo || (policyClients[0]?.mobileNo)} onChange={e => update({ laMobileNo: e.target.value })} maxLength={10} /></Field>
            <Field label="Email"><Input type="email" value={data.laEmailId || (policyClients[0]?.emailId)} onChange={e => update({ laEmailId: e.target.value })} /></Field>
            <Field label="Flat/House No"><Input value={data.laFlat || (policyClients[0]?.flat)} onChange={e => update({ laFlat: e.target.value })} readOnly={!!policy && !!(data.laFlat || policyClients[0]?.flat)} /></Field>
            <Field label="Road / Street"><Input value={data.laRoad || (policyClients[0]?.road)} onChange={e => update({ laRoad: e.target.value })} readOnly={!!policy && !!(data.laRoad || policyClients[0]?.road)} /></Field>
            <Field label="Area / Locality"><Input value={data.laArea || (policyClients[0]?.area)} onChange={e => update({ laArea: e.target.value })} readOnly={!!policy && !!(data.laArea || policyClients[0]?.area)} /></Field>
            <Field label="City"><Input value={data.laCity || (policyClients[0]?.city)} onChange={e => update({ laCity: e.target.value })} readOnly={!!policy && !!(data.laCity || policyClients[0]?.city)} /></Field>
            <Field label="State"><Select value={data.laState || (policyClients[0]?.state)} onChange={e => update({ laState: e.target.value })} options={states} readOnly={!!policy && !!(data.laState || policyClients[0]?.state)} /></Field>
            <Field label="Pincode"><Input value={data.laPincode || (policyClients[0]?.pincode)} onChange={e => update({ laPincode: e.target.value })} maxLength={6} readOnly={!!policy && !!(data.laPincode || policyClients[0]?.pincode)} /></Field>
          </Grid>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Occupation Details</div>
            <Grid cols={3}>
              <Field label="Occupation Code"><Input value={data.laOccCode} onChange={e => update({ laOccCode: e.target.value })} placeholder="Occ. category" /></Field>
              <Field label="Occupation Description"><Input value={data.laOccDesc} onChange={e => update({ laOccDesc: e.target.value })} /></Field>
              <Field label="Annual Income"><Input value={data.laIncome} onChange={e => update({ laIncome: e.target.value })} placeholder="₹" /></Field>
              <Field label="Establishment Name"><Input value={data.laEstName} onChange={e => update({ laEstName: e.target.value })} /></Field>
              <Field label="Designation"><Input value={data.laDesignation} onChange={e => update({ laDesignation: e.target.value })} /></Field>
              <Field label="Nature of Work"><Input value={data.laNatureOfWork} onChange={e => update({ laNatureOfWork: e.target.value })} /></Field>
            </Grid>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => tryContinue('la', 'contract')} disabled={!canContinueSection('la')}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 7. Contract Details */}
      {sec('contract', secTitle(7, 'Contract Details'), 'Policy contract and financial information',
        <div>
          {policy && (
            <div style={{ marginBottom: '14px' }}>
              <InfoCard type="info">
                Contract fields are prefilled from Life Asia when available. Read-only values come from the policy record; you can edit Application No, loan, and excess premium if needed.
              </InfoCard>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <Btn variant="secondary" size="sm" onClick={() => {
                  const patch = applyPolicyPrefill(policy)
                  const n = countPrefillFields(patch)
                  toast(n ? 'success' : 'info', n ? 'Refilled' : 'No changes', n ? `${n} empty field(s) filled from Life Asia.` : 'All available Life Asia fields are already filled.')
                }}>
                  ↻ Refill from Life Asia
                </Btn>
              </div>
            </div>
          )}
          <Grid cols={3}>
            <Field label="Application No"><Input value={data.appNo} onChange={e => update({ appNo: e.target.value })} /></Field>
            <Field label="Product Name"><Input value={data.productName || policy?.productName} readOnly={true} /></Field>
            <Field label="Product Code"><Input value={data.productCode || policy?.productCode} readOnly={true} /></Field>
            <Field label="CDF Signature Date"><Input type="date" value={data.cdfDate} onChange={e => update({ cdfDate: e.target.value })} /></Field>
            <Field label="Issue Date"><Input type="date" value={data.issueDate || policy?.issueDate} readOnly={true} /></Field>
            <Field label="Risk Commencement Date"><Input type="date" value={data.riskCommencementDate || policy?.riskCommencementDate} readOnly={true} /></Field>
            <Field label="Paid to Date"><Input type="date" value={data.paidToDate || policy?.paidToDate} readOnly={true} /></Field>
            <Field label="Premium Frequency"><Input value={data.premiumFrequency || policy?.premiumFrequency} readOnly={true} /></Field>
            <Field label="Premium Status"><Input value={data.premiumStatus || policy?.premiumStatus} readOnly={true} /></Field>
            <Field label="Policy Term (yrs)"><Input value={data.term || policy?.term} readOnly={true} /></Field>
            <Field label="Premium Paid Years"><Input value={data.premPaidYrs || policy?.premPaidYrs} readOnly={true} /></Field>
            <Field label="Total Premium Paid"><Input value={data.totalPremiumPaid || policy?.totalPremiumPaid} readOnly={true} /></Field>
            <Field label="Original Sum Assured"><Input value={data.originalSA || policy?.originalSA} readOnly={true} /></Field>
            <Field label="Current Sum Assured"><Input value={data.currentSA || policy?.currentSA} readOnly={true} /></Field>
            <Field label="Cash Value"><Input value={data.cashValue || policy?.cashValue} readOnly={true} /></Field>
            <Field label="Maturity Value"><Input value={data.maturityValue || policy?.maturityValue} readOnly={true} /></Field>
            <Field label="Outstanding Loan"><Input value={data.outstandingLoan} onChange={e => update({ outstandingLoan: e.target.value })} /></Field>
            <Field label="Excess Premium"><Input value={data.excessPremium} onChange={e => update({ excessPremium: e.target.value })} /></Field>
            <Field label="UW Decision"><Input value={data.uwDecision || policy?.uwDecision} readOnly={true} /></Field>
            <Field label="UW Decision Date"><Input value={data.uwDecisionDate || policy?.uwDecisionDate} readOnly={true} /></Field>
            <Field label="Advisor Code"><Input value={data.advisorCode || policy?.advisorCode} readOnly={true} /></Field>
            <Field label="Advisor Status"><Input value={data.advisorStatus || policy?.advisorStatus} readOnly={true} /></Field>
            <Field label="Policy Age (auto)" required><Input value={data.policyAge || policyAgeInfo.policyAgeLabel || ''} readOnly placeholder="Set Date of Death in Intimation" /></Field>
            <Field label="Name Change Declared" required><Select value={data.nameChangeDecl || ''} onChange={e => update({ nameChangeDecl: e.target.value })} options={['Yes', 'No']} /></Field>
            <Field label="E-Kit Printed"><Select value={data.ekitPrinted || (policy?.ekitPrinted)} onChange={e => update({ ekitPrinted: e.target.value })} options={['Yes', 'No']} /></Field>
            <Field label="Assignment"><Input value={data.assignment || policy?.assignment} readOnly={true} /></Field>
            <Field label="Sales Channel"><Input value={data.salesChannel || policy?.salesChannel} readOnly={true} /></Field>
          </Grid>
          {policy?.riders?.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Rider Details</div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: T.surfaceMuted, borderBottom: `2px solid ${T.border}` }}>
                    {['Rider Code', 'Sum Assured', 'RCD', 'Term', 'Status', 'Cessation Date'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {policy.riders.map((r, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                        <td style={{ padding: '9px 14px', fontSize: '12px', fontWeight: 700, color: T.primary }}>{r.riderCode}</td>
                        <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textSecondary }}>₹{(r.riderSA / 1e5).toFixed(1)}L</td>
                        <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textMuted }}>{r.riderRCD}</td>
                        <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textMuted }}>{r.riderTerm} yrs</td>
                        <td style={{ padding: '9px 14px' }}><span style={statusPillStyle(T, 'success')}>{r.riderStatus}</span></td>
                        <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textMuted }}>{r.riderCessationDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => tryContinue('contract', 'eagle')} disabled={!canContinueSection('contract')}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 8. Eagle Screen */}
      {sec('eagle', secTitle(8, 'Eagle Screen / Fraud Details'), 'Hospital, doctor, proof and witness information',
        <div>
          {policy && (
            <div style={{ marginBottom: '14px' }}>
              <InfoCard type="info">
                Mobile numbers, bank (ECS), and occupation are prefilled from Life Asia client and payee data. Hospital and doctor tables are entered manually during investigation.
              </InfoCard>
            </div>
          )}
          <Grid cols={3}>
            <Field label="LA Mobile No"><Input value={data.eagleLaMobile} onChange={e => update({ eagleLaMobile: e.target.value })} maxLength={10} /></Field>
            <Field label="Claimant Mobile No"><Input value={data.eagleClaimantMobile} onChange={e => update({ eagleClaimantMobile: e.target.value })} maxLength={10} /></Field>
            <Field label="Agent Mobile No"><Input value={data.eagleAgentMobile} onChange={e => update({ eagleAgentMobile: e.target.value })} maxLength={10} /></Field>
            <Field label="Bank Name (ECS)"><Input value={data.eagleBankName} onChange={e => update({ eagleBankName: e.target.value })} /></Field>
            <Field label="Account Number"><Input value={data.eagleAccNo} onChange={e => update({ eagleAccNo: e.target.value })} /></Field>
            <Field label="Account Opening Date"><Input type="date" value={data.eagleAccOpenDate} onChange={e => update({ eagleAccOpenDate: e.target.value })} /></Field>
            <Field label="Center Name"><Input value={data.eagleCenterName} onChange={e => update({ eagleCenterName: e.target.value })} /></Field>
            <Field label="Doctor Name"><Input value={data.eagleDoctorName} onChange={e => update({ eagleDoctorName: e.target.value })} /></Field>
            <Field label="Life Assured Occupation"><Input value={data.eagleOccupation} onChange={e => update({ eagleOccupation: e.target.value })} /></Field>
          </Grid>
          <div style={{ marginTop: '20px' }}>
            <DynamicTable title="Hospital Details" columns={HOSPITAL_COLS} rows={data.hospitalDetails || []} onAdd={() => setAddingRowFor('hospital')} onDelete={i => delRow('hospitalDetails', i)} />
            <DynamicTable title="Doctor Details" columns={DOCTOR_COLS} rows={data.doctorDetails || []} onAdd={() => setAddingRowFor('doctor')} onDelete={i => delRow('doctorDetails', i)} />
            <DynamicTable title="Proof / Document Details" columns={PROOF_COLS} rows={data.proofDetails || []} onAdd={() => setAddingRowFor('proof')} onDelete={i => delRow('proofDetails', i)} />
            <DynamicTable title="Witness Details" columns={WITNESS_COLS} rows={data.witnessDetails || []} onAdd={() => setAddingRowFor('witness')} onDelete={i => delRow('witnessDetails', i)} />
            <DynamicTable title="Insurance Proof Details" columns={INS_PROOF_COLS} rows={data.insProofDetails || []} onAdd={() => setAddingRowFor('insProof')} onDelete={i => delRow('insProofDetails', i)} />
            <DynamicTable title="Income Document Details" columns={INCOME_COLS} rows={data.incomeDetails || []} onAdd={() => setAddingRowFor('income')} onDelete={i => delRow('incomeDetails', i)} />
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => tryContinue('eagle', 'trap')} disabled={!canContinueSection('eagle')}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 9. Trap Score */}
      {sec('trap', secTitle(9, 'Trap Score Details'), 'Automated fraud risk scoring — required before Requirements',
        <div>
          {data.trapScore ? (
            <div style={{ ...tonePanelStyle(T, 'success', { marginBottom: '20px' }) }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '12px' }}>
                {[['Trap Score', data.trapScore], ['Risk Level', data.trapRisk], ['Generated On', data.trapDate]].map(([k, v]) => (
                  <div key={k}><div style={toneLabelStyle(T, 'success')}>{k}</div><div style={toneValueStyle(T, 'success', { fontSize: '16px', fontWeight: 900, marginTop: '2px' })}>{v}</div></div>
                ))}
              </div>
              {data.trapRemarks && <div style={{ fontSize: '12px', color: T.isDark ? T.textSecondary : (T.approved.text ?? T.approved.color), fontWeight: 500, lineHeight: 1.5 }}>Remarks: {data.trapRemarks}</div>}
            </div>
          ) : (
            <div style={{ ...alertBannerStyle(T, 'warn'), marginBottom: '20px', padding: '18px 20px', borderRadius: '12px', borderWidth: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>🎯</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: T.pending.text ?? T.pending.color, marginBottom: '4px' }}>
                    Trap score required
                  </div>
                  <div style={{ fontSize: '13px', color: T.pending.color, lineHeight: 1.5, opacity: 0.9 }}>
                    Click below to calculate trap score from your claim data. Missing fields are filled automatically so you can proceed to Requirements.
                  </div>
                </div>
              </div>
              <Btn
                variant='warning'
                size='lg'
                onClick={handleTrapScore}
                disabled={generatingTrap}
                style={{ width: '100%', maxWidth: '420px' }}
              >
                {generatingTrap ? '⏳ Generating trap score…' : '🎯 Generate Trap Score'}
              </Btn>
            </div>
          )}
          {data.trapScore && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <Btn variant='warning' size='md' onClick={handleTrapScore} disabled={generatingTrap}>
                {generatingTrap ? '⏳ Regenerating…' : '↻ Regenerate Trap Score'}
              </Btn>
              <Btn onClick={() => tryContinue('trap', 'agent')} disabled={!canContinueSection('trap')}>Save & Continue →</Btn>
            </div>
          )}
        </div>
      )}

      {/* 10. Agent Repudiation History */}
      {sec('agent', secTitle(10, 'Agent Repudiation History'), 'Historical repudiation records for this advisor',
        <div>
          <InfoCard type="info">{`Life Assured, Eagle Screen, and Agent Repudiation are optional for advancing — but trap score needs life assured gender/DOB from policy or section ${secNum(6)}.`}</InfoCard>
          <div style={{ marginTop: '12px', marginBottom: '12px', maxWidth: '320px' }}>
            <Field label="Advisor history count (optional)"><Input value={data.advisorHistoryCount || ''} onChange={e => update({ advisorHistoryCount: e.target.value })} /></Field>
          </div>
          {!policy?.agentRepudiation?.length ? (
            <InfoCard type='success'>No repudiation history found for Advisor Code: {data.advisorCode || 'N/A'}.</InfoCard>
          ) : (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: T.surfaceMuted, borderBottom: `2px solid ${T.border}` }}>
                  {['Case No', 'Reason', 'Date', 'Decision', 'Remarks'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {policy.agentRepudiation.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                      <td style={{ padding: '9px 14px', fontSize: '12px', fontWeight: 700, color: T.primary }}>{r.caseNo}</td>
                      <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textSecondary }}>{r.reason}</td>
                      <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textMuted }}>{r.date}</td>
                      <td style={{ padding: '9px 14px' }}><span style={statusPillStyle(T, 'danger')}>{r.decision}</span></td>
                      <td style={{ padding: '9px 14px', fontSize: '12px', color: T.textMuted }}>{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant='success' disabled={!canCompleteDemographics} onClick={() => {
              const { valid, missing } = validateDemographicsComplete(data, sectionValidationOpts)
              if (!valid) {
                showValidationToast(toast, missing, 'Complete mandatory demographics sections')
                return
              }
              markDone('agent')
              update({
                ...syncDemographicsSections(data, policy),
                _demographicsComplete: true
              })
              onComplete()
            }}>✓ Next: Requirements →</Btn>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCauseModal && (
        <CauseModal
          causes={causes}
          loading={loadingCauses}
          loadError={causeLoadError}
          onSelect={selectCause}
          onClose={() => setShowCauseModal(false)}
          onRetry={loadCauses}
        />
      )}
      {addingRowFor === 'hospital' && <AddRowModal title="Hospital Detail" fields={HOSPITAL_FIELDS} onInvalid={(m) => showValidationToast(toast, m, 'Row incomplete')} onSave={r => addRow('hospitalDetails', r)} onClose={() => setAddingRowFor(null)} />}
      {addingRowFor === 'doctor' && <AddRowModal title="Doctor Detail" fields={DOCTOR_FIELDS} onInvalid={(m) => showValidationToast(toast, m, 'Row incomplete')} onSave={r => addRow('doctorDetails', r)} onClose={() => setAddingRowFor(null)} />}
      {addingRowFor === 'proof' && <AddRowModal title="Proof / Document" fields={PROOF_FIELDS} onInvalid={(m) => showValidationToast(toast, m, 'Row incomplete')} onSave={r => addRow('proofDetails', r)} onClose={() => setAddingRowFor(null)} />}
      {addingRowFor === 'witness' && <AddRowModal title="Witness Detail" fields={WITNESS_FIELDS} onInvalid={(m) => showValidationToast(toast, m, 'Row incomplete')} onSave={r => addRow('witnessDetails', r)} onClose={() => setAddingRowFor(null)} />}
      {addingRowFor === 'insProof' && <AddRowModal title="Insurance Proof Detail" fields={INS_PROOF_FIELDS} onInvalid={(m) => showValidationToast(toast, m, 'Row incomplete')} onSave={r => addRow('insProofDetails', r)} onClose={() => setAddingRowFor(null)} />}
      {addingRowFor === 'income' && <AddRowModal title="Income Document Detail" fields={INCOME_FIELDS} onInvalid={(m) => showValidationToast(toast, m, 'Row incomplete')} onSave={r => addRow('incomeDetails', r)} onClose={() => setAddingRowFor(null)} />}
    </div>
  )
}

/* ── Claimant Section (inline) ── */
function ClaimantSection({ data, update, policy, states = [], toast }) {
  const T = useRegTokens()
  const [sameAsPayee, setSameAsPayee] = useState(false)
  const [form, setForm] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSameAsPayee = (checked) => {
    setSameAsPayee(checked)
    if (checked && data.selectedPayeeId) {
      const payee = data.selectedPayee || {}
      setForm({
        clientId: data.payeeClientId || payee.clientId,
        name: data.payeeName || payee.name,
        lastName: data.payeeLastName || payee.lastName,
        dob: data.payeeDob || payee.dob,
        gender: data.payeeGender || payee.gender,
        relation: data.payeeRelation || payee.relationWithLifeAsr,
        flat: data.payeeFlat || payee.flat,
        road: data.payeeRoad || payee.road,
        area: data.payeeArea || payee.area,
        city: data.payeeCity || payee.city,
        state: data.payeeState || payee.state,
        pincode: data.payeePincode || payee.pinCode,
        mobileNo: data.payeeMobileNo || payee.mobileNo,
        emailId: data.payeeEmailId || payee.emailId,
        panNo: data.payeePanNo || payee.panNo,
        idNumber: data.payeeIdNumber || payee.idNumber
      })
    } else setForm({})
  }

  const addClaimant = () => {
    const { valid, missing } = validateClaimantDraft(form)
    if (!valid) {
      showValidationToast(toast, missing, 'Add claimant')
      return
    }
    const nextClaimants = [...(data.claimants || []), { ...form }]
    const eaglePatch = !data.eagleClaimantMobile && form.mobileNo ? { eagleClaimantMobile: form.mobileNo } : {}
    update({ claimants: nextClaimants, ...eaglePatch })
    setForm({}); setSameAsPayee(false)
    toast?.('success', 'Claimant added', `${form.name} added to the claimant list.`)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 14px', ...alertBannerStyle(T, 'info'), borderRadius: '8px' }}>
        <input type="checkbox" id="samePayee" checked={sameAsPayee} onChange={e => handleSameAsPayee(e.target.checked)} style={{ cursor: 'pointer' }} />
        <label htmlFor="samePayee" style={{ fontSize: '13px', fontWeight: 600, color: T.info.text ?? T.info.color, cursor: 'pointer' }}>Same as Payee Details</label>
      </div>
      <Grid cols={3}>
        <Field label="Name" required><Input value={form.name} onChange={e => set('name', e.target.value)} readOnly={sameAsPayee} /></Field>
        <Field label="Client ID" required><Input value={form.clientId} onChange={e => set('clientId', e.target.value)} readOnly={sameAsPayee} /></Field>
        <Field label="Date of Birth" required><Input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} readOnly={sameAsPayee} /></Field>
        <Field label="Gender" required><Select value={form.gender} onChange={e => set('gender', e.target.value)} options={['Male', 'Female', 'Other']} readOnly={sameAsPayee} /></Field>
        <Field label="Role" required><Select value={form.role} onChange={e => set('role', e.target.value)} options={['Proposer', 'Nominee', 'Appointee', 'Joint Life', 'Joint Payee', 'Life Assured', 'Others']} /></Field>
        <Field label="Relation with Life Assured" required><Select value={form.relation} onChange={e => set('relation', e.target.value)} options={['Self', 'Spouse', 'Mother', 'Father', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative - Others', 'Friend', 'Not Related']} /></Field>
        <Field label="Mobile No" required><Input value={form.mobileNo} onChange={e => set('mobileNo', e.target.value)} maxLength={10} readOnly={sameAsPayee} /></Field>
        <Field label="Email"><Input type="email" value={form.emailId} onChange={e => set('emailId', e.target.value)} readOnly={sameAsPayee} /></Field>
        <Field label="PAN No"><Input value={form.panNo} onChange={e => set('panNo', e.target.value)} readOnly={sameAsPayee} /></Field>
        <Field label="PAN Validity"><Select value={form.panValidFlag} onChange={e => set('panValidFlag', e.target.value)} options={['Valid', 'Not Valid', 'Not Available']} /></Field>
        <Field label="Politically Exposed"><Select value={form.politicallyExposed} onChange={e => set('politicallyExposed', e.target.value)} options={['Yes', 'No']} /></Field>
        <Field label="Occupation"><Input value={form.occupation} onChange={e => set('occupation', e.target.value)} readOnly={sameAsPayee} /></Field>
        <Field label="Flat / House" required><Input value={form.flat} onChange={e => set('flat', e.target.value)} readOnly={sameAsPayee} /></Field>
        <Field label="Road / Street" required><Input value={form.road} onChange={e => set('road', e.target.value)} readOnly={sameAsPayee} /></Field>
        <Field label="Area" required><Input value={form.area} onChange={e => set('area', e.target.value)} readOnly={sameAsPayee} /></Field>
        <Field label="City" required><Input value={form.city} onChange={e => set('city', e.target.value)} readOnly={sameAsPayee} /></Field>
        <Field label="State" required><Select value={form.state} onChange={e => set('state', e.target.value)} options={states} readOnly={sameAsPayee} /></Field>
        <Field label="Pincode" required><Input value={form.pincode} onChange={e => set('pincode', e.target.value)} maxLength={6} readOnly={sameAsPayee} /></Field>
      </Grid>
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant='secondary' onClick={addClaimant}>+ Add Claimant to List</Btn>
      </div>
      {(data.claimants || []).length > 0 && (
        <div style={{ marginTop: '12px', border: `1px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.surfaceMuted, borderBottom: `2px solid ${T.border}` }}>
              {['Name', 'Role', 'Relation', 'Mobile', 'PAN'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase' }}>{h}</th>
              ))}
              <th style={{ padding: '8px 12px', width: '40px' }}></th>
            </tr></thead>
            <tbody>
              {(data.claimants || []).map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                  <td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, color: T.textSecondary }}>{c.name}</td>
                  <td style={{ padding: '8px 12px', fontSize: '12px', color: T.textMuted }}>{c.role}</td>
                  <td style={{ padding: '8px 12px', fontSize: '12px', color: T.textMuted }}>{c.relation}</td>
                  <td style={{ padding: '8px 12px', fontSize: '12px', color: T.textMuted }}>{c.mobileNo}</td>
                  <td style={{ padding: '8px 12px', fontSize: '12px', color: T.textMuted }}>{c.panNo}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <button onClick={() => update({ claimants: (data.claimants || []).filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '16px' }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
