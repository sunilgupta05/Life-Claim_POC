import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { hydrateCompanyBrand } from './config/companyBrand'

try {
  const saved = localStorage.getItem('life-claims-theme')
  const theme = saved === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
} catch {
  document.documentElement.setAttribute('data-theme', 'light')
}

import App from './App.jsx'

const root = createRoot(document.getElementById('root'))
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Render immediately with the built-in branding defaults (no startup delay),
// then overlay this deployment's org profile (roadmap 0.2). We only re-render
// if the loaded profile actually differs from the defaults, so the default
// deployment renders exactly once — behaviour unchanged.
root.render(tree)

hydrateCompanyBrand()
  .then((changed) => {
    if (changed) root.render(tree)
  })
  .catch(() => {})
