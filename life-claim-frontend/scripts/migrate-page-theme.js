/**
 * One-time helper: replace module-level `const T = { ... }` with useTheme() in page components.
 * Run: node scripts/migrate-page-theme.js
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, '..', 'src')

const files = [
  'pages/MyTask.jsx',
  'pages/PoolSelection.jsx',
  'pages/ClaimSearch.jsx',
  'pages/PolicySearch.jsx',
  'pages/Profile.jsx',
  'pages/AddScreen.jsx',
  'pages/AdminClaimSearch.jsx',
  'pages/AdminOverview.jsx',
  'pages/AdminAuditLog.jsx',
  'pages/AdminWorkloadList.jsx',
  'pages/AdminReports.jsx',
  'pages/UserManagement.jsx',
  'pages/InwardMail.jsx',
  'pages/Registration/index.jsx',
  'components/AskMeChat.jsx',
  'components/DocumentUpload.jsx',
  'components/admin/IntegrationsPanel.jsx',
  'components/admin/LegacyRoutesPanel.jsx',
  'components/claim/ClaimHoverPreview.jsx',
  'components/claim/ClaimSuccessModal.jsx',
  'components/claim/ClaimFraudPreventionModal.jsx',
  'components/claim/FraudRuleManagerModal.jsx',
  'components/claim/TransactionDetailsModal.jsx',
]

const T_BLOCK_RE = /\r?\nconst T = \{[\s\S]*?\}\r?\n/

function migrate(filePath) {
  const full = path.join(src, filePath)
  if (!fs.existsSync(full)) {
    console.log('skip missing', filePath)
    return
  }
  let code = fs.readFileSync(full, 'utf8')
  if (!T_BLOCK_RE.test(code)) {
    console.log('skip no T block', filePath)
    return
  }
  code = code.replace(T_BLOCK_RE, '\n')
  if (!code.includes("from '../context/ThemeContext'") && !code.includes('from "../context/ThemeContext"')) {
    const depth = filePath.split('/').length - 1
    const prefix = depth > 1 ? '../../' : '../'
    const importLine = `import { useTheme } from '${prefix}context/ThemeContext'\n`
    const lastImport = code.lastIndexOf('\nimport ')
    if (lastImport >= 0) {
      const end = code.indexOf('\n', lastImport + 1)
      code = code.slice(0, end + 1) + importLine + code.slice(end + 1)
    } else {
      code = importLine + code
    }
  }
  if (!code.includes('const { tokens: T } = useTheme()')) {
    code = code.replace(
      /export default function (\w+)\([^)]*\) \{/,
      (m, name) => `${m}\n  const { tokens: T } = useTheme()`
    )
    if (!code.includes('const { tokens: T } = useTheme()')) {
      code = code.replace(
        /function (\w+)\([^)]*\) \{/,
        (m, name) => {
          if (name === 'useMediaQuery' || name === 'FloatingInput') return m
          return `${m}\n  const { tokens: T } = useTheme()`
        }
      )
    }
  }
  fs.writeFileSync(full, code)
  console.log('migrated', filePath)
}

for (const f of files) migrate(f)
