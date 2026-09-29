// src/components/forms/CfgField.jsx
//
// Config-aware field wrapper (roadmap 2.3, Demographics extension). A drop-in for
// the existing <Field> that ONLY adds two things driven by per-deployment config:
//   - HIDE: render nothing when an admin hid this field.
//   - REQUIRED: show/enforce the admin's Required override (falls back to the
//     field's own `required` when there is no override).
//
// Crucially, the CHILDREN are passed through untouched — the same <Input>/<Select>
// with the same value / auto-fill / onChange / readOnly logic. So policy auto-fill
// (`data.laName || policyClients[0]?.name`) and read-only-when-policy-loaded
// behave EXACTLY as before; we only gate visibility and the required marker.
//
// Uses a context so call sites don't have to thread the config object through
// every field. Outside a provider (or before config loads) it behaves like a
// plain <Field> — non-breaking.

import { createContext, useContext } from 'react'
import { Field } from '../../pages/Registration/shared'

export const FieldConfigContext = createContext(null)

export function CfgField({ name, label, required, full, error, children }) {
  const cfg = useContext(FieldConfigContext)
  if (cfg && name && cfg.isHidden(name)) return null
  const req = cfg && name ? cfg.effectiveRequired(name, required) : required
  return (
    <Field label={label} required={req} full={full} error={error}>
      {children}
    </Field>
  )
}
