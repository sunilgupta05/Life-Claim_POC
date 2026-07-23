import { useState, useEffect } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { Search, UserPlus, Upload, Layers, CheckSquare } from 'lucide-react'
import CaseSearchTab from '../components/add/tabs/CaseSearchTab'
import CaseAssignmentTab from '../components/add/tabs/CaseAssignmentTab'
import DataEntryUploaderTab from '../components/add/tabs/DataEntryUploaderTab'
import AssessmentPoolTab from '../components/add/tabs/AssessmentPoolTab'
import ApproverPoolTab from '../components/add/tabs/ApproverPoolTab'
import { useTheme } from '../context/ThemeContext'


const TABS = [
  { id: 'case-search', label: 'Case Search', icon: Search },
  { id: 'assignment', label: 'Case Assignment', icon: UserPlus },
  { id: 'uploader', label: 'Data Entry Uploader', icon: Upload },
  { id: 'assess-pool', label: 'Assessment Pool', icon: Layers },
  { id: 'approver-pool', label: 'Approver Pool', icon: CheckSquare },
]

function TabNav({ active, setActive }) {
  const { tokens: T } = useTheme()
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.card, overflowX: 'auto' }}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActive(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '14px 18px',
            border: 'none',
            borderBottom: active === tab.id ? `2px solid ${T.primary}` : '2px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'Inter,sans-serif',
            color: active === tab.id ? T.primary : T.textMuted,
            fontSize: '13px',
            fontWeight: active === tab.id ? 700 : 500,
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
          }}
        >
          <tab.icon size={14} />
          {tab.label}
        </button>
      ))}
    </div>
  )
}

const TAB_IDS = new Set(TABS.map((t) => t.id))

function resolveTab(location, searchParams) {
  const fromQuery = searchParams.get('tab')
  const fromState = location.state?.addTab
  const pick = fromQuery || fromState
  return TAB_IDS.has(pick) ? pick : 'case-search'
}

/** Advance Intelligence — CAPS workflow (Assessor & Verifier). Separate from life-claim /registration-fetch. */
export default function AddScreen() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => resolveTab(location, searchParams))
  const poolSubTab = location.state?.poolSubTab

  useEffect(() => {
    setActiveTab(resolveTab(location, searchParams))
  }, [location.pathname, location.state?.addTab, searchParams])

  return (
    <AppLayout>
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Advance Intelligence
          </h1>
          <p style={{ fontSize: '13px', color: T.textMuted, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
            CAPS referral and exclusion workflow for assessors and verifiers.
          </p>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <TabNav active={activeTab} setActive={setActiveTab} />
          {activeTab === 'case-search' && <CaseSearchTab toast={toast} />}
          {activeTab === 'assignment' && <CaseAssignmentTab toast={toast} />}
          {activeTab === 'uploader' && <DataEntryUploaderTab toast={toast} />}
          {activeTab === 'assess-pool' && <AssessmentPoolTab toast={toast} initialSubTab={poolSubTab} />}
          {activeTab === 'approver-pool' && <ApproverPoolTab toast={toast} />}
        </div>
      </div>
    </AppLayout>
  )
}
