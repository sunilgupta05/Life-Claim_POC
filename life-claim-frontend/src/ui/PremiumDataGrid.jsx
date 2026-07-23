/**
 * Premium data grid — consistent table styling app-wide.
 * Pair with `.premium-grid` CSS in index.css (theme-aware via CSS variables).
 */

export function PremiumGrid({ children, className = '' }) {
  return <div className={`premium-grid ${className}`.trim()}>{children}</div>
}

export function PremiumGridToolbar({ children, className = '' }) {
  return <div className={`premium-grid__toolbar ${className}`.trim()}>{children}</div>
}

export function PremiumGridScroll({ children, className = '' }) {
  return <div className={`premium-grid__scroll ${className}`.trim()}>{children}</div>
}

export function PremiumGridFooter({ children, className = '' }) {
  return <div className={`premium-grid__footer ${className}`.trim()}>{children}</div>
}

export function PremiumGridEmpty({ icon = '🔍', title, subtitle, action }) {
  return (
    <div className="premium-grid__empty">
      {icon && <div className="premium-grid__empty-icon">{icon}</div>}
      {title && <div className="premium-grid__empty-title">{title}</div>}
      {subtitle && <div className="premium-grid__empty-sub">{subtitle}</div>}
      {action}
    </div>
  )
}

/** Sortable column header */
export function SortableTh({ active, onClick, children, sortIcon, className = '' }) {
  const cls = [
    onClick ? 'is-sortable' : '',
    active ? 'is-active' : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <th className={cls} onClick={onClick}>
      <span className="premium-grid__th-inner">
        {children}
        {sortIcon}
      </span>
    </th>
  )
}

/** Pill filter group (date/status filters) */
export function FilterPillGroup({ children, className = '' }) {
  return <div className={`premium-grid__pill-group ${className}`.trim()}>{children}</div>
}

export function FilterPill({ active, onClick, children, variant = 'neutral' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`premium-grid__pill ${active ? 'is-active' : ''} ${variant === 'primary' ? 'is-primary' : ''}`.trim()}
    >
      {children}
    </button>
  )
}

/** Compact icon action in grid rows */
export function GridIconBtn({ title, onClick, children, variant = 'default' }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`premium-grid__icon-btn ${variant !== 'default' ? `is-${variant}` : ''}`.trim()}
    >
      {children}
    </button>
  )
}

/** Status pill badge */
export function GridStatusBadge({ children, tone = 'neutral' }) {
  return <span className={`premium-grid__badge is-${tone}`}>{children}</span>
}
