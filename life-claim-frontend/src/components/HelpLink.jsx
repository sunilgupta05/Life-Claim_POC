import { HelpCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { openHelpAssistant } from '../util/askMeBridge'

/**
 * Inline link that opens Help assistant with an optional pre-selected question.
 */
export default function HelpLink({ questionId, categoryId, label, children, style = {} }) {
  const { tokens: T } = useTheme()
  const text = children || label || 'Need help?'

  return (
    <button
      type="button"
      onClick={() => openHelpAssistant({ questionId, categoryId })}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        marginTop: '10px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: `1px solid ${T.border}`,
        background: T.primaryLight,
        color: T.primary,
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'Inter,sans-serif',
        ...style,
      }}
    >
      <HelpCircle size={13} />
      {text}
    </button>
  )
}
