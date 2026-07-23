import wrapper from "../util/ApiWrapper";
import { hasCalcAmountData } from "../util/workspaceDisplay";

// Fetch transaction details for Life Assured
export const getTransactionDetailsLA = async (policyId, txnDate, claimNumber = '') => {
  const body = { policyId, txnDate };
  const claim = String(claimNumber || '').trim();
  if (claim) body.claimNumber = claim;
  const response = await wrapper.fetchWithToken("/txn/txnDetails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return data;
};

function asPayableSummary(obj) {
  return hasCalcAmountData(obj) ? obj : null
}

/** Unwrap Life Asia style `[{ TransactionDetails: [...] }]` and similar shapes. */
function extractTransactionRows(data) {
  if (data == null) return []

  const pushIfRow = (item, out) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return
    const keys = Object.keys(item)
    if (!keys.length) return
    if (keys.length === 1 && (keys[0] === 'TransactionDetails' || keys[0] === 'transactionDetails')) return
    out.push(item)
  }

  if (Array.isArray(data)) {
    const flat = []
    for (const item of data) {
      if (!item || typeof item !== 'object') continue
      const nested = item.TransactionDetails ?? item.transactionDetails
      if (Array.isArray(nested)) {
        nested.forEach((row) => pushIfRow(row, flat))
        continue
      }
      pushIfRow(item, flat)
    }
    return flat
  }

  if (Array.isArray(data.transactions)) return data.transactions
  if (Array.isArray(data.TransactionDetails)) return data.TransactionDetails
  if (Array.isArray(data.transactionDetails)) return data.transactionDetails
  if (Array.isArray(data.data)) return data.data

  return []
}

/** Normalize txn API / calc object into displayable rows or summary object. */
export function normalizeTxnApiPayload(data) {
  if (data == null) return { rows: [], summary: null, emptyApi: false }

  const txnRows = extractTransactionRows(data)
  if (txnRows.length) return { rows: txnRows, summary: null, emptyApi: false }

  const hadEmptyWrapper = Array.isArray(data) && data.some(
    (item) => Array.isArray(item?.TransactionDetails) && item.TransactionDetails.length === 0,
  )

  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    const inner = data.data
    const summary = asPayableSummary(inner)
    if (summary) return { rows: [], summary, emptyApi: hadEmptyWrapper }
    return { rows: [], summary: null, emptyApi: hadEmptyWrapper }
  }

  const summary = asPayableSummary(data)
  if (summary) return { rows: [], summary, emptyApi: hadEmptyWrapper }

  return { rows: [], summary: null, emptyApi: hadEmptyWrapper }
}

export const TXN_ACTION_OPTIONS = ['Reverse', 'Not Reverse', 'Not Applicable']

export function normalizeTxnAction(value) {
  if (value == null || String(value).trim() === '') return ''
  const s = String(value).trim().toLowerCase().replace(/\s+/g, ' ')
  const aliases = {
    reverse: 'Reverse',
    'not reverse': 'Not Reverse',
    'not applicable': 'Not Applicable',
    'not app': 'Not Applicable',
    na: 'Not Applicable',
    'n/a': 'Not Applicable',
  }
  if (aliases[s]) return aliases[s]
  return TXN_ACTION_OPTIONS.find((o) => o.toLowerCase() === s) || String(value).trim()
}

/** Map heterogeneous txn row keys → display fields. */
export function mapTxnDisplayRow(row = {}) {
  const pick = (...keys) => {
    for (const k of keys) {
      if (row[k] != null && String(row[k]).trim() !== '') return row[k]
    }
    return '—'
  }
  return {
    date: String(pick('txnDate', 'date', 'Date', 'transactionDate')).slice(0, 10),
    code: pick('txnCode', 'code', 'Code', 'transactionCode'),
    amount: pick('txnAmount', 'amount', 'Amount'),
    status: pick('txnStatus', 'status', 'Status'),
    description: pick('txnDescription', 'description', 'Description', 'txnRemark', 'remark'),
    action: (() => {
      const raw = pick('txnAction', 'txn_action', 'action', 'Action')
      return raw === '—' ? '' : normalizeTxnAction(raw)
    })(),
  }
}

/** Apply assessor / verifier action selection back onto the raw row object. */
export function setTxnRowAction(row, action) {
  const val = normalizeTxnAction(action) || ''
  return { ...row, txnAction: val, action: val, Action: val }
}

/** Build DB-ready rows for /txn/txnSave (policy, date, action, remark per row). */
export function prepareTxnRowsForSave(rows, policyId, txnDate, remarks = '') {
  const policy = String(policyId || '').trim()
  const fallbackDate = String(txnDate || '').slice(0, 10)
  const globalRemark = String(remarks || '').trim()

  return (rows || []).map((row, index) => {
    const display = mapTxnDisplayRow(row)
    const action = normalizeTxnAction(row.txnAction || row.action || row.Action)
    const dateRaw =
      row.txnDate
      || row.txn_date
      || row.Date
      || row.date
      || (display.date !== '—' ? display.date : fallbackDate)

    return {
      txnpolicyNumber: row.txnpolicyNumber || row.txnpolicy_number || row.PolicyNumber || policy,
      txnDate: dateRaw,
      txnCode: display.code !== '—' ? display.code : (row.txnCode || row.Code || ''),
      txnAmount: display.amount !== '—' ? display.amount : (row.txnAmount || row.Amount || 0),
      txnStatus: display.status !== '—' ? display.status : (row.txnStatus || row.Status || ''),
      txnDescription:
        display.description !== '—'
          ? display.description
          : (row.txnDescription || row.Description || row.txnRemark || ''),
      txnAction: action,
      txnRemark: row.txnRemark || row.Remark || row.remark || (index === 0 ? globalRemark : '') || globalRemark,
    }
  })
}

/** Re-apply saved txnAction values from DB rows onto live API rows. */
export function mergeTxnActionsFromDb(liveRows, dbList) {
  if (!Array.isArray(liveRows) || !liveRows.length || !Array.isArray(dbList) || !dbList.length) {
    return liveRows || []
  }
  return liveRows.map((row) => {
    const live = mapTxnDisplayRow(row)
    const match = dbList.find((db) => {
      const saved = mapTxnDisplayRow(db)
      return (
        saved.code === live.code
        && saved.date === live.date
        && String(saved.amount) === String(live.amount)
        && saved.description === live.description
      )
    })
    if (!match) return row
    const action = normalizeTxnAction(match.action === '—' ? '' : match.action)
    return action ? setTxnRowAction(row, action) : row
  })
}

/** Filter DB cache rows to intimation date when possible. */
export function filterTxnDbRows(rows, txnDate) {
  if (!Array.isArray(rows) || !rows.length || !txnDate) return rows || []
  const target = String(txnDate).slice(0, 10)
  const matched = rows.filter((r) => String(r.txnDate || r.txn_date || '').slice(0, 10) === target)
  return matched.length ? matched : rows
}

// Save / persist transaction details (including remarks & actions)
export const saveTransactionDetailsLA = async (policyId, txnDate, { remarks = '', rows = [], claimNumber = '' } = {}) => {
  const prepared = prepareTxnRowsForSave(rows, policyId, txnDate, remarks)
  if (!prepared.length) {
    throw new Error('No transaction rows to save')
  }
  const body = {
    policyId,
    policyNumber: policyId,
    txnDate,
    transactionDetails: prepared,
  }
  const claim = String(claimNumber || '').trim()
  if (claim) body.claimNumber = claim
  const response = await wrapper.fetchWithToken('/txn/txnSave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message || data?.detail || 'Could not save transaction details')
  }
  return data
}

export const getTransactionApiDBDetails = async (policyId, txnDate, claimNumber = '') => {
  const body = { policyId, policyNumber: policyId, txnDate };
  const claim = String(claimNumber || '').trim();
  if (claim) body.claimNumber = claim;
  const response = await wrapper.fetchWithToken('/txn/transactionApiDBDetails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json().catch(() => null)
}

// Keep default export for existing imports
export default getTransactionDetailsLA;
