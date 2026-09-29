// src/hooks/useFormFields.js
//
// Resolve the EFFECTIVE fields for a configurable form (roadmap 2.3): the base
// superset (formSchemas) overlaid with this deployment's overrides
// (GET /api/form-config/:formKey). Best-effort — on failure the base schema is
// used (non-breaking). Returns the effective fields + a validate() bound to them.

import { useEffect, useMemo, useState } from 'react'
import { getBaseFields, applyFieldOverrides } from '../config/formSchemas'
import { validateSchema } from '../util/schemaValidation'
import formConfig from '../services/formConfigService'

export function useFormFields(formKey) {
  const base = getBaseFields(formKey)
  const [overrides, setOverrides] = useState(null)

  useEffect(() => {
    let cancelled = false
    formConfig.getForm(formKey)
      .then((o) => { if (!cancelled) setOverrides(o || {}) })
      .catch(() => { if (!cancelled) setOverrides({}) }) // fall back to base schema
    return () => { cancelled = true }
  }, [formKey])

  const fields = useMemo(() => applyFieldOverrides(base, overrides || {}), [base, overrides])

  return {
    fields,
    loading: overrides === null,
    validate: (values) => validateSchema(fields, values),
  }
}
