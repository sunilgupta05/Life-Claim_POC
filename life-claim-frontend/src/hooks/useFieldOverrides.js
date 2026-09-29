// src/hooks/useFieldOverrides.js
//
// Roadmap 2.3 (Demographics extension). Loads a form's per-deployment field
// overrides (GET /api/form-config/:formKey) and exposes lookup helpers, WITHOUT
// rendering through the schema engine. This lets us make heavy, logic-rich forms
// (e.g. the Demographics tab, whose fields auto-fill from policy and go read-only)
// configurable by only GATING their existing JSX — the value/auto-fill/read-only
// logic stays exactly as written.
//
//   isHidden(name)               → admin hid this field
//   effectiveRequired(name, base)→ admin's Required override, else the base value
//   overrides                    → raw map (for advanced use)
//
// Best-effort: on load failure every field falls back to its base (non-breaking).

import { useEffect, useMemo, useState } from 'react'
import formConfig from '../services/formConfigService'

export function useFieldOverrides(formKey) {
  const [overrides, setOverrides] = useState({})

  useEffect(() => {
    let cancelled = false
    formConfig.getForm(formKey)
      .then((o) => { if (!cancelled) setOverrides(o || {}) })
      .catch(() => { if (!cancelled) setOverrides({}) })
    return () => { cancelled = true }
  }, [formKey])

  return useMemo(() => ({
    overrides,
    isHidden: (name) => overrides[name]?.visible === false,
    effectiveRequired: (name, base) => {
      const r = overrides[name]?.required
      return r === null || r === undefined ? !!base : !!r
    },
  }), [overrides])
}

/**
 * Config-required fields that are visible, not read-only, and currently empty —
 * returned as their labels, for additive submit/section validation. Never relaxes
 * the app's own required rules; only ADDS the admin's extra required fields.
 */
export function missingConfiguredRequired(cfg, catalog = [], data = {}) {
  if (!cfg) return []
  return catalog
    .filter((f) => !f.readOnly && !cfg.isHidden(f.name) && cfg.effectiveRequired(f.name, !!f.required))
    .filter((f) => !String(data?.[f.name] ?? '').trim())
    .map((f) => f.label || f.name)
}
