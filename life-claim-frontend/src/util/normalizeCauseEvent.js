/** Map cause_of_claim DB rows to v2 registration shape. */

export function normalizeCauseEventRow(row) {
  if (!row || typeof row !== 'object') return null;

  if ((row.causeCode || row.causeDescription) && !row.CLAIM_CAUSE_CODE && !row.claim_cause_code) {
    return {
      ...row,
      claimSubType: row.claimSubType || row.causeSubType || null,
      causeOfClaim: row.causeOfClaim || row.causeDescription || row.causeCode || null,
    };
  }

  const code = row.CLAIM_CAUSE_CODE ?? row.claim_cause_code ?? '';
  const desc = row.CLAIM_CAUSE_DESC ?? row.claim_cause_desc ?? '';

  return {
    typeOfClaim: row.CLAIMTYPE ?? row.claimtype ?? null,
    causeCode: code,
    causeDescription: desc,
    causeCategory: row.CAUSE_CATEGORY ?? row.cause_category ?? null,
    causeOfClaim: desc || code || null,
    claimSubType: row.CLAIM_SUB_TYPE ?? row.claim_sub_type ?? null,
    claimRegistrationType: row.CLAIM_REGISTRATION_TYPE ?? row.claim_registration_type ?? null,
    status: row.STATUS ?? row.status ?? null,
    iibCauseCode: row.IIB_CAUSE_CODE ?? row.iib_cause_code ?? null,
    iibCauseDesc: row.IIB_CAUSE_DESC ?? row.iib_cause_desc ?? null,
  };
}

export function normalizeCauseEventList(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(normalizeCauseEventRow)
    .filter((row) => row && (row.causeCode || row.causeDescription));
}

export function filterCauseEvents(causes, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return causes;
  return causes.filter((c) =>
    [c.causeCode, c.causeDescription, c.causeCategory, c.claimSubType, c.typeOfClaim]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}
