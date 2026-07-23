/**
 * Strip Life Asia insurer prefix from product names for UI display.
 * e.g. "ICICI Pru Super Protect Credit" → "Super Protect Credit"
 */
export function formatProductName(name) {
  if (name == null || name === '') return name
  const text = String(name).trim()
  if (!text || text === 'N/A' || text === '—') return name
  const stripped = text.replace(/^ICICI\s+Pru\s*/i, '').trim()
  return stripped || text
}
