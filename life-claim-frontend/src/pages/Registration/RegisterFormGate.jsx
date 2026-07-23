import { useState, useEffect, useMemo } from 'react'
import { Field, Input, Select, Grid, Btn, InfoCard, useRegTokens } from './shared'
import { fetchPolicyDetails, fetchAgentRepudiation } from '../../services/policyService'
import { asArray } from '../../util/buildRegistrationPayload'
import { getPolicySummaryItems } from '../../util/normalizePolicyResponse'
import { buildPolicyRegistrationPrefill, countPrefillFields } from '../../util/prefillRegistrationFromPolicy'
import { useToast } from '../../components/Toast'
import { tonePanelStyle, toneLabelStyle, toneValueStyle } from '../../ui/pageTokens'

/**
 * v1 RegisterForm gate — Life Asia policy fetch before the 4-step wizard.
 */
export default function RegisterFormGate({ initialPolicyNo = '', onProceed }) {
  const T = useRegTokens()
  const toast = useToast()
  const [policyNo, setPolicyNo] = useState(initialPolicyNo)
  const [claimType, setClaimType] = useState('Death')
  const [informationType, setInformationType] = useState('Written Information')
  const [loading, setLoading] = useState(false)
  const [policy, setPolicy] = useState(null)
  const lockedPolicy = Boolean(initialPolicyNo?.trim())
  const policySummary = useMemo(
    () => getPolicySummaryItems(policy, policyNo.trim()),
    [policy, policyNo]
  )

  useEffect(() => {
    if (initialPolicyNo) setPolicyNo(initialPolicyNo)
  }, [initialPolicyNo])

  const handleSearch = async () => {
    const id = policyNo.trim()
    if (!id) {
      toast('warning', 'Policy required', 'Enter a policy number.')
      return
    }
    setLoading(true)
    setPolicy(null)
    try {
      const p = await fetchPolicyDetails(id)
      setPolicy(p)
      if (p?.advisorCode) {
        fetchAgentRepudiation(p.advisorCode).then((ar) => {
          setPolicy((prev) => (prev ? { ...prev, agentRepudiation: asArray(ar?.data || ar) } : prev))
        }).catch(() => {})
      }
      toast('success', 'Policy found', `${p.productName || p.policyId || id} loaded from Life Asia.`)
    } catch (e) {
      toast('error', 'Invalid policy', e?.message || 'Could not fetch policy. Check the number and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProceed = () => {
    if (!policy) {
      toast('warning', 'Policy required', 'Search and load a valid policy from Life Asia before proceeding.')
      return
    }
    if (!claimType || !informationType) {
      toast('warning', 'Claim setup', 'Select claim type and information type.')
      return
    }
    const prefill = buildPolicyRegistrationPrefill(policy, {})
    onProceed({
      policy: {
        ...policy,
        registerForm: {
          policyId: policy.policyId || policyNo.trim(),
          claimType,
          informationType } },
      policyData: {
        policyId: policy.policyId || policyNo.trim(),
        claimType,
        informationType,
        productName: policy.productName,
        productCode: policy.productCode,
        sumAssured: policy.sumAssured,
        advisorCode: policy.advisorCode,
        initialPolicyStatus: policy.premiumStatus,
        riskCommencementDate: policy.riskCommencementDate,
        issueDate: policy.issueDate,
        ...prefill } })
    const n = countPrefillFields(prefill)
    if (n > 0) {
      toast('info', 'Fields prefilled', `${n} contract and eagle field(s) filled from Life Asia.`)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <InfoCard type="info">
        Search the policy in Life Asia, confirm claim type, then proceed to the four-step registration wizard.
      </InfoCard>
      <div style={{ marginTop: '20px' }}>
        <Grid cols={3}>
          <Field label="Policy number" required>
            <Input
              value={policyNo}
              onChange={(e) => setPolicyNo(e.target.value)}
              placeholder="Policy number"
              readOnly={lockedPolicy}
            />
          </Field>
          <Field label="Claim type" required>
            <Select value={claimType} onChange={(e) => setClaimType(e.target.value)} options={['Death', 'Rider']} />
          </Field>
          <Field label="Information type" required>
            <Select
              value={informationType}
              onChange={(e) => setInformationType(e.target.value)}
              options={['Written Information', 'Verbal Information']}
            />
          </Field>
        </Grid>
        <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
          <Btn onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching…' : 'Search policy'}
          </Btn>
        </div>
      </div>

      {policy && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', marginBottom: '10px' }}>
            Policy details (from Life Asia)
          </div>
          <div
            style={{
              ...tonePanelStyle(T, 'success'),
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px' }}
          >
            {policySummary.map((item) => (
              <div key={item.label}>
                <div style={toneLabelStyle(T, 'success')}>
                  {item.label}
                </div>
                <div
                  style={{
                    ...toneValueStyle(T, 'success', { fontWeight: item.highlight ? 800 : 700, marginTop: '2px' }),
                    color: item.highlight ? T.primary : (T.approved.text ?? T.approved.color),
                    fontFamily: item.highlight ? 'monospace' : 'inherit' }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant="success" onClick={handleProceed}>
              Proceed to registration →
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
