import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../context/ThemeContext'
import SchemaForm from './SchemaForm'

// The field primitives use theme tokens, so wrap in ThemeProvider.
const renderForm = (props) => render(<ThemeProvider><SchemaForm {...props} /></ThemeProvider>)

const schema = [
  { name: 'refNo', label: 'Reference', type: 'text' },
  { name: 'status', label: 'Status', type: 'select', options: ['A', 'B'] },
  { name: 'flag', label: 'Flag', type: 'yesno' },
  { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 'full' },
]

describe('SchemaForm (roadmap 2.2)', () => {
  it('renders one field per definition (labels present)', () => {
    renderForm({ schema, values: {}, onChange: () => {} })
    for (const label of ['Reference', 'Status', 'Flag', 'Notes']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('seeds from values and emits onChange(name, value)', () => {
    const onChange = vi.fn()
    renderForm({ schema, values: { refNo: 'CL1' }, onChange })
    const input = screen.getByDisplayValue('CL1')
    fireEvent.change(input, { target: { value: 'CL2' } })
    expect(onChange).toHaveBeenCalledWith('refNo', 'CL2')
  })

  it('skips hidden fields (forward-looking for 2.3 toggles)', () => {
    renderForm({
      schema: [...schema, { name: 'secret', label: 'Secret', type: 'text', hidden: true }],
      values: {}, onChange: () => {},
    })
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('yesno renders Yes/No options', () => {
    renderForm({ schema: [{ name: 'flag', label: 'Flag', type: 'yesno' }], values: {}, onChange: () => {} })
    expect(screen.getByRole('option', { name: 'Yes' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'No' })).toBeInTheDocument()
  })

  it('marks required fields with an asterisk', () => {
    renderForm({ schema: [{ name: 'x', label: 'Needed', type: 'text', required: true }], values: {}, onChange: () => {} })
    // the Label renders label text + a "*" span for required
    expect(screen.getByText('Needed')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})
