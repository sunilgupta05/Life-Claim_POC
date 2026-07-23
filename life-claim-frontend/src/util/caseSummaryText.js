const fmt = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : '—')

function row(label, value) {
  return { label, value: fmt(value) }
}

/** Structured sections for PDF report and on-screen preview. */
export function buildCaseSummaryReport(claim = {}, demogs = {}) {
  const intimation = demogs?.intimation || {}
  const la = demogs?.lifeAssured || {}
  const cause = demogs?.establishedCause || {}
  const claimants = Array.isArray(demogs?.claimant) ? demogs.claimant : []
  const payees = Array.isArray(demogs?.payee) ? demogs.payee : []

  const sections = [
    {
      title: 'Claim Overview',
      rows: [
        row('Claim Number', claim.claimId),
        row('Policy Number', claim.policyId),
        row('Claim Type', claim.claimType),
        row('Workflow Status', claim.status),
        row('Assigned To', claim.assignedTo || 'Unassigned'),
        row('Workflow Role', claim.claimRole),
        row('Priority', claim.priority),
        row('Days Open', claim.daysOpen != null ? `${claim.daysOpen}` : null),
      ],
    },
    {
      title: 'Life Assured',
      rows: [
        row('Name', la.name || la.laName || claim.laName),
        row('Date of Birth', la.dob || la.dateOfBirth || claim.laDob),
        row('Gender', la.gender || claim.laGender),
        row('City / State', [la.city || claim.laCity, la.state || claim.laState].filter(Boolean).join(', ')),
        row('Mobile', la.mobileNo || la.mobile || claim.laMobile),
      ],
    },
    {
      title: 'Intimation & Event',
      rows: [
        row('Intimation Date', intimation.intimationDate || intimation.initiationDate || claim.intimationDate),
        row('Source', intimation.source || claim.source),
        row('Information Type', intimation.informationType || claim.informationType),
        row('Bond Type', intimation.bondType || claim.bondType),
        row('Date of Death / Event', intimation.dateOfDeath || intimation.dateOfDeathEvent || claim.dateOfDeathEvent),
        row('Place of Death', intimation.placeOfDeath),
        row('FIR / PM Received', intimation.firPmReceived || claim.firPmReceived),
        row('Declared by Doctor', intimation.declaredByDoctor || claim.declaredByDoctor),
      ],
    },
    {
      title: 'Cause of Death / Event',
      rows: [
        row('Cause Code', claim.causeCode || cause.causeCode),
        row('Cause Description', claim.causeDescription || cause.causeDescription),
        row('Event Date', cause.dateOfEvent || intimation.dateOfDeathEvent),
      ],
    },
    {
      title: 'Claimant(s)',
      rows: claimants.length
        ? claimants.flatMap((c, i) => [
            row(claimants.length > 1 ? `Claimant ${i + 1} — Name` : 'Name', c.name || c.claimantName),
            row(claimants.length > 1 ? `Claimant ${i + 1} — Relation` : 'Relation', c.relation || c.relationWithLa),
            row(claimants.length > 1 ? `Claimant ${i + 1} — Mobile` : 'Mobile', c.mobileNo || c.mobile),
          ])
        : [row('Claimant', 'No claimant recorded')],
    },
    {
      title: 'Payee',
      rows: payees.length
        ? payees.flatMap((p, i) => [
            row(payees.length > 1 ? `Payee ${i + 1} — Name` : 'Name', p.name || p.payeeName),
            row(payees.length > 1 ? `Payee ${i + 1} — Relation` : 'Relation', p.relation || p.payeeRelation),
          ])
        : [row('Payee', claim.payeeName || 'Not specified')],
    },
  ]

  return {
    claimId: claim.claimId,
    policyId: claim.policyId,
    sections,
  }
}

/** Short narrative for compact display (legacy). */
export function buildCaseSummaryNarrative(claim, demogs) {
  const intimation = demogs?.intimation || {}
  const la = demogs?.lifeAssured || {}
  const claimants = demogs?.claimant || []

  return [
    `Claim ${fmt(claim?.claimId)} on policy ${fmt(claim?.policyId)} (${fmt(claim?.claimType)}).`,
    `Life assured: ${fmt(la.name || la.laName || claim?.laName)}.`,
    `Intimation: ${fmt(intimation.intimationDate || claim?.intimationDate)} via ${fmt(intimation.source || claim?.source)}.`,
    `Event date: ${fmt(intimation.dateOfDeath || intimation.dateOfDeathEvent || claim?.dateOfDeathEvent)}.`,
    `Cause: ${fmt(claim?.causeDescription)} (${fmt(claim?.causeCode)}).`,
    `Status: ${fmt(claim?.status)} · Workflow role: ${fmt(claim?.claimRole)} · Assigned: ${fmt(claim?.assignedTo || 'unassigned')}.`,
    claimants.length
      ? `Claimant(s): ${claimants.map((c) => c.name || c.claimantName).filter(Boolean).join(', ')}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
}
