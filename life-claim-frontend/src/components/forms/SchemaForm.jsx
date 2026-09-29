// src/components/forms/SchemaForm.jsx
//
// Schema-driven form renderer (roadmap 2.2). A form is described by DATA — an
// array of field definitions — instead of hand-written JSX. This renderer maps
// each field def to the existing registration primitives (Field/Input/Select/
// Textarea/Grid) so the look is identical, and uses react-hook-form (finally
// leveraged) for state + validation.
//
// Field definition model:
//   {
//     name:      'iibRefNo',            // key in the values object
//     label:     'IIB Reference Number',
//     type:      'text' | 'number' | 'date' | 'select' | 'textarea' | 'yesno',
//     options:   ['Pending', ...] | [{ value, label }],   // select only
//     required:  false,
//     colSpan:   1 | 2 | 'full',        // 'full' spans the whole grid row
//     placeholder, maxLength, rows,
//     pattern:   { value: RegExp, message },               // optional validation
//     readOnly:  false,
//     hidden:    false,                 // (2.3 will drive show/hide/require here)
//   }
//
// It is controlled from the outside: `values` seeds the fields and every change
// is pushed up via `onChange(name, value)`, so it drops into the existing
// wizard's data/update state with no behaviour change.

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Field, Input, Select, Textarea, Grid } from '../../pages/Registration/shared'

/** Build react-hook-form validation rules from a field definition. */
function rulesFor(f) {
  const rules = {}
  if (f.required) rules.required = `${f.label || f.name} is required`
  if (f.maxLength) rules.maxLength = { value: f.maxLength, message: `Max ${f.maxLength} characters` }
  if (f.pattern?.value) rules.pattern = { value: f.pattern.value, message: f.pattern.message || 'Invalid format' }
  return rules
}

/** Value from a change event (our Select/Input emit an event) or a raw value. */
const readValue = (e) => (e && e.target !== undefined ? e.target.value : e)

function FieldControl({ f, control, onChange, readOnly }) {
  const disabled = readOnly || f.readOnly
  return (
    <Controller
      name={f.name}
      control={control}
      rules={rulesFor(f)}
      render={({ field, fieldState }) => {
        const handle = (e) => {
          const v = readValue(e)
          field.onChange(v)
          onChange?.(f.name, v)
        }
        const common = { value: field.value ?? '', onChange: handle, readOnly: disabled, error: fieldState.error?.message }
        let input
        if (f.type === 'textarea') {
          input = <Textarea {...common} placeholder={f.placeholder} rows={f.rows || 3} />
        } else if (f.type === 'select' || f.type === 'yesno') {
          const options = f.type === 'yesno' ? (f.options || ['Yes', 'No']) : (f.options || [])
          input = <Select {...common} options={options} placeholder={f.placeholder} />
        } else {
          input = <Input {...common} type={f.type || 'text'} placeholder={f.placeholder} maxLength={f.maxLength} />
        }
        return (
          <Field label={f.label} required={f.required} full={f.colSpan === 'full'} error={fieldState.error?.message}>
            {input}
          </Field>
        )
      }}
    />
  )
}

/**
 * @param {object[]} schema   field definitions (hidden fields are skipped)
 * @param {object}   values   current values (data object)
 * @param {(name,value)=>void} onChange  called on each field change
 * @param {number}   columns  grid columns (default 2)
 * @param {boolean}  readOnly whole-form read-only
 */
export default function SchemaForm({ schema = [], values = {}, onChange, columns = 2, readOnly = false }) {
  const visible = schema.filter((f) => f && f.name && !f.hidden)
  const defaultValues = Object.fromEntries(visible.map((f) => [f.name, values?.[f.name] ?? '']))
  const { control, reset } = useForm({ defaultValues, mode: 'onBlur' })

  // Re-seed if the incoming record identity changes (e.g. a different claim
  // loads into the wizard). Keyed on the value snapshot of the schema fields.
  const seed = JSON.stringify(defaultValues)
  useEffect(() => { reset(defaultValues); /* eslint-disable-next-line */ }, [seed])

  return (
    <Grid cols={columns}>
      {visible.map((f) => (
        <FieldControl key={f.name} f={f} control={control} onChange={onChange} readOnly={readOnly} />
      ))}
    </Grid>
  )
}
