import { useTheme } from '../context/ThemeContext'

/** Sidebar stays dark in both themes. */
export const SIDEBAR_T = {
  sidebar: '#0F172A',
  sidebarBorder: 'rgba(255,255,255,0.06)',
  sidebarHover: 'rgba(255,255,255,0.05)',
  sidebarActive: 'rgba(29,78,216,0.28)',
  sidebarActiveText: '#93C5FD',
}

const light = {
  ...SIDEBAR_T,
  isDark: false,
  primary: '#1D4ED8',
  primaryHover: '#1E40AF',
  primaryLight: '#EFF6FF',
  primaryBorder: '#DBEAFE',
  pageBg: '#F1F5F9',
  card: '#FFFFFF',
  topbar: '#FFFFFF',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  hoverBg: '#F8FAFC',
  inputBg: '#FAFAFA',
  inputBgFocus: '#FFFFFF',
  inputBgReadonly: '#F8FAFC',
  inputBgError: '#FFF5F5',
  surfaceMuted: '#F8FAFC',
  surfaceSubtle: '#FAFAFA',
  dropdownShadow: '0 20px 48px rgba(0,0,0,0.12)',
  cardShadow: '0 1px 3px rgba(0,0,0,0.06)',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  dangerSolid: '#DC2626',
  dangerSolidHover: '#B91C1C',
  successSolid: '#059669',
  successSolidHover: '#047857',
  warningSolid: '#D97706',
  warningSolidHover: '#B45309',
  dangerHover: '#FEF2F2',
  pending: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  approved: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
  rejected: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF' },
  metricBlueBg: '#EFF6FF',
  metricAmberBg: '#FFFBEB',
  metricGreenBg: '#ECFDF5',
  metricRedBg: '#FEF2F2',
  chartGrid: '#E2E8F0',
  chartTooltipBg: '#FFFFFF',
  chartTooltipBorder: '#E2E8F0',
  overlay: 'rgba(15,23,42,0.45)',
  scrollbar: '#CBD5E1',
  scrollbarHover: '#94A3B8',
  crumbDivider: '#CBD5E1',
  sectionOpenBg: '#EFF6FF',
  sectionClosedBg: '#FAFAFA',
  stepInactive: '#E2E8F0',
  toastShadow: '0 8px 24px rgba(0,0,0,0.1)',
}

const dark = {
  ...SIDEBAR_T,
  isDark: true,
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryLight: 'rgba(59,130,246,0.15)',
  primaryBorder: 'rgba(59,130,246,0.35)',
  pageBg: '#0B1220',
  card: '#1E293B',
  topbar: '#1E293B',
  border: '#334155',
  borderSubtle: '#273449',
  textPrimary: '#F8FAFC',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  textSubtle: '#94A3B8',
  hoverBg: '#273449',
  inputBg: '#0F172A',
  inputBgFocus: '#1E293B',
  inputBgReadonly: '#0F172A',
  inputBgError: 'rgba(127,29,29,0.25)',
  surfaceMuted: '#273449',
  surfaceSubtle: '#1E293B',
  dropdownShadow: '0 20px 48px rgba(0,0,0,0.45)',
  cardShadow: '0 1px 3px rgba(0,0,0,0.35)',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  dangerSolid: '#DC2626',
  dangerSolidHover: '#B91C1C',
  successSolid: '#059669',
  successSolidHover: '#047857',
  warningSolid: '#D97706',
  warningSolidHover: '#B45309',
  dangerHover: 'rgba(127,29,29,0.35)',
  pending: { color: '#FBBF24', bg: 'rgba(217,119,6,0.15)', border: 'rgba(251,191,36,0.35)', text: '#FDE68A' },
  approved: { color: '#34D399', bg: 'rgba(5,150,105,0.15)', border: 'rgba(52,211,153,0.35)', text: '#A7F3D0' },
  rejected: { color: '#F87171', bg: 'rgba(220,38,38,0.15)', border: 'rgba(248,113,113,0.35)', text: '#FECACA' },
  info: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', color: '#93C5FD' },
  metricBlueBg: 'rgba(59,130,246,0.12)',
  metricAmberBg: 'rgba(217,119,6,0.12)',
  metricGreenBg: 'rgba(5,150,105,0.12)',
  metricRedBg: 'rgba(220,38,38,0.12)',
  chartGrid: '#334155',
  chartTooltipBg: '#1E293B',
  chartTooltipBorder: '#475569',
  overlay: 'rgba(0,0,0,0.65)',
  scrollbar: '#475569',
  scrollbarHover: '#64748B',
  crumbDivider: '#475569',
  sectionOpenBg: 'rgba(59,130,246,0.12)',
  sectionClosedBg: '#1E293B',
  stepInactive: '#475569',
  toastShadow: '0 8px 24px rgba(0,0,0,0.45)',
}

export const PAGE_TOKENS = { light, dark }

/** @deprecated use useTheme().tokens */
export const UI_T = light

export function usePageTokens() {
  const { tokens } = useTheme()
  return tokens
}

/** Outline toolbar / quick-action button — readable in light and dark mode */
export function outlineButtonStyle(T, extra = {}) {
  return {
    background: T.card,
    color: T.textPrimary,
    border: `1px solid ${T.border}`,
    fontFamily: 'Inter,sans-serif',
    cursor: 'pointer',
    ...extra,
  }
}

/** Search field shell (icon + input row) */
export function inputShellStyle(T, extra = {}) {
  return {
    background: T.inputBg,
    border: `1.5px solid ${T.border}`,
    ...extra,
  }
}

/** Text inputs, selects, textareas — readable in light and dark mode */
export function fieldInputStyle(T, extra = {}) {
  return {
    background: T.inputBg,
    color: T.textPrimary,
    border: `1px solid ${T.border}`,
    fontFamily: 'Inter,sans-serif',
    colorScheme: T.isDark ? 'dark' : 'light',
    ...extra,
  }
}

/** Native select — same as fieldInputStyle with pointer cursor */
export function selectFieldStyle(T, extra = {}) {
  return fieldInputStyle(T, { cursor: 'pointer', ...extra })
}

/** Solid action buttons (primary / danger / success / warning) — saturated fills in dark mode */
export function actionButtonStyle(T, variant = 'primary', { disabled = false, size = 'md' } = {}) {
  const pad = size === 'sm' ? '6px 14px' : size === 'compact' ? '8px 16px' : size === 'lg' ? '14px 32px' : '9px 20px'
  const fontSize = size === 'lg' ? '15px' : '13px'
  const radius = size === 'lg' ? '10px' : '8px'

  if (disabled) {
    return {
      padding: pad,
      borderRadius: radius,
      border: variant === 'secondary' ? `1px solid ${T.border}` : 'none',
      background: T.stepInactive,
      color: T.textSubtle,
      fontSize,
      fontWeight: 700,
      cursor: 'not-allowed',
      fontFamily: 'Inter,sans-serif',
    }
  }

  const configs = {
    primary: { bg: T.primary, color: '#fff', border: 'transparent', shadow: '0 4px 12px rgba(29,78,216,0.25)' },
    secondary: { bg: T.surfaceMuted, color: T.textSecondary, border: T.border, shadow: 'none' },
    danger: { bg: T.dangerSolid, color: '#fff', border: 'transparent', shadow: '0 4px 12px rgba(220,38,38,0.3)' },
    success: { bg: T.successSolid, color: '#fff', border: 'transparent', shadow: '0 4px 12px rgba(5,150,105,0.25)' },
    warning: { bg: T.warningSolid, color: '#fff', border: 'transparent', shadow: '0 4px 12px rgba(217,119,6,0.3)' },
  }
  const c = configs[variant] || configs.primary

  return {
    padding: pad,
    borderRadius: radius,
    border: variant === 'secondary' ? `1px solid ${c.border}` : 'none',
    background: c.bg,
    color: c.color,
    fontSize,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Inter,sans-serif',
    boxShadow: c.shadow,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }
}

/** Icon / badge fills that need a saturated tone (not the light accent text color) */
export function solidToneColor(T, tone = 'primary') {
  const map = {
    primary: T.primary,
    danger: T.dangerSolid,
    success: T.successSolid,
    warning: T.warningSolid,
  }
  return map[tone] || T.primary
}

/** Info / warning / success / danger banners */
export function alertBannerStyle(T, tone = 'info') {
  const toneMap = { info: T.info, warn: T.pending, warning: T.pending, success: T.approved, danger: T.rejected }
  const s = toneMap[tone] || toneMap.info
  return {
    color: s.text ?? s.color,
    background: T.isDark ? T.surfaceMuted : s.bg,
    border: `1px solid ${s.border}`,
  }
}

/** Tone palette slice (info / warn / success / danger) */
export function toneTokens(T, tone = 'info') {
  const map = { info: T.info, warn: T.pending, warning: T.pending, success: T.approved, danger: T.rejected }
  return map[tone] || map.info
}

/** Wizard / decision summary block */
export function summarySectionStyle(T, extra = {}) {
  return {
    padding: '16px 20px',
    background: T.card,
    borderRadius: '10px',
    border: `1px solid ${T.border}`,
    ...extra,
  }
}

/** Ready-to-submit / validation footer panel */
export function submitPanelStyle(T, ready = true, extra = {}) {
  const accent = ready ? T.approved : T.pending
  return {
    background: T.card,
    border: `1px solid ${accent.border}`,
    borderLeft: `4px solid ${accent.color}`,
    borderRadius: '12px',
    padding: '20px',
    ...extra,
  }
}

/** Summary card shell — policy details, trap score, etc. */
export function tonePanelStyle(T, tone = 'info', extra = {}) {
  return { ...alertBannerStyle(T, tone), borderRadius: '10px', padding: '14px 16px', ...extra }
}

export function toneLabelStyle(T, tone = 'info', extra = {}) {
  const s = toneTokens(T, tone)
  return {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: T.isDark ? T.textSubtle : (s.text ?? s.color),
    ...extra,
  }
}

export function toneValueStyle(T, tone = 'info', extra = {}) {
  const s = toneTokens(T, tone)
  return {
    fontSize: '13px',
    fontWeight: 700,
    color: T.isDark ? s.color : (s.text ?? s.color),
    ...extra,
  }
}

/** Small status pill (Received, rider status, etc.) */
export function statusPillStyle(T, tone = 'neutral', extra = {}) {
  const map = {
    success: T.approved,
    approved: T.approved,
    pending: T.pending,
    warn: T.pending,
    danger: T.rejected,
    rejected: T.rejected,
    info: T.info,
    neutral: { bg: T.surfaceMuted, border: T.border, color: T.textMuted, text: T.textMuted },
  }
  const s = map[tone] || map.neutral
  return {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '99px',
    background: T.isDark ? T.surfaceMuted : s.bg,
    color: s.color ?? s.text,
    border: `1px solid ${s.border}`,
    whiteSpace: 'nowrap',
    lineHeight: 1.3,
    ...extra,
  }
}

/** Role / status badge colors that work in light and dark mode */
export function roleBadgeTokens(T, role) {
  const map = {
    'Pre Assessor': { bg: T.info.bg, color: T.info.color ?? T.primary, border: T.info.border },
    Assessor: { bg: T.primaryLight, color: T.primary, border: T.primaryBorder },
    Verifier: { bg: T.approved.bg, color: T.approved.color, border: T.approved.border },
    'Super User': { bg: T.rejected.bg, color: T.rejected.color, border: T.rejected.border },
    Clerk: { bg: T.pending.bg, color: T.pending.color, border: T.pending.border },
  }
  return map[role] || { bg: T.surfaceMuted, color: T.textMuted, border: T.border }
}

/** Dashboard / admin metric tile */
export function metricCardTokens(T, tone = 'info') {
  const map = {
    info: { color: T.primary, bg: T.metricBlueBg, border: T.info.border },
    success: { color: T.success, bg: T.metricGreenBg, border: T.approved.border },
    warn: { color: T.warning, bg: T.metricAmberBg, border: T.pending.border },
    danger: { color: T.danger, bg: T.metricRedBg, border: T.rejected.border },
    neutral: { color: T.textMuted, bg: T.surfaceMuted, border: T.border },
  }
  const base = map[tone] || map.info
  if (T.isDark) {
    return { ...base, bg: T.surfaceMuted }
  }
  return base
}

/** Metric summary tile shell */
export function metricTileStyle(T, tone = 'info', extra = {}) {
  const tok = metricCardTokens(T, tone)
  return {
    padding: '14px 16px',
    background: tok.bg,
    borderRadius: '10px',
    border: `1px solid ${tok.border}`,
    ...extra,
  }
}

/** Status dropdown / compact control with tone border */
export function toneControlStyle(T, tone = 'warn', extra = {}) {
  if (tone === 'neutral') {
    return {
      padding: '5px 10px',
      borderRadius: '7px',
      border: `1.5px solid ${T.border}`,
      background: T.inputBg,
      fontSize: '12px',
      fontWeight: 700,
      color: T.textMuted,
      fontFamily: 'Inter,sans-serif',
      cursor: 'pointer',
      outline: 'none',
      colorScheme: T.isDark ? 'dark' : 'light',
      ...extra,
    }
  }
  const s = toneTokens(T, tone)
  return {
    padding: '5px 10px',
    borderRadius: '7px',
    border: `1.5px solid ${s.border}`,
    background: T.isDark ? T.inputBg : s.bg,
    fontSize: '12px',
    fontWeight: 700,
    color: s.color ?? s.text,
    fontFamily: 'Inter,sans-serif',
    cursor: 'pointer',
    outline: 'none',
    colorScheme: T.isDark ? 'dark' : 'light',
    ...extra,
  }
}
