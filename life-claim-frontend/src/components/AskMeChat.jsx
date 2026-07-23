import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  MessageCircle,
  X,
  Send,
  RotateCcw,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  HelpCircle,
  Loader2,
  Copy,
  Check,
  Compass,
  FileSearch,
  Briefcase,
  Layers,
  ScanSearch,
  FileText,
  GitBranch,
  UserCircle,
  Clock,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { fieldInputStyle } from '../ui/pageTokens'
import { ASKME_OPEN_EVENT } from '../util/askMeBridge'
import {
  GREETING_PATTERN,
  ESCALATION_TEXT,
  CATEGORY_ICON_IDS,
  matchQuestion,
  suggestQuestions,
  autocompleteQuestions,
  findCategory,
  findQuestion,
  getCategoriesForUser,
  getPopularQuestions,
  getRecentQuestions,
  getRoleWelcome,
  getPageContextHint,
  getRelatedQuestions,
  getQuestionsForUser,
  loadChatSession,
  saveChatSession,
  clearChatSession,
  recordAnswerFeedback,
  recordRecentQuestion,
  plainHelpText,
} from '../config/askMeKnowledge'

const GREETING_REPLY =
  'Hello! **Choose a topic** below, tap a popular question, or type your question (e.g. "How do I search for a policy?").'

const NO_MATCH_TEXT =
  'I couldn\'t find an exact match. Try one of the suggestions below, **choose a topic**, or rephrase using words like "claim search", "SCN", or "My Tasks".'

const BOT_DELAY_MS = 280
const COLLAPSE_CHAR_LIMIT = 280
const COLLAPSE_PARA_LIMIT = 3
const FAB_SIZE = 56
const PANEL_DEFAULT_W = 460
const PANEL_DEFAULT_H = 640
const PANEL_MIN_W = 340
const PANEL_MIN_H = 380
const PANEL_MAX_W = 760
const PANEL_MAX_H = 920
const EDGE_MARGIN = 12
const FAB_PANEL_GAP = 12
const DRAG_THRESHOLD = 5
const POS_STORAGE_KEY = 'askMePositions'

function clampPanelSize(w, h) {
  if (typeof window === 'undefined') {
    return { w: PANEL_DEFAULT_W, h: PANEL_DEFAULT_H }
  }
  const maxW = Math.min(PANEL_MAX_W, window.innerWidth - EDGE_MARGIN * 2)
  const maxH = Math.min(PANEL_MAX_H, window.innerHeight - EDGE_MARGIN * 2)
  return {
    w: Math.round(Math.min(Math.max(PANEL_MIN_W, w), maxW)),
    h: Math.round(Math.min(Math.max(PANEL_MIN_H, h), maxH)),
  }
}

function applyPanelResize(edge, dx, dy, origPanelX, origPanelY, origW, origH) {
  let nextW = origW
  let nextH = origH

  if (edge.includes('e')) nextW = origW + dx
  if (edge.includes('w')) nextW = origW - dx
  if (edge.includes('s')) nextH = origH + dy
  if (edge.includes('n')) nextH = origH - dy

  const size = clampPanelSize(nextW, nextH)
  let nextX = origPanelX
  let nextY = origPanelY

  if (edge.includes('w')) nextX = origPanelX + (origW - size.w)
  if (edge.includes('n')) nextY = origPanelY + (origH - size.h)

  return {
    size,
    pos: clampBox(nextX, nextY, size.w, size.h),
  }
}

function getDefaultPanelSize() {
  return clampPanelSize(PANEL_DEFAULT_W, PANEL_DEFAULT_H)
}

function getDefaultFabPosition() {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  return {
    x: window.innerWidth - EDGE_MARGIN - FAB_SIZE,
    y: window.innerHeight - EDGE_MARGIN - FAB_SIZE,
  }
}

function clampBox(x, y, w, h) {
  if (typeof window === 'undefined') return { x, y }
  const maxX = Math.max(EDGE_MARGIN, window.innerWidth - w - EDGE_MARGIN)
  const maxY = Math.max(EDGE_MARGIN, window.innerHeight - h - EDGE_MARGIN)
  return {
    x: Math.min(Math.max(EDGE_MARGIN, x), maxX),
    y: Math.min(Math.max(EDGE_MARGIN, y), maxY),
  }
}

function computePanelPosition(fabPos, size = getDefaultPanelSize()) {
  const { w, h } = size
  let x = fabPos.x + FAB_SIZE - w
  let y = fabPos.y - h - FAB_PANEL_GAP
  if (y < EDGE_MARGIN) {
    y = fabPos.y + FAB_SIZE + FAB_PANEL_GAP
    if (y + h > window.innerHeight - EDGE_MARGIN) {
      y = Math.max(EDGE_MARGIN, window.innerHeight - h - EDGE_MARGIN)
    }
  }
  return clampBox(x, y, w, h)
}

function loadPositions() {
  try {
    const raw = sessionStorage.getItem(POS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.fab && typeof parsed.fab.x === 'number') return parsed
  } catch {
    // ignore
  }
  return null
}

function savePositions(fab, panel, size) {
  try {
    sessionStorage.setItem(POS_STORAGE_KEY, JSON.stringify({ fab, panel, size }))
  } catch {
    // ignore
  }
}

const CATEGORY_ICONS = {
  compass: Compass,
  'file-search': FileSearch,
  briefcase: Briefcase,
  layers: Layers,
  'scan-search': ScanSearch,
  'file-text': FileText,
  'git-branch': GitBranch,
  'user-circle': UserCircle,
}

function renderMarkdownLite(text) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ))
  })
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function CategoryIcon({ categoryId }) {
  const iconKey = CATEGORY_ICON_IDS[categoryId]
  const Icon = CATEGORY_ICONS[iconKey] || HelpCircle
  return <Icon size={14} style={{ flexShrink: 0, opacity: 0.85 }} />
}

function BotAnswerContent({ msg, T }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const title = msg.questionTitle || ''
  const body = msg.answerBody || msg.text || ''
  const paras = body.split('\n\n')
  const long = body.length > COLLAPSE_CHAR_LIMIT || paras.length > COLLAPSE_PARA_LIMIT
  const visibleBody = long && !expanded ? `${paras.slice(0, 2).join('\n\n')}…` : body

  const copyAnswer = async () => {
    const full = title ? `${plainHelpText(title)}\n\n${plainHelpText(body)}` : plainHelpText(body)
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title ? (
            <>
              {renderMarkdownLite(`**${title}**`)}
              <div style={{ height: '8px' }} />
            </>
          ) : (
            renderMarkdownLite(msg.text)
          )}
          {title && renderMarkdownLite(visibleBody)}
        </div>
        {title && (
          <button
            type="button"
            onClick={copyAnswer}
            title="Copy answer"
            aria-label="Copy answer"
            style={{
              flexShrink: 0,
              border: `1px solid ${T.border}`,
              background: copied ? T.primaryLight : T.card,
              borderRadius: '6px',
              padding: '5px',
              cursor: 'pointer',
              color: copied ? T.primary : T.textMuted,
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        )}
      </div>
      {title && long && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          style={{
            marginTop: '8px',
            padding: 0,
            border: 'none',
            background: 'none',
            color: T.primary,
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Inter,sans-serif',
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </>
  )
}

export default function AskMeChat() {
  const { tokens: T } = useTheme()
  const { hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [noMatchCount, setNoMatchCount] = useState(0)
  const [fabPos, setFabPos] = useState(getDefaultFabPosition)
  const [panelPos, setPanelPos] = useState(null)
  const [panelSize, setPanelSize] = useState(getDefaultPanelSize)
  const [dragging, setDragging] = useState(false)
  const endRef = useRef(null)
  const hydratedRef = useRef(false)
  const fabPosRef = useRef(fabPos)
  const panelPosRef = useRef(panelPos)
  const panelSizeRef = useRef(panelSize)
  const dragRef = useRef({ active: null, moved: false })

  useEffect(() => {
    fabPosRef.current = fabPos
  }, [fabPos])

  useEffect(() => {
    panelPosRef.current = panelPos
  }, [panelPos])

  useEffect(() => {
    panelSizeRef.current = panelSize
  }, [panelSize])

  useEffect(() => {
    const saved = loadPositions()
    if (saved?.fab) {
      setFabPos(clampBox(saved.fab.x, saved.fab.y, FAB_SIZE, FAB_SIZE))
    }
    if (saved?.size) {
      setPanelSize(clampPanelSize(saved.size.w, saved.size.h))
    }
    if (saved?.panel) {
      const size = saved?.size ? clampPanelSize(saved.size.w, saved.size.h) : getDefaultPanelSize()
      setPanelPos(clampBox(saved.panel.x, saved.panel.y, size.w, size.h))
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setPanelPos((prev) => {
      const size = panelSizeRef.current
      if (prev) return clampBox(prev.x, prev.y, size.w, size.h)
      return computePanelPosition(fabPosRef.current, size)
    })
  }, [open])

  useEffect(() => {
    const onResize = () => {
      setFabPos((prev) => clampBox(prev.x, prev.y, FAB_SIZE, FAB_SIZE))
      setPanelSize((prev) => clampPanelSize(prev.w, prev.h))
      setPanelPos((prev) => {
        if (!prev) return prev
        const size = clampPanelSize(panelSizeRef.current.w, panelSizeRef.current.h)
        return clampBox(prev.x, prev.y, size.w, size.h)
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const persistPositions = useCallback(() => {
    savePositions(fabPosRef.current, panelPosRef.current, panelSizeRef.current)
  }, [])

  const beginDrag = useCallback((type, e) => {
    if (e.button !== 0) return
    const size = panelSizeRef.current
    const panel = panelPosRef.current || computePanelPosition(fabPosRef.current, size)
    dragRef.current = {
      active: type,
      startX: e.clientX,
      startY: e.clientY,
      origFabX: fabPosRef.current.x,
      origFabY: fabPosRef.current.y,
      origPanelX: panel.x,
      origPanelY: panel.y,
      origW: size.w,
      origH: size.h,
      moved: false,
    }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [])

  const beginResize = useCallback((edge, e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const size = panelSizeRef.current
    const panel = panelPosRef.current || computePanelPosition(fabPosRef.current, size)
    dragRef.current = {
      active: `resize-${edge}`,
      startX: e.clientX,
      startY: e.clientY,
      origPanelX: panel.x,
      origPanelY: panel.y,
      origW: size.w,
      origH: size.h,
      moved: true,
    }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current
      if (!d.active) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (d.active.startsWith('resize-')) {
        const edge = d.active.replace('resize-', '')
        const { size, pos } = applyPanelResize(
          edge,
          dx,
          dy,
          d.origPanelX,
          d.origPanelY,
          d.origW,
          d.origH,
        )
        setPanelSize(size)
        setPanelPos(pos)
        return
      }
      if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
      d.moved = true
      if (d.active === 'fab') {
        const nextFab = clampBox(d.origFabX + dx, d.origFabY + dy, FAB_SIZE, FAB_SIZE)
        setFabPos(nextFab)
        if (open) {
          const size = panelSizeRef.current
          setPanelPos(clampBox(d.origPanelX + dx, d.origPanelY + dy, size.w, size.h))
        }
      } else if (d.active === 'panel') {
        const size = panelSizeRef.current
        setPanelPos(clampBox(d.origPanelX + dx, d.origPanelY + dy, size.w, size.h))
      }
    }

    const endDrag = () => {
      const d = dragRef.current
      if (!d.active) return
      if (d.active === 'fab' && !d.moved) {
        setOpen((o) => !o)
      }
      if (d.moved || d.active.startsWith('resize-')) persistPositions()
      dragRef.current = { active: null, moved: false }
      setDragging(false)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [open, persistPositions])

  const categories = useMemo(() => getCategoriesForUser(hasRole), [hasRole])
  const popularQuestions = useMemo(
    () => getPopularQuestions(hasRole, location.pathname),
    [hasRole, location.pathname],
  )
  const recentQuestions = useMemo(() => getRecentQuestions(), [messages])
  const inputSuggestions = useMemo(
    () => (input.trim().length >= 2 ? autocompleteQuestions(input, 4) : []),
    [input],
  )
  const pageHint = useMemo(() => getPageContextHint(location.pathname), [location.pathname])

  const pushMessage = useCallback((msg) => {
    setMessages((m) => [...m, { id: makeId(), ...msg }])
  }, [])

  const botReply = useCallback(
    (buildMsg) => {
      setTyping(true)
      setTimeout(() => {
        pushMessage(buildMsg())
        setTyping(false)
      }, BOT_DELAY_MS)
    },
    [pushMessage],
  )

  const showCategoryMenu = useCallback(
    (introText) => {
      botReply(() => ({
        role: 'bot',
        text: introText,
        menu: { type: 'categories' },
      }))
    },
    [botReply],
  )

  const showQuestionMenu = useCallback(
    (categoryId) => {
      const cat = findCategory(categoryId)
      if (!cat) return
      botReply(() => ({
        role: 'bot',
        text: `**${cat.label}** — pick a question:`,
        menu: { type: 'questions', categoryId },
      }))
    },
    [botReply],
  )

  const showAnswer = useCallback(
    (question) => {
      if (!question) return
      recordRecentQuestion(question.id)
      setNoMatchCount(0)
      botReply(() => ({
        role: 'bot',
        questionTitle: question.question,
        answerBody: question.answer,
        text: `**${question.question}**\n\n${question.answer}`,
        menu: { type: 'after-answer', questionId: question.id },
        questionId: question.id,
        actions: question.actions || [],
        feedback: null,
      }))
    },
    [botReply],
  )

  const showSuggestions = useCallback(
    (text, introText) => {
      const suggestions = suggestQuestions(text, 3)
      botReply(() => ({
        role: 'bot',
        text: introText,
        menu: {
          type: suggestions.length ? 'suggestions' : 'categories',
          suggestions: suggestions.map((q) => q.id),
        },
      }))
    },
    [botReply],
  )

  const initWelcome = useCallback(() => {
    const welcome = getRoleWelcome(hasRole)
    const text = pageHint ? `${pageHint.hint}\n\n${welcome}` : welcome
    pushMessage({
      role: 'bot',
      text,
      menu: { type: 'categories' },
    })
  }, [hasRole, pageHint, pushMessage])

  const resetChat = useCallback(() => {
    setMessages([])
    setInput('')
    setNoMatchCount(0)
    clearChatSession()
    setTimeout(initWelcome, 0)
  }, [initWelcome])

  const openQuestion = useCallback(
    (questionId, { asUserMessage = true } = {}) => {
      const q = findQuestion(questionId)
      if (!q) return
      if (asUserMessage) pushMessage({ role: 'user', text: q.question })
      showAnswer(q)
    },
    [pushMessage, showAnswer],
  )

  useEffect(() => {
    if (!open || hydratedRef.current) return
    hydratedRef.current = true
    const saved = loadChatSession()
    if (saved?.length) {
      setMessages(saved)
    } else {
      initWelcome()
    }
  }, [open, initWelcome])

  useEffect(() => {
    if (messages.length) saveChatSession(messages)
  }, [messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, typing, inputSuggestions])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const onOpen = (e) => {
      const { questionId, categoryId, open: shouldOpen = true } = e.detail || {}
      if (shouldOpen) setOpen(true)
      if (questionId) {
        openQuestion(questionId)
      } else if (categoryId) {
        const cat = findCategory(categoryId)
        if (cat) {
          pushMessage({ role: 'user', text: cat.label })
          showQuestionMenu(categoryId)
        }
      }
    }
    window.addEventListener(ASKME_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(ASKME_OPEN_EVENT, onOpen)
  }, [openQuestion, pushMessage, showQuestionMenu])

  const navigateTo = (path) => {
    navigate(path)
    setOpen(false)
  }

  const setMessageFeedback = (msgId, feedback) => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, feedback } : m)))
  }

  const handleUserText = (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    pushMessage({ role: 'user', text: trimmed })

    if (GREETING_PATTERN.test(trimmed)) {
      showCategoryMenu(GREETING_REPLY)
      return
    }

    const matched = matchQuestion(trimmed)
    if (matched) {
      showAnswer(matched)
      return
    }

    const nextCount = noMatchCount + 1
    setNoMatchCount(nextCount)
    if (nextCount >= 2) {
      botReply(() => ({
        role: 'bot',
        text: `${NO_MATCH_TEXT}\n\n${ESCALATION_TEXT}`,
        menu: { type: 'categories' },
      }))
      setNoMatchCount(0)
      return
    }

    showSuggestions(trimmed, NO_MATCH_TEXT)
  }

  const send = (textOverride) => {
    const text = (textOverride ?? input).trim()
    if (!text || typing) return
    setInput('')
    handleUserText(text)
  }

  const onMenuAction = (action) => {
    if (action.type === 'category') {
      pushMessage({ role: 'user', text: action.label })
      showQuestionMenu(action.categoryId)
      return
    }
    if (action.type === 'question') {
      openQuestion(action.questionId)
      return
    }
    if (action.type === 'all-topics') {
      pushMessage({ role: 'user', text: 'Browse all topics' })
      showCategoryMenu('Here are all help topics:')
      return
    }
    if (action.type === 'another') {
      pushMessage({ role: 'user', text: 'Another question' })
      showCategoryMenu('What else would you like to know?')
      return
    }
    if (action.type === 'context') {
      if (action.questionId) {
        onMenuAction({ type: 'question', questionId: action.questionId })
      } else if (action.categoryId) {
        const cat = findCategory(action.categoryId)
        if (cat) onMenuAction({ type: 'category', categoryId: cat.id, label: cat.label })
      }
    }
  }

  const onFeedback = (msgId, questionId, helpful) => {
    recordAnswerFeedback(questionId, helpful)
    setMessageFeedback(msgId, helpful ? 'up' : 'down')
  }

  const renderGoThereActions = (msg) => {
    if (!msg.actions?.length) return null
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
        {msg.actions.map((act) => (
          <button
            key={act.path}
            type="button"
            onClick={() => navigateTo(act.path)}
            style={actionChipStyle(T, true)}
          >
            <ExternalLink size={12} />
            {act.label}
          </button>
        ))}
      </div>
    )
  }

  const renderFeedback = (msg) => {
    if (!msg.questionId) return null
    return (
      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: '10px', color: T.textMuted, marginBottom: '6px' }}>Was this helpful?</div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            disabled={msg.feedback != null}
            onClick={() => onFeedback(msg.id, msg.questionId, true)}
            style={feedbackBtnStyle(T, msg.feedback === 'up')}
            aria-label="Helpful"
          >
            <ThumbsUp size={13} />
          </button>
          <button
            type="button"
            disabled={msg.feedback != null}
            onClick={() => onFeedback(msg.id, msg.questionId, false)}
            style={feedbackBtnStyle(T, msg.feedback === 'down')}
            aria-label="Not helpful"
          >
            <ThumbsDown size={13} />
          </button>
          {msg.feedback && (
            <span style={{ fontSize: '10px', color: T.textMuted }}>Thanks for your feedback</span>
          )}
        </div>
      </div>
    )
  }

  const renderRelated = (questionId) => {
    const related = getRelatedQuestions(questionId, 3)
    if (!related.length) return null
    return (
      <div style={{ marginTop: '10px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: T.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>
          Related
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {related.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => onMenuAction({ type: 'question', questionId: q.id })}
              style={chipStyle(T, true)}
            >
              {q.question}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderMenu = (menu) => {
    if (!menu) return null

    if (menu.type === 'categories') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {categories.map((cat) => (
            <ChipButton
              key={cat.id}
              T={T}
              compact={false}
              onClick={() => onMenuAction({ type: 'category', categoryId: cat.id, label: cat.label })}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CategoryIcon categoryId={cat.id} />
                {cat.label}
              </span>
              <ChevronRight size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
            </ChipButton>
          ))}
        </div>
      )
    }

    if (menu.type === 'suggestions') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>
            Did you mean
          </div>
          {(menu.suggestions || []).map((qId) => {
            const q = findQuestion(qId)
            if (!q) return null
            return (
              <ChipButton
                key={q.id}
                T={T}
                compact
                onClick={() => onMenuAction({ type: 'question', questionId: q.id })}
              >
                {q.question}
              </ChipButton>
            )
          })}
          <ChipButton T={T} compact={false} onClick={() => onMenuAction({ type: 'all-topics' })}>
            Browse all topics
          </ChipButton>
        </div>
      )
    }

    if (menu.type === 'questions') {
      const cat = findCategory(menu.categoryId)
      if (!cat) return null
      const questions = getQuestionsForUser(menu.categoryId, hasRole)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
          {questions.map((q) => (
            <ChipButton
              key={q.id}
              T={T}
              compact
              onClick={() => onMenuAction({ type: 'question', questionId: q.id })}
            >
              {q.question}
            </ChipButton>
          ))}
          <ChipButton
            T={T}
            compact={false}
            onClick={() => onMenuAction({ type: 'all-topics' })}
            style={{ fontSize: '11px', color: T.textMuted }}
          >
            ← All topics
          </ChipButton>
        </div>
      )
    }

    if (menu.type === 'context') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          <ChipButton
            T={T}
            compact={false}
            onClick={() =>
              onMenuAction({
                type: 'context',
                questionId: menu.questionId,
                categoryId: menu.categoryId,
              })
            }
          >
            <HelpCircle size={13} />
            Show me how
          </ChipButton>
          <ChipButton T={T} compact={false} onClick={() => onMenuAction({ type: 'all-topics' })}>
            All topics
          </ChipButton>
        </div>
      )
    }

    if (menu.type === 'after-answer') {
      return (
        <>
          {renderRelated(menu.questionId)}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            <ChipButton T={T} compact={false} onClick={() => onMenuAction({ type: 'another' })}>
              Another question
            </ChipButton>
            <ChipButton T={T} compact={false} onClick={() => onMenuAction({ type: 'all-topics' })}>
              Browse topics
            </ChipButton>
          </div>
        </>
      )
    }

    return null
  }

  const hasUserMessages = messages.some((m) => m.role === 'user')
  const showQuickPicks = !hasUserMessages && (recentQuestions.length > 0 || popularQuestions.length > 0)

  const renderQuickPicks = () => {
    if (!showQuickPicks) return null
    const sections = [
      { key: 'recent', label: 'Recently viewed', icon: <Clock size={11} />, items: recentQuestions, accent: false },
      { key: 'popular', label: 'Popular for you', icon: null, items: popularQuestions, accent: true },
    ].filter((s) => s.items.length > 0)

    return (
      <div
        style={{
          marginBottom: '4px',
          padding: '16px',
          borderRadius: '14px',
          border: `1px solid ${T.border}`,
          background: T.card,
          boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
        }}
      >
        {sections.map((section, idx) => (
          <div key={section.key} style={{ marginTop: idx > 0 ? '12px' : 0 }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: T.textMuted,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {section.icon}
              {section.label}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '2px',
                scrollbarWidth: 'thin',
              }}
            >
              {section.items.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  disabled={typing}
                  onClick={() => {
                    pushMessage({ role: 'user', text: q.question })
                    showAnswer(q)
                  }}
                  style={{
                    flexShrink: 0,
                    maxWidth: '220px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${section.accent ? T.primary : T.border}`,
                    background: section.accent ? T.primaryLight : T.card,
                    color: T.textPrimary,
                    fontSize: '11px',
                    fontWeight: 600,
                    lineHeight: 1.35,
                    cursor: typing ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter,sans-serif',
                    opacity: typing ? 0.6 : 1,
                    textAlign: 'left',
                  }}
                >
                  {q.question.length > 42 ? `${q.question.slice(0, 40)}…` : q.question}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const resolvedPanelPos = panelPos || computePanelPosition(fabPos, panelSize)

  const resizeHandleBase = {
    position: 'absolute',
    zIndex: 12,
    touchAction: 'none',
    userSelect: 'none',
  }

  return (
    <>
      {open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 8998,
            background: T.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.18)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      <button
        type="button"
        onPointerDown={(e) => beginDrag('fab', e)}
        aria-label="Help Assistant"
        title="Drag to move · Click to open"
        style={{
          position: 'fixed',
          left: `${fabPos.x}px`,
          top: `${fabPos.y}px`,
          zIndex: 9000,
          width: `${FAB_SIZE}px`,
          height: `${FAB_SIZE}px`,
          borderRadius: '50%',
          border: 'none',
          background: `linear-gradient(135deg, ${T.primary}, #1E40AF)`,
          color: '#fff',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          boxShadow: '0 8px 24px rgba(29,78,216,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Help Assistant"
          style={{
            position: 'fixed',
            left: `${resolvedPanelPos.x}px`,
            top: `${resolvedPanelPos.y}px`,
            zIndex: 9000,
            width: `${panelSize.w}px`,
            height: `${panelSize.h}px`,
            background: T.card,
            borderRadius: '18px',
            border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.08)' : T.border}`,
            boxShadow: T.isDark
              ? '0 28px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)'
              : '0 28px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Inter,sans-serif',
          }}
        >
          <div
            onPointerDown={(e) => {
              if (e.target.closest('button')) return
              beginDrag('panel', e)
            }}
            style={{
              flexShrink: 0,
              padding: '16px 18px',
              borderBottom: `1px solid ${T.border}`,
              background: T.isDark
                ? `linear-gradient(135deg, rgba(29,78,216,0.22), ${T.card})`
                : `linear-gradient(135deg, ${T.primaryLight}, ${T.card})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${T.primary}, #1E40AF)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 6px 16px rgba(29,78,216,0.35)',
                }}
              >
                <HelpCircle size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '15px', color: T.textPrimary, letterSpacing: '-0.02em' }}>
                  Help Assistant
                </div>
                <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '3px' }}>
                  Drag to move · Pull any edge to resize
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={resetChat}
                onPointerDown={(e) => e.stopPropagation()}
                title="Start over"
                aria-label="Start over"
                style={{
                  border: `1px solid ${T.border}`,
                  background: T.card,
                  borderRadius: '10px',
                  padding: '7px 9px',
                  cursor: 'pointer',
                  color: T.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                onPointerDown={(e) => e.stopPropagation()}
                title="Close"
                aria-label="Close Help Assistant"
                style={{
                  border: `1px solid ${T.border}`,
                  background: T.card,
                  borderRadius: '10px',
                  padding: '7px 9px',
                  cursor: 'pointer',
                  color: T.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: T.isDark
                ? `linear-gradient(180deg, ${T.card} 0%, ${T.surfaceMuted} 100%)`
                : `linear-gradient(180deg, #fff 0%, ${T.surfaceMuted} 100%)`,
            }}
          >
            {renderQuickPicks()}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  display: 'flex',
                  gap: '8px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                {msg.role === 'bot' && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: `linear-gradient(135deg, ${T.primaryLight}, ${T.card})`,
                      border: `1px solid ${T.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                      color: T.primary,
                      boxShadow: '0 2px 8px rgba(29,78,216,0.12)',
                    }}
                  >
                    <HelpCircle size={15} />
                  </div>
                )}
                <div
                  style={{
                    padding: '13px 15px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    background: msg.role === 'user'
                      ? `linear-gradient(135deg, ${T.primary}, #1E40AF)`
                      : T.card,
                    color: msg.role === 'user' ? '#fff' : T.textPrimary,
                    border: msg.role === 'user' ? 'none' : `1px solid ${T.border}`,
                    boxShadow: msg.role === 'user'
                      ? '0 4px 14px rgba(29,78,216,0.28)'
                      : '0 2px 10px rgba(15,23,42,0.06)',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {msg.role === 'user' ? msg.text : <BotAnswerContent msg={msg} T={T} />}
                  {msg.role === 'bot' && renderGoThereActions(msg)}
                  {msg.role === 'bot' && renderMenu(msg.menu)}
                  {msg.role === 'bot' && renderFeedback(msg)}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: T.primaryLight,
                    border: `1px solid ${T.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: T.primary,
                  }}
                >
                  <Loader2 size={14} style={{ animation: 'askme-spin 1s linear infinite' }} />
                </div>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: T.surfaceMuted,
                    border: `1px solid ${T.border}`,
                    fontSize: '12px',
                    color: T.textMuted,
                  }}
                >
                  …
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div
            style={{
              flexShrink: 0,
              padding: '16px',
              borderTop: `1px solid ${T.border}`,
              background: T.card,
              position: 'relative',
            }}
          >
            {inputSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  right: '12px',
                  bottom: '100%',
                  marginBottom: '4px',
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  zIndex: 2,
                }}
              >
                {inputSuggestions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => send(q.question)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      border: 'none',
                      borderBottom: `1px solid ${T.borderSubtle || T.border}`,
                      background: T.card,
                      color: T.textPrimary,
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'Inter,sans-serif',
                    }}
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            )}
            <div style={{ fontSize: '11px', color: T.textMuted, marginBottom: '10px', lineHeight: 1.4 }}>
              Ask anything about claims, policies, or your workflow
            </div>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                padding: '6px',
                borderRadius: '14px',
                border: `1px solid ${T.border}`,
                background: T.surfaceMuted,
                boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.04)',
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="e.g. How do I open a claim?"
                disabled={typing}
                style={fieldInputStyle(T, {
                  flex: 1,
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  outline: 'none',
                  border: 'none',
                  background: T.card,
                  opacity: typing ? 0.7 : 1,
                  boxShadow: 'none',
                })}
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={typing}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${T.primary}, #1E40AF)`,
                  color: '#fff',
                  cursor: typing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: typing ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(29,78,216,0.35)',
                  flexShrink: 0,
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Resize handles — all edges and corners */}
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize height from top"
            onPointerDown={(e) => beginResize('n', e)}
            style={{ ...resizeHandleBase, left: 12, right: 12, top: 0, height: 10, cursor: 'ns-resize' }}
          />
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize height from bottom"
            onPointerDown={(e) => beginResize('s', e)}
            style={{ ...resizeHandleBase, left: 12, right: 12, bottom: 0, height: 10, cursor: 'ns-resize' }}
          />
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize width from left"
            onPointerDown={(e) => beginResize('w', e)}
            style={{ ...resizeHandleBase, top: 56, left: 0, width: 10, bottom: 12, cursor: 'ew-resize' }}
          />
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize width from right"
            onPointerDown={(e) => beginResize('e', e)}
            style={{ ...resizeHandleBase, top: 56, right: 0, width: 10, bottom: 12, cursor: 'ew-resize' }}
          />
          <div
            role="separator"
            aria-label="Resize top-left corner"
            onPointerDown={(e) => beginResize('nw', e)}
            style={{ ...resizeHandleBase, top: 0, left: 0, width: 14, height: 14, cursor: 'nwse-resize' }}
          />
          <div
            role="separator"
            aria-label="Resize top-right corner"
            onPointerDown={(e) => beginResize('ne', e)}
            style={{ ...resizeHandleBase, top: 0, right: 0, width: 14, height: 14, cursor: 'nesw-resize' }}
          />
          <div
            role="separator"
            aria-label="Resize bottom-left corner"
            onPointerDown={(e) => beginResize('sw', e)}
            style={{ ...resizeHandleBase, bottom: 0, left: 0, width: 14, height: 14, cursor: 'nesw-resize' }}
          />
          <div
            role="separator"
            aria-label="Resize bottom-right corner"
            onPointerDown={(e) => beginResize('se', e)}
            title="Drag to resize"
            style={{ ...resizeHandleBase, right: 0, bottom: 0, width: 14, height: 14, cursor: 'nwse-resize' }}
          />
        </div>
      )}

      <style>{`@keyframes askme-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

function ChipButton({ T, compact, onClick, children, style = {} }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...chipStyle(T, compact),
        background: hover ? T.hoverBg || T.primaryLight : T.card,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function chipStyle(T, compact) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    width: '100%',
    textAlign: 'left',
    padding: compact ? '11px 13px' : '12px 14px',
    borderRadius: '12px',
    border: `1px solid ${T.border}`,
    background: T.card,
    color: T.textPrimary,
    fontSize: compact ? '12px' : '13px',
    fontWeight: compact ? 500 : 600,
    lineHeight: 1.45,
    cursor: 'pointer',
    fontFamily: 'Inter,sans-serif',
    transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
    boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
  }
}

function actionChipStyle(T, primary) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 11px',
    borderRadius: '8px',
    border: `1px solid ${primary ? T.primary : T.border}`,
    background: primary ? T.primaryLight : T.card,
    color: primary ? T.primary : T.textPrimary,
    fontSize: '11.5px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Inter,sans-serif',
  }
}

function feedbackBtnStyle(T, active) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: `1px solid ${active ? T.primary : T.border}`,
    background: active ? T.primaryLight : T.card,
    color: active ? T.primary : T.textMuted,
    cursor: active ? 'default' : 'pointer',
  }
}
