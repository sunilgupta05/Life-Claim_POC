const MAX_UPLOAD_ROWS = Number(process.env.ADD_UPLOAD_MAX_ROWS || 5000);
const POLICY_NUMBER_PATTERN = /^[A-Za-z0-9/_-]{1,50}$/;
const SOURCE_MAX_LEN = 120;
const REMARKS_MAX_LEN = 2000;

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    POLICY_NUMBER: String(row.POLICY_NUMBER ?? row.policy_number ?? '').trim(),
    SOURCE: String(row.SOURCE ?? row.source ?? 'Excel').trim().slice(0, SOURCE_MAX_LEN),
    REFERRAL_DATE: String(row.REFERRAL_DATE ?? row.referral_date ?? '').trim(),
    REMARKS: String(row.REMARKS ?? row.REMARK ?? row.remarks ?? '').trim().slice(0, REMARKS_MAX_LEN),
  };
}

function validateAddExcelPayload(data) {
  if (!Array.isArray(data)) {
    return { ok: false, error: 'data must be an array.' };
  }
  if (!data.length) {
    return { ok: false, error: 'No rows to upload.' };
  }
  if (data.length > MAX_UPLOAD_ROWS) {
    return { ok: false, error: `Maximum ${MAX_UPLOAD_ROWS} rows per upload.` };
  }

  const normalized = [];
  for (let i = 0; i < data.length; i += 1) {
    const row = normalizeRow(data[i]);
    if (!row) {
      return { ok: false, error: `Row ${i + 1} is invalid.` };
    }
    if (!POLICY_NUMBER_PATTERN.test(row.POLICY_NUMBER)) {
      return { ok: false, error: `Row ${i + 1}: invalid POLICY_NUMBER.` };
    }
    if (!row.REFERRAL_DATE) {
      return { ok: false, error: `Row ${i + 1}: REFERRAL_DATE is required.` };
    }
    normalized.push(row);
  }

  return { ok: true, data: normalized };
}

module.exports = {
  validateAddExcelPayload,
  MAX_UPLOAD_ROWS,
};
