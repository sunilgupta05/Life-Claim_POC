import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PAGE_TOKENS } from '../ui/pageTokens'
import { COMPANY } from '../config/companyBrand'
import { onBrandChange } from '../config/brandTheme'

const STORAGE_KEY = 'life-claims-theme'

const ThemeContext = createContext(null)

function readStoredTheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function applyThemeToDocument(theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)
  // Bumped when the org's brand colours change (2.1), so `tokens` recomputes and
  // JS-token inline styles (T.primary/T.accent) pick up the new brand hue.
  const [brandVersion, setBrandVersion] = useState(0)

  useEffect(() => {
    applyThemeToDocument(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  useEffect(() => onBrandChange(() => setBrandVersion((v) => v + 1)), [])

  const setTheme = (mode) => setThemeState(mode === 'dark' ? 'dark' : 'light')

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      // Overlay the configured brand colours (roadmap 2.1) onto the base tokens.
      tokens: {
        ...PAGE_TOKENS[theme],
        ...(COMPANY.colors?.primary ? { primary: COMPANY.colors.primary } : {}),
        ...(COMPANY.colors?.accent ? { accent: COMPANY.colors.accent } : {}),
      },
      setTheme,
      toggleTheme: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, brandVersion],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
