import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

try {
  const saved = localStorage.getItem('life-claims-theme')
  const theme = saved === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
} catch {
  document.documentElement.setAttribute('data-theme', 'light')
}

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
