import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, '..', 'src')

const addFiles = [
  'components/add/AddCaseDetailPanel.jsx',
  'components/add/tabs/DataEntryUploaderTab.jsx',
  'components/add/CapsDecisionPanel.jsx',
  'components/add/tabs/ApproverPoolTab.jsx',
  'components/add/tabs/AssessmentPoolTab.jsx',
  'pages/CaseDetails.jsx',
  'components/add/DecisionQueueTab.jsx',
  'components/add/tabs/CaseSearchTab.jsx',
  'components/add/tabs/CaseAssignmentTab.jsx',
  'components/add/ExcelAssignmentTab.jsx',
]

const regFiles = [
  'pages/Registration/DecisionTab.jsx',
  'pages/Registration/DemographicsTab.jsx',
  'pages/Registration/AssessmentTab.jsx',
  'pages/Registration/RegisterFormGate.jsx',
  'pages/Registration/RequirementsTab.jsx',
]

function patch(file, hook, hookPath) {
  const full = path.join(src, file)
  let code = fs.readFileSync(full, 'utf8')
  if (!code.includes(', T }') && !code.includes(', T,') && !code.includes('{ T,')) return
  code = code.replace(/,?\s*T\s*,?/g, (m, offset, str) => {
    const line = str.slice(str.lastIndexOf('\n', offset), str.indexOf('\n', offset))
    if (line.includes('from')) return m.includes(', T') ? '' : m
    return m
  })
  code = code.replace(/\{\s*,/g, '{').replace(/,\s*\}/g, ' }')
  if (!code.includes(hook)) {
    const depth = file.split('/').length - 1
    const prefix = '../'.repeat(depth)
    code = code.replace(/^(import .+\n)/m, `$1import { ${hook} } from '${hookPath || prefix + 'components/add/AddUi'}'\n`)
  }
  if (!code.includes(`const T = ${hook}()`)) {
    code = code.replace(
      /export default function (\w+)\([^)]*\) \{/,
      `export default function $1($2) {\n  const T = ${hook}()`
    )
    code = code.replace(
      /export default function (\w+)\(\) \{/,
      `export default function $1() {\n  const T = ${hook}()`
    )
    code = code.replace(
      /export function (\w+)\([^)]*\) \{/,
      (m, name) => {
        if (code.indexOf(`const T = ${hook}()`) > -1) return m
        return `${m}\n  const T = ${hook}()`
      }
    )
  }
  fs.writeFileSync(full, code)
  console.log('patched', file)
}

for (const f of addFiles) patch(f, 'useAddUiTokens')
for (const f of regFiles) patch(f, 'useRegTokens', '../../pages/Registration/shared')

// ClaimAssignModal + HospitalContacts
for (const [file, depth] of [['components/claim/ClaimAssignModal.jsx', 2], ['pages/HospitalContacts.jsx', 1]]) {
  const full = path.join(src, file)
  let code = fs.readFileSync(full, 'utf8')
  code = code.replace(/import \{ UI_T as T \} from ['"].*theme['"]\n/, `import { useTheme } from '${'../'.repeat(depth)}context/ThemeContext'\n`)
  if (!code.includes('const { tokens: T }')) {
    code = code.replace(/export default function (\w+)\(/, 'export default function $1(')
    code = code.replace(/(export default function \w+\([^)]*\) \{)/, '$1\n  const { tokens: T } = useTheme()')
  }
  fs.writeFileSync(full, code)
  console.log('patched', file)
}
