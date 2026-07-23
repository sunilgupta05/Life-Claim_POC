import {
  CheckCircle,
  XCircle,
  ClipboardList,
  FileText,
  UserCheck,
} from 'lucide-react'

const LIGHT = {
  approval: { bg: '#ECFDF5', color: '#059669', Icon: CheckCircle },
  approved: { bg: '#ECFDF5', color: '#059669', Icon: CheckCircle },
  rejection: { bg: '#FEF2F2', color: '#DC2626', Icon: XCircle },
  rejected: { bg: '#FEF2F2', color: '#DC2626', Icon: XCircle },
  registration: { bg: '#EFF6FF', color: '#1D4ED8', Icon: FileText },
  modification: { bg: '#FFFBEB', color: '#D97706', Icon: ClipboardList },
  assessment: { bg: '#FFFBEB', color: '#D97706', Icon: ClipboardList },
  document: { bg: '#F0F9FF', color: '#0891B2', Icon: FileText },
  new: { bg: '#EFF6FF', color: '#1D4ED8', Icon: FileText },
  default: { bg: '#F1F5F9', color: '#64748B', Icon: UserCheck },
}

const DARK = {
  approval: { bg: 'rgba(5,150,105,0.15)', color: '#34D399', Icon: CheckCircle },
  approved: { bg: 'rgba(5,150,105,0.15)', color: '#34D399', Icon: CheckCircle },
  rejection: { bg: 'rgba(220,38,38,0.15)', color: '#F87171', Icon: XCircle },
  rejected: { bg: 'rgba(220,38,38,0.15)', color: '#F87171', Icon: XCircle },
  registration: { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', Icon: FileText },
  modification: { bg: 'rgba(217,119,6,0.12)', color: '#FBBF24', Icon: ClipboardList },
  assessment: { bg: 'rgba(217,119,6,0.12)', color: '#FBBF24', Icon: ClipboardList },
  document: { bg: 'rgba(8,145,178,0.12)', color: '#22D3EE', Icon: FileText },
  new: { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', Icon: FileText },
  default: { bg: '#273449', color: '#94A3B8', Icon: UserCheck },
}

/** Icons + colors for dashboard activity / notification rows. */
export function getActivityStyle(type, isDark = false) {
  const map = isDark ? DARK : LIGHT
  return map[type] || map.default
}

/** @deprecated use getActivityStyle(type, isDark) */
export const ACTIVITY_STYLES = LIGHT
