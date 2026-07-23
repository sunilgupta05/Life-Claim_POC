import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function GlobalLoadingBar() {
  const location  = useLocation()
  const [progress, setProgress]   = useState(0)
  const [visible,  setVisible]    = useState(false)
  const timer = useRef(null)
  const prev  = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname === prev.current) return
    prev.current = location.pathname

    // Start loading
    setVisible(true)
    setProgress(10)

    timer.current = setInterval(() => {
      setProgress(p => {
        if (p >= 85) { clearInterval(timer.current); return 85 }
        return p + Math.random() * 12
      })
    }, 120)

    // Complete after short delay
    const done = setTimeout(() => {
      clearInterval(timer.current)
      setProgress(100)
      setTimeout(() => { setVisible(false); setProgress(0) }, 300)
    }, 500)

    return () => { clearInterval(timer.current); clearTimeout(done) }
  }, [location.pathname])

  if (!visible && progress === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
      height: '3px', background: 'transparent', pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #1D4ED8, #60A5FA)',
        transition: progress === 100 ? 'width 0.15s ease, opacity 0.3s ease' : 'width 0.15s ease',
        opacity: visible ? 1 : 0,
        boxShadow: '0 0 8px rgba(29,78,216,0.6)',
      }}/>
    </div>
  )
}
