import { useState, useEffect } from 'react'
import { useToast } from '../Toast'
import {
  getTransactionDetailsLA,
  saveTransactionDetailsLA,
  getTransactionApiDBDetails,
  normalizeTxnApiPayload,
  mapTxnDisplayRow,
  TXN_ACTION_OPTIONS,
  normalizeTxnAction,
  setTxnRowAction,
  mergeTxnActionsFromDb,
} from '../../services/transactionDetailsLAService'
import assessorFetchService from '../../services/assessorFetchService'
import { unwrapWorkspace } from '../../services/claimDetailService'
import { formatCalcAmountSummary, hasCalcAmountData } from '../../util/workspaceDisplay'
import { useTheme } from '../../context/ThemeContext'
import { alertBannerStyle, fieldInputStyle } from '../../ui/pageTokens'


function InfoBanner({ children, tone = 'info' }) {
  const { tokens: T } = useTheme()
  const banner = alertBannerStyle(T, tone === 'warn' ? 'warn' : 'info')
  return (
    <div style={{ fontSize: '12px', lineHeight: 1.55, padding: '12px 14px', borderRadius: '10px', marginBottom: '14px', ...banner }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  const { tokens: T } = useTheme()
  return (
    <div style={{ fontSize: '11px', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
      {children}
    </div>
  )
}

function TxnSummaryCards({ summary, claimId }) {
  const { tokens: T } = useTheme()
  const rows = formatCalcAmountSummary(summary || {}, claimId)
  if (!rows.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '4px' }}>
      {rows.map((row) => (
        <div key={row.label} style={{ padding: '12px', background: T.surfaceMuted, borderRadius: '10px', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>{row.label}</div>
          <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '6px', color: T.textPrimary }}>{row.value}</div>
        </div>
      ))}
    </div>
  )
}

function StatusPill({ status }) {
  const { tokens: T } = useTheme()
  const ok = String(status).toLowerCase() === 'success'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '99px',
        fontSize: '11px',
        fontWeight: 700,
        background: ok ? T.approved.bg : T.surfaceMuted,
        color: ok ? T.approved.text : T.textMuted,
      }}
    >
      {status}
    </span>
  )
}

function ActionSelect({ value, onChange, disabled }) {
  const { tokens: T } = useTheme()
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={fieldInputStyle(T, {
        width: '100%',
        minWidth: '128px',
        height: '36px',
        padding: '0 10px',
        borderRadius: '8px',
        border: `1.5px solid ${value ? T.primary : T.border}`,
        background: disabled ? T.inputBgReadonly : T.inputBg,
        fontSize: '12px',
        fontWeight: 600,
        color: value ? T.textPrimary : T.textMuted,
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: value ? `0 0 0 3px ${T.primaryRing}` : 'none',
      })}
    >
      <option value="">--Select--</option>
      {TXN_ACTION_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

function TxnTable({ rows, editable, onActionChange }) {
  const { tokens: T } = useTheme()
  if (!rows?.length) return null
  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: T.surfaceMuted }}>
            {['Date', 'Code', 'Amount', 'Status', 'Description', 'Action'].map((h) => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textMuted, fontSize: '10px', textTransform: 'uppercase' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((raw, i) => {
            const r = mapTxnDisplayRow(raw)
            return (
              <tr key={raw.txnid || `${r.date}-${r.code}-${i}`} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: T.textPrimary }}>{r.date}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: T.textPrimary }}>{r.code}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: T.textPrimary }}>{r.amount === '—' ? r.amount : `₹${Number(r.amount).toLocaleString('en-IN')}`}</td>
                <td style={{ padding: '10px 12px' }}>{r.status === '—' ? '—' : <StatusPill status={r.status} />}</td>
                <td style={{ padding: '10px 12px', color: T.textMuted, maxWidth: '180px' }}>{r.description}</td>
                <td style={{ padding: '8px 10px', minWidth: '140px' }}>
                  {editable ? (
                    <ActionSelect
                      value={normalizeTxnAction(r.action === '—' ? '' : r.action)}
                      onChange={(v) => onActionChange(i, v)}
                    />
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>{r.action}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ title, detail }) {
  const { tokens: T } = useTheme()
  return (
    <div style={{ textAlign: 'center', padding: '28px 16px', background: T.surfaceMuted, borderRadius: '12px', border: `1px dashed ${T.border}` }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: T.textPrimary, marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: T.textMuted, lineHeight: 1.6, maxWidth: '420px', margin: '0 auto' }}>{detail}</div>
    </div>
  )
}

export default function TransactionDetailsModal({ open, onClose, policyId, txnDate, claimId, calcAmt }) {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [txnRows, setTxnRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [dbRows, setDbRows] = useState(null)
  const [dbDateMismatch, setDbDateMismatch] = useState(false)
  const [tab, setTab] = useState('live')
  const [liveNote, setLiveNote] = useState('')
  const [usedCalcFallback, setUsedCalcFallback] = useState(false)

  const patchTxnAction = (setter) => (index, action) => {
    setter((prev) => prev.map((row, i) => (i === index ? setTxnRowAction(row, action) : row)))
  }

  useEffect(() => {
    if (!open || !policyId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLiveNote('')
      setUsedCalcFallback(false)
      setDbDateMismatch(false)
      const date = txnDate || new Date().toISOString().split('T')[0]
      try {
        let calc = calcAmt
        if (!hasCalcAmountData(calc) && claimId) {
          const fetched = await assessorFetchService.calculateAmountFetch(claimId).catch(() => null)
          calc = unwrapWorkspace(fetched)
        }

        const [data, db] = await Promise.all([
          getTransactionDetailsLA(policyId, date, claimId).catch(() => null),
          getTransactionApiDBDetails(policyId, date, claimId).catch(() => null),
        ])
        if (cancelled) return

        const normalized = normalizeTxnApiPayload(data)
        let nextSummary = normalized.summary
        let nextRows = normalized.rows

        if (!nextSummary && !nextRows.length && hasCalcAmountData(calc)) {
          nextSummary = unwrapWorkspace(calc) || calc
          setUsedCalcFallback(true)
          setLiveNote(
            normalized.emptyApi
              ? `Life Asia returned no transactions for ${date}. Showing estimated payable from the claim decision engine.`
              : 'Showing estimated payable from the claim decision engine.',
          )
        } else if (normalized.emptyApi) {
          setLiveNote(`Life Asia has no policy transactions on intimation date ${date}.`)
        } else if (!nextSummary && !nextRows.length) {
          setLiveNote('No live transaction or payable data is available for this claim.')
        }

        const dbList = db?.rows ?? (Array.isArray(db) ? db : [])
        setTxnRows(mergeTxnActionsFromDb(nextRows, dbList))
        setSummary(hasCalcAmountData(nextSummary) ? nextSummary : null)
        setDbRows(dbList.length ? dbList : null)
        setDbDateMismatch(Boolean(db?.dateMismatch))
        const savedRemark = dbList.map((r) => r.txnRemark || r.txn_remark || r.Remark).find(Boolean)
        if (savedRemark) setRemarks(String(savedRemark))
        else setRemarks('')
      } catch {
        if (!cancelled) toast('error', 'Load failed', 'Could not load transaction details.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [open, policyId, txnDate, claimId, calcAmt, toast])

  if (!open) return null

  const handleSave = async () => {
    const rowsToSave = tab === 'database'
      ? (dbRows || [])
      : (txnRows.length ? txnRows : (dbRows || []))
    if (!rowsToSave.length) {
      toast('warning', 'Nothing to save', 'Load transaction rows before saving.')
      return
    }
    const missingAction = rowsToSave.some((row) => !normalizeTxnAction(row.txnAction || row.action || row.Action))
    if (missingAction) {
      toast('warning', 'Action required', 'Select Reverse, Not Reverse, or Not Applicable for each row.')
      return
    }
    try {
      await saveTransactionDetailsLA(policyId, txnDate, { remarks, rows: rowsToSave, claimNumber: claimId })
      const db = await getTransactionApiDBDetails(policyId, txnDate, claimId).catch(() => null)
      const dbList = db?.rows ?? (Array.isArray(db) ? db : [])
      if (dbList.length) {
        setDbRows(dbList)
        setDbDateMismatch(Boolean(db?.dateMismatch))
      }
      toast('success', 'Saved', 'Transaction actions and remarks saved.')
      onClose()
    } catch (e) {
      toast('error', 'Save failed', e?.message || 'Could not save.')
    }
  }

  const hasLiveContent = txnRows.length > 0 || summary
  const hasSaveableRows = txnRows.length > 0 || (dbRows?.length > 0)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: T.card, borderRadius: '16px', width: 'min(780px, 96vw)', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '17px', color: T.textPrimary }}>Transaction details</div>
              <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '6px' }}>
                Policy <strong>{policyId}</strong>
                {claimId && <> · Claim <strong>{claimId}</strong></>}
                {' · '}Intimation <strong>{txnDate || 'today'}</strong>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: T.textMuted, lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', padding: '0 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {[
            { id: 'live', label: 'Live & payable' },
            { id: 'database', label: 'Saved history' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '12px 14px',
                border: 'none',
                borderBottom: tab === t.id ? `2px solid ${T.primary}` : '2px solid transparent',
                background: 'transparent',
                fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? T.primary : T.textMuted,
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
                marginBottom: '-1px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: T.textMuted, fontSize: '13px' }}>Loading transaction data…</div>
          ) : tab === 'database' ? (
            <>
              <SectionLabel>Saved policy transactions (database cache)</SectionLabel>
              {dbRows?.length ? (
                <>
                  {dbDateMismatch && (
                    <InfoBanner tone="warn">
                      Nothing saved for intimation date <strong>{txnDate}</strong>. These are older premium / policy transactions stored for this policy number.
                    </InfoBanner>
                  )}
                  <TxnTable rows={dbRows} editable onActionChange={patchTxnAction(setDbRows)} />
                  <p style={{ fontSize: '11px', color: T.textMuted, marginTop: '10px' }}>
                    Pick Reverse, Not Reverse, or Not Applicable per row, then Save.
                  </p>
                </>
              ) : (
                <EmptyState
                  title="No saved history"
                  detail="Nothing in the DB cache for this policy and date. Use Save on the Live tab after data loads to store a snapshot."
                />
              )}
            </>
          ) : (
            <>
              <SectionLabel>{usedCalcFallback || summary ? 'Estimated payable' : 'Life Asia transactions'}</SectionLabel>
              {liveNote && <InfoBanner tone={usedCalcFallback ? 'info' : 'warn'}>{liveNote}</InfoBanner>}
              {summary && <TxnSummaryCards summary={summary} claimId={claimId} />}
              {txnRows.length > 0 && (
                <div style={{ marginTop: summary ? '16px' : 0 }}>
                  <SectionLabel>Policy transactions on intimation date</SectionLabel>
                  <TxnTable rows={txnRows} editable onActionChange={patchTxnAction(setTxnRows)} />
                </div>
              )}
              {!hasLiveContent && (
                <EmptyState
                  title="No transaction data"
                  detail="The external Life Asia service returned an empty list for this date. Check Saved history for cached rows, or open the Decision tab for payable estimate."
                />
              )}
            </>
          )}

          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="Optional notes about transactions or payable review…"
              style={fieldInputStyle(T, { width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' })}
            />
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: T.surfaceMuted }}>
          <span style={{ fontSize: '11px', color: T.textMuted }}>
            Save stores row actions and remarks
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.card, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasSaveableRows}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: hasSaveableRows ? T.primary : '#CBD5E1',
                color: '#fff',
                fontWeight: 700,
                cursor: hasSaveableRows ? 'pointer' : 'not-allowed',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
