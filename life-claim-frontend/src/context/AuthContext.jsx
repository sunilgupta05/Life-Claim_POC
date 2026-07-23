import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react'
import authService from '../services/authService'
import { AUTH_LOGOUT_CHANNEL } from '../util/authBroadcast'
import { readEnv } from '../util/env'
import { coalesceRoles } from '../util/workflowRole'
import { isSuperUserRole, hasSuperUserAccess } from '../util/superuserRole'
import { buildUserFromProfile, clearLegacyTokenStorage } from '../util/authUser'

const AuthContext = createContext(null)

const IDLE_MS = (parseInt(readEnv('IDLE_TIMEOUT_MINUTES', '5'), 10) || 5) * 60 * 1000
const WARN_MS = 60 * 1000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [idleWarning, setIdleWarning] = useState(false)
  const idleTimer = useRef(null)
  const warnTimer = useRef(null)
  const bc = useRef(null)

  const clearSession = useCallback(() => {
    clearLegacyTokenStorage()
    sessionStorage.removeItem('loggedUser')
    setUser(null)
    setIdleWarning(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const profile = await authService.authenticate()
        if (!cancelled && profile) {
          setUser(buildUserFromProfile(profile))
        }
      } catch (err) {
        if (!cancelled) {
          if (err?.concurrentLogout) {
            sessionStorage.setItem('auth_logout_reason', 'concurrent')
          }
          clearSession()
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [clearSession])

  useEffect(() => {
    try {
      bc.current = new BroadcastChannel(AUTH_LOGOUT_CHANNEL)
      bc.current.onmessage = (ev) => {
        if (!user) return
        const reason = ev?.data?.reason || 'session'
        if (!sessionStorage.getItem('auth_logout_reason')) {
          sessionStorage.setItem('auth_logout_reason', reason)
        }
        clearSession()
      }
    } catch {}
    return () => { try { bc.current?.close() } catch {} }
  }, [clearSession, user])

  const resetIdleTimer = useCallback(() => {
    clearTimeout(idleTimer.current)
    clearTimeout(warnTimer.current)
    setIdleWarning(false)
    if (!user) return
    warnTimer.current = setTimeout(() => setIdleWarning(true), IDLE_MS - WARN_MS)
    idleTimer.current = setTimeout(async () => {
      sessionStorage.setItem('auth_logout_reason', 'idle')
      await authService.logout({ logoutReason: 'idle' }).catch(() => {})
      clearSession()
      try { bc.current?.postMessage({ type: 'logout', reason: 'idle' }) } catch {}
    }, IDLE_MS)
  }, [clearSession, user])

  useEffect(() => {
    if (!user) return
    const evts = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click']
    evts.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }))
    resetIdleTimer()
    return () => {
      evts.forEach(e => window.removeEventListener(e, resetIdleTimer))
      clearTimeout(idleTimer.current)
      clearTimeout(warnTimer.current)
    }
  }, [user, resetIdleTimer])

  useEffect(() => {
    if (!user) return undefined
    const intervalMs = Number(readEnv('SESSION_CHECK_INTERVAL_MS', '90000'), 10) || 90000
    const tick = async () => {
      try {
        await authService.verifyServerSession()
      } catch (err) {
        if (err?.concurrentLogout) {
          sessionStorage.setItem('auth_logout_reason', 'concurrent')
          await authService.logout({ logoutReason: 'concurrent' }).catch(() => {})
          clearSession()
          try { bc.current?.postMessage({ type: 'logout', reason: 'concurrent' }) } catch {}
        }
      }
    }
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [user, clearSession])

  const login = useCallback(async (username, password, captchaToken) => {
    const profile = await authService.login(username, password, captchaToken)
    const userData = buildUserFromProfile(profile)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async (broadcast = true, reason = 'user') => {
    sessionStorage.setItem('auth_logout_reason', reason)
    await authService.logout({ logoutReason: reason }).catch(() => {})
    clearSession()
    if (broadcast) {
      try { bc.current?.postMessage({ type: 'logout', reason }) } catch {}
    }
  }, [clearSession])

  const extendSession = useCallback(() => { resetIdleTimer(); setIdleWarning(false) }, [resetIdleTimer])

  const hasRole = useCallback((required) => {
    const req = Array.isArray(required) ? required : [required]
    if (req.some(isSuperUserRole) && hasSuperUserAccess(user?.roles, user?.username)) {
      return true
    }
    const allRoles = coalesceRoles(user?.roles, user?.role)
    if (!allRoles.length) return false
    const norm = (s) => String(s || '').toLowerCase().replace(/-/g, ' ').replace(/_/g, ' ').trim()
    return req.some((r) =>
      allRoles.some((ur) => {
        const a = norm(ur)
        const b = norm(r)
        if (isSuperUserRole(ur) && isSuperUserRole(r)) return true
        return ur === r || a === b || (b === 'pre assessor' && a.includes('pre') && a.includes('assessor'))
      })
    )
  }, [user])

  const value = useMemo(
    () => ({ user, loading, login, logout, idleWarning, extendSession, hasRole, authenticated: !!user }),
    [user, loading, login, logout, idleWarning, extendSession, hasRole]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
