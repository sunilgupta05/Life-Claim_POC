// src/util/schemaValidation.js
//
// Validation engine for schema-driven forms (roadmap 2.3). Enforces the
// EFFECTIVE rules (after per-deployment overrides): a hidden field is never
// required; `required` fields must have a value; field `pattern`/`maxLength` are
// checked. Pure + framework-free so it works with SchemaForm and standalone.

/**
 * @param {object[]} fields  effective schema fields (post-override)
 * @param {object}   values  the current values object
 * @returns {{ valid: boolean, errors: {name,label,message}[], missing: string[] }}
 */
export function validateSchema(fields = [], values = {}) {
  const errors = []
  for (const f of fields) {
    if (!f || !f.name || f.hidden) continue // hidden ⇒ not validated
    const raw = values?.[f.name]
    const val = raw === undefined || raw === null ? '' : String(raw).trim()

    if (f.required && val === '') {
      errors.push({ name: f.name, label: f.label || f.name, message: `${f.label || f.name} is required` })
      continue
    }
    if (val === '') continue // optional + empty ⇒ nothing else to check
    if (f.maxLength && val.length > f.maxLength) {
      errors.push({ name: f.name, label: f.label || f.name, message: `${f.label || f.name} exceeds ${f.maxLength} characters` })
    }
    if (f.pattern?.value instanceof RegExp && !f.pattern.value.test(val)) {
      errors.push({ name: f.name, label: f.label || f.name, message: f.pattern.message || `${f.label || f.name} is invalid` })
    }
  }
  return { valid: errors.length === 0, errors, missing: errors.map((e) => e.label) }
}
