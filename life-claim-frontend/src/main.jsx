import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { hydrateCompanyBrand, COMPANY } from './config/companyBrand'
import { applyBrandColors } from './config/brandTheme'

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
    // Apply this deployment's brand colours to the live CSS variables (2.1).
    applyBrandColors(COMPANY.colors, { silent: true })
    if (changed) root.render(tree)
  })
  .catch(() => {})

// PWA installability (roadmap 4.7). Register the (no-cache, passthrough) service
// worker in PRODUCTION builds only, so local dev never serves cached assets.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
