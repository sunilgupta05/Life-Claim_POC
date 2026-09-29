// src/config/formSchemas.js
//
// Form registry (roadmap 2.3). Names the configurable forms and their field
// SUPERSET (the full set of possible fields, from the 2.2 catalog). A
// per-deployment override (form_field_config, served by GET /api/form-config)
// then hides fields and flips `required` — so each client gets its own form
// variant without a code fork. Overrides are OVERLAID onto the base schema and
// the result is fed to SchemaForm (which already honours `hidden`/`required`).

import {
  IIB_ENQUIRY_FIELDS,
  TELECALLING_FIELDS,
  DECISION_ACCESSOR_FIELDS,
  DECISION_VERIFICATION_FIELDS,
  COMMUNICATION_FIELDS,
} from './registrationCatalog'
import { INTIMATION_FIELDS, LIFE_ASSURED_FIELDS, CONTRACT_FIELDS } from './demographicsCatalog'

/** formKey → { label, fields (superset) }. */
export const FORMS = {
  'registration.iib': { label: 'Registration — IIB Enquiry', fields: IIB_ENQUIRY_FIELDS },
  'registration.telecalling': { label: 'Registration — Telecalling', fields: TELECALLING_FIELDS },
  'registration.communication': { label: 'Registration — Communication', fields: COMMUNICATION_FIELDS },
  'registration.intimation': { label: 'Registration — Intimation Details', fields: INTIMATION_FIELDS },
  'registration.lifeassured': { label: 'Registration — Life Assured', fields: LIFE_ASSURED_FIELDS },
  'registration.contract': { label: 'Registration — Contract Details', fields: CONTRACT_FIELDS },
  'registration.decision.assessor': { label: 'Registration — Assessor Decision', fields: DECISION_ACCESSOR_FIELDS },
  'registration.decision.verification': { label: 'Registration — Verification', fields: DECISION_VERIFICATION_FIELDS },
}

export function listForms() {
  return Object.entries(FORMS).map(([key, f]) => ({ key, label: f.label, fields: f.fields }))
}

export function getBaseFields(formKey) {
  return FORMS[formKey]?.fields || []
}

export function getFormLabel(formKey) {
  return FORMS[formKey]?.label || formKey
}

/**
 * Overlay per-deployment overrides onto a base field list.
 * @param {object[]} fields    base schema fields
 * @param {object}   overrides { fieldName: { visible:boolean, required:boolean|null } }
 * @returns {object[]} effective fields (hidden fields flagged, required adjusted)
 */
export function applyFieldOverrides(fields = [], overrides = {}) {
  if (!overrides || typeof overrides !== 'object') return fields
  return fields.map((f) => {
    const o = overrides[f.name]
    if (!o) return f
    return {
      ...f,
      hidden: o.visible === false ? true : f.hidden,
      // required null/undefined ⇒ inherit the schema default
      required: o.required === null || o.required === undefined ? f.required : !!o.required,
    }
  })
}
