/**
 * Read VITE_* or legacy REACT_APP_* (Create React App) env vars.
 * Vite exposes both when envPrefix includes REACT_APP_ in vite.config.js.
 */
export function readEnv(name, fallback = '') {
  const v = import.meta.env[`VITE_${name}`] ?? import.meta.env[`REACT_APP_${name}`]
  if (v === undefined || v === null) return fallback
  const s = String(v).trim()
  return s || fallback
}
