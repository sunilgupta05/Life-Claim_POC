import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, '..', 'src')

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else if (ent.name.endsWith('.jsx') || ent.name.endsWith('.js')) out.push(p)
  }
  return out
}

for (const file of walk(src)) {
  let code = fs.readFileSync(file, 'utf8')
  const orig = code

  // Fix broken nested import from migrate script
  code = code.replace(/import \{\nimport \{ useTheme \} from '([^']+)'\n/g, "import { useTheme } from '$1'\nimport {\n")

  // Fix Selectextarea typo
  code = code.replace(/Selectextarea/g, 'Select, Textarea')

  // Remove stale T from AddUi imports
  code = code.replace(/import \{ T, PrimaryBtn \} from ('[^']+AddUi')/g, "import { PrimaryBtn } from $1")
  code = code.replace(/import \{ T, ROField, ROGrid, SectionTitle, PrimaryBtn \} from ('[^']+AddUi')/g, "import { ROField, ROGrid, SectionTitle, PrimaryBtn } from $1")
  code = code.replace(/import \{ T, SectionTitle, PrimaryBtn \} from ('[^']+AddUi')/g, "import { SectionTitle, PrimaryBtn } from $1")

  // Remove UI_T import
  code = code.replace(/import \{ UI_T as T \} from ['"][^'"]+theme['"]\n/g, '')

  // Fix Btn, InfoCard} spacing
  code = code.replace(/InfoCard\}/g, 'InfoCard }')
  code = code.replace(/Btn\}/g, 'Btn }')

  if (code !== orig) {
    fs.writeFileSync(file, code)
    console.log('fixed', path.relative(src, file))
  }
}
