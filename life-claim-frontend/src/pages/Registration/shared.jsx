import React, { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { alertBannerStyle, actionButtonStyle, solidToneColor } from '../../ui/pageTokens'

export function useRegTokens() {
  return useTheme().tokens
}

const buildInp = (T, focused, err, readOnly) => ({
  width:'100%', height:'38px', padding:'0 10px',
  border:`1.5px solid ${err ? '#FCA5A5' : focused ? T.primary : T.border}`,
  borderRadius:'7px',
  background: readOnly ? T.inputBgReadonly : err ? T.inputBgError : focused ? T.inputBgFocus : T.inputBg,
  fontSize:'13px', fontWeight:500, color: readOnly ? T.textMuted : T.textPrimary,
  fontFamily:'Inter,sans-serif', outline:'none',
  colorScheme: T.isDark ? 'dark' : 'light',
  boxShadow: focused && !readOnly ? `0 0 0 3px rgba(29,78,216,0.1)` : err ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none',
  transition:'all 0.15s ease', boxSizing:'border-box',
})

export const Label = ({ children, required }) => {
  const T = useRegTokens()
  return (
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.textSecondary, marginBottom: '5px' }}>
      {children}{required && <span style={{ color: T.danger, marginLeft: '2px' }}>*</span>}
    </label>
  )
}

export function Field({ label, required, children, half, full, error }) {
  const T = useRegTokens()
  return (
    <div style={{ gridColumn: full?'1/-1': half?undefined:'auto' }}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && <div style={{ fontSize:'11px', color:T.danger, marginTop:'3px', fontWeight:600 }}>{error}</div>}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type='text', readOnly=false, error, onFocus, onBlur, maxLength, min, max }) {
  const T = useRegTokens()
  const [focused, setFocused] = React.useState(false)
  return (
    <input type={type} value={value||''} onChange={onChange} placeholder={placeholder} readOnly={readOnly} maxLength={maxLength} min={min} max={max}
      style={buildInp(T, focused, error, readOnly)}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
    />
  )
}

export function Select({
  value,
  onChange,
  options = [],
  readOnly = false,
  error,
  showPlaceholder = true,
  placeholder = '-- Select --',
}) {
  const T = useRegTokens()
  const [focused, setFocused] = React.useState(false)
  const selectRef = React.useRef(null)
  const items = options.filter((o) => {
    const v = typeof o === 'string' ? o : o?.value
    return v != null && String(v).trim() !== ''
  })

  const emitChange = React.useCallback(() => {
    if (!onChange || !selectRef.current || readOnly) return
    onChange({ target: selectRef.current, currentTarget: selectRef.current })
  }, [onChange, readOnly])

  const handleKeyUp = (e) => {
    if (readOnly) return
    if (['ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) {
      emitChange()
    }
  }

  return (
    <select
      ref={selectRef}
      value={value ?? ''}
      onChange={onChange}
      onInput={onChange}
      disabled={readOnly}
      style={{ ...buildInp(T, focused, error, readOnly), cursor: readOnly ? 'default' : 'pointer', appearance: 'auto' }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        emitChange()
      }}
      onKeyUp={handleKeyUp}
    >
      {showPlaceholder && <option value="">{placeholder}</option>}
      {items.map((o) => (typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function Textarea({ value, onChange, placeholder, rows=3, readOnly=false }) {
  const T = useRegTokens()
  const [focused, setFocused] = React.useState(false)
  return (
    <textarea value={value||''} onChange={onChange} placeholder={placeholder} rows={rows} readOnly={readOnly}
      style={{ ...buildInp(T, focused, false, readOnly), height:'auto', padding:'8px 10px', resize:'vertical' }}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
    />
  )
}

export function SectionHeader({ title, subtitle, open, onToggle, done }) {
  const T = useRegTokens()
  return (
    <button onClick={onToggle} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background: open ? T.sectionOpenBg : T.sectionClosedBg, border:'none', cursor:'pointer', borderBottom:`1px solid ${T.border}`, fontFamily:'Inter,sans-serif', transition:'background 0.15s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'20px', height:'20px', borderRadius:'50%', background: done ? solidToneColor(T, 'success') : open ? T.primary : T.stepInactive, color:'#fff', fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {done ? '✓' : open ? '●' : '○'}
        </div>
        <div style={{ textAlign:'left' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color: open ? T.primary : T.textPrimary }}>{title}</div>
          {subtitle && <div style={{ fontSize:'11px', color:T.textMuted, marginTop:'1px' }}>{subtitle}</div>}
        </div>
      </div>
      <span style={{ color:T.textMuted, fontSize:'18px', lineHeight:1 }}>{open ? '▲' : '▼'}</span>
    </button>
  )
}

export function Grid({ cols=2, children }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:'14px' }}>
      {children}
    </div>
  )
}

export function SubTabNav({ tabs, active, onChange }) {
  const T = useRegTokens()
  return (
    <div style={{ display:'flex', gap:'4px', background: T.inputBg, border:`1px solid ${T.border}`, borderRadius:'8px', padding:'3px', marginBottom:'20px', width:'fit-content' }}>
      {tabs.map(t => (
        <button key={t} onClick={()=>onChange(t)}
          style={{ padding:'6px 16px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:700, fontFamily:'Inter,sans-serif', transition:'all 0.15s', background:active===t?T.primary:'transparent', color:active===t?'#fff':T.textSubtle, boxShadow:active===t?'0 2px 6px rgba(29,78,216,0.25)':'none' }}>
          {t}
        </button>
      ))}
    </div>
  )
}

export function Btn({ children, onClick, variant='primary', size='md', disabled=false, type='button', icon, style: styleOverride }) {
  const T = useRegTokens()
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...actionButtonStyle(T, variant, { disabled, size }),
        ...styleOverride,
      }}
      onMouseEnter={(e) => {
        if (!disabled && variant !== 'secondary') {
          e.currentTarget.style.filter = 'brightness(0.92)'
          if (size === 'lg') e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = ''
        e.currentTarget.style.transform = ''
      }}
    >
      {children}
    </button>
  )
}

export function InfoCard({ children, type='info' }) {
  const T = useRegTokens()
  const tone = type === 'warning' ? 'warn' : type
  return (
    <div style={{ ...alertBannerStyle(T, tone), borderRadius: '8px', padding: '12px 14px', fontSize: '13px', fontWeight: 500, lineHeight: 1.5 }}>
      {children}
    </div>
  )
}
