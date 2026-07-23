/**
 * Integer percentages that always sum to 100 (largest-remainder method).
 * Use when showing multiple share labels on the same total.
 */
export function distributePercents(values, total) {
  if (!total || !values.length) return values.map(() => 0)
  const raw = values.map((v) => (Number(v) / total) * 100)
  const floors = raw.map((r) => Math.floor(r))
  let remainder = 100 - floors.reduce((a, b) => a + b, 0)
  const order = raw
    .map((r, i) => ({ i, frac: r - floors[i] }))
    .sort((a, b) => b.frac - a.frac)
  const result = [...floors]
  for (let k = 0; k < remainder; k++) {
    result[order[k % order.length].i] += 1
  }
  return result
}

/** Single share as a rounded whole percent (for SLA, approval rate, etc.). */
export function percentOf(value, total) {
  if (!total) return 0
  return Math.round((Number(value) / total) * 100)
}

/** Attach `pct` to each row; bar width uses the same value as the label. */
export function withDisplayPercents(items, total, valueKey = 'value') {
  if (!items.length) return []
  const values = items.map((item) => Number(item[valueKey]) || 0)
  const pcts = distributePercents(values, total)
  return items.map((item, i) => ({ ...item, pct: pcts[i] }))
}
