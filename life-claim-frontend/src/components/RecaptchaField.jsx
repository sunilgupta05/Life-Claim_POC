import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { resolveRecaptchaSiteKey } from '../config/recaptchaSiteKey'

const SCRIPT_SOURCES = [
  'https://www.google.com/recaptcha/api.js?render=explicit',
  'https://www.recaptcha.net/recaptcha/api.js?render=explicit',
]
const SCRIPT_ID = 'google-recaptcha-v2'

const RecaptchaField = forwardRef(function RecaptchaField(
  { onReady, onExpired, onError, onReset, disabled, remountKey = 0 },
  ref
) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const onReadyRef = useRef(onReady)
  const onExpiredRef = useRef(onExpired)
  const onErrorRef = useRef(onError)
  const onResetRef = useRef(onReset)
  onReadyRef.current = onReady
  onExpiredRef.current = onExpired
  onErrorRef.current = onError
  onResetRef.current = onReset

  const [scriptReady, setScriptReady] = useState(Boolean(typeof window !== 'undefined' && window.grecaptcha))

  useImperativeHandle(ref, () => ({
    getToken: () => {
      if (widgetIdRef.current == null || !window.grecaptcha?.getResponse) return ''
      return window.grecaptcha.getResponse(widgetIdRef.current) || ''
    },
    reset: () => {
      if (widgetIdRef.current != null && window.grecaptcha?.reset) {
        window.grecaptcha.reset(widgetIdRef.current)
        onResetRef.current?.()
      }
    },
  }))

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (window.grecaptcha) {
      setScriptReady(true)
      return undefined
    }
    let cancelled = false
    let pollId

    const finishReady = () => {
      if (!cancelled) setScriptReady(true)
    }

    const pollExisting = () => {
      pollId = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(pollId)
          finishReady()
        }
      }, 80)
    }

    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      pollExisting()
      return () => {
        cancelled = true
        clearInterval(pollId)
      }
    }

    let sourceIndex = 0
    const tryLoad = () => {
      if (cancelled || sourceIndex >= SCRIPT_SOURCES.length) {
        onErrorRef.current?.()
        return
      }
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = SCRIPT_SOURCES[sourceIndex]
      script.async = true
      script.defer = true
      script.onload = finishReady
      script.onerror = () => {
        script.remove()
        sourceIndex += 1
        tryLoad()
      }
      document.head.appendChild(script)
    }

    tryLoad()
    return () => {
      cancelled = true
      clearInterval(pollId)
    }
  }, [])

  // Keep widget mounted while loading/disabled — only remount when remountKey changes.
  useEffect(() => {
    if (!scriptReady || !containerRef.current) return undefined
    const siteKey = resolveRecaptchaSiteKey()
    let cancelled = false

    const render = () => {
      if (cancelled || !window.grecaptcha?.render || !containerRef.current) return
      if (widgetIdRef.current != null) return
      try {
        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: () => onReadyRef.current?.(),
          'expired-callback': () => onExpiredRef.current?.(),
          'error-callback': () => onErrorRef.current?.(),
        })
      } catch {
        onErrorRef.current?.()
      }
    }

    if (window.grecaptcha?.ready) {
      window.grecaptcha.ready(render)
    } else {
      render()
    }

    return () => {
      cancelled = true
      const el = containerRef.current
      if (el) el.innerHTML = ''
      widgetIdRef.current = null
    }
  }, [scriptReady, remountKey])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        minHeight: '78px',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <div ref={containerRef} />
    </div>
  )
})

export default RecaptchaField
