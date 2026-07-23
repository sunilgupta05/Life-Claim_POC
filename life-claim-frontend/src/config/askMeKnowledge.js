/**
 * Guided help knowledge base for Ask Me — no AI backend.
 */

import { COMPANY } from './companyBrand'

export const GREETING_PATTERN = /^(hi|hello|hey|hiya|good\s*(morning|afternoon|evening)|namaste|kaise|howdy|sup|what'?s\s*up)[\s!.,?]*$/i

export const ESCALATION_TEXT =
  `Still stuck? Contact **${COMPANY.email}** or **${COMPANY.phone}**, or reach out to your Super User.`

/** Popular question IDs per primary role (shown as quick chips). */
export const POPULAR_BY_ROLE = {
  'Pre Assessor': ['pr-search', 'pr-register', 'doc-upload'],
  Assessor: ['cw-open', 'tp-mytask', 'add-pool'],
  Verifier: ['tp-mytask', 'sd-assessor-verifier', 'add-decision'],
  superuser: ['tp-assign', 'gs-roles', 'gs-dashboard'],
  default: ['gs-navigate', 'cw-open', 'ac-login'],
}

export const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    label: 'Getting started',
    questions: [
      {
        id: 'gs-roles',
        question: 'What are the different user roles?',
        keywords: ['role', 'roles', 'assessor', 'verifier', 'pre assessor', 'superuser', 'permission'],
        answer:
          'The platform supports several roles:\n\n• **Pre Assessor** — Policy Search and new claim registration.\n• **Assessor** — Works claims from pools, assessment, and Advance Intelligence cases.\n• **Verifier** — Reviews and approves assessor decisions.\n• **Super User** — Claim assignment, workload, audit log, and oversight.\n\nYour sidebar menu shows only the screens your role can access.',
        actions: [{ label: 'Open Dashboard', path: '/dashboard' }],
      },
      {
        id: 'gs-navigate',
        question: 'How do I navigate the application?',
        keywords: ['navigate', 'navigation', 'sidebar', 'menu', 'where', 'find page'],
        answer:
          'Use the **left sidebar** for main screens. The **breadcrumb bar** at the top shows where you are and lets you jump back.\n\nCommon paths:\n• Dashboard — overview and quick actions\n• Policy Search → Register Claim — new intimation\n• Claim Search — open an existing claim workspace\n• My Tasks — claims assigned to you\n• Advance Intelligence — ADD case workflow (Assessor / Verifier)',
        actions: [{ label: 'Go to Dashboard', path: '/dashboard' }],
      },
      {
        id: 'gs-dashboard',
        question: 'What does the Dashboard show?',
        keywords: ['dashboard', 'home', 'overview', 'metrics'],
        answer:
          'The **Dashboard** gives a snapshot of claim activity — counts by status, recent claims, and quick links to search or work items.\n\nUse it to spot pending work and open claims directly. Assessors and Verifiers also see pool-related shortcuts from here.',
        actions: [{ label: 'Open Dashboard', path: '/dashboard' }],
      },
      {
        id: 'gs-whats-new',
        question: 'What\'s new in the platform?',
        keywords: ['what\'s new', 'whats new', 'new features', 'recent updates', 'changelog'],
        answer:
          'Recent improvements include:\n\n• **Guided Help assistant** — topic-based Q&A without AI.\n• **Secure case URLs** — ADD cases open at `/add-case` without the case ID in the browser address bar.\n• **SCN notice PDF** — branded Dark Horse Digital Show Cause Notice with 15-day reply window.\n• **Claim summary PDF** — matching branded format for claim workspace exports.\n• **Assessment Pool** — back navigation and non-exclusion double-click to open cases.',
        actions: [{ label: 'Open Dashboard', path: '/dashboard' }],
      },
    ],
  },
  {
    id: 'policy-registration',
    label: 'Policy & registration',
    roles: ['Pre Assessor'],
    questions: [
      {
        id: 'pr-search',
        question: 'How do I search for a policy?',
        keywords: ['policy search', 'find policy', 'policy number', 'search policy'],
        answer:
          'Go to **Policy Search** from the sidebar.\n\nEnter the policy number (or other search criteria shown on screen) and run the search. Matching policies appear in the grid — select one to start **Register Claim** and capture intimation details.',
        actions: [{ label: 'Open Policy Search', path: '/policy-search' }],
      },
      {
        id: 'pr-register',
        question: 'How do I register a new claim?',
        keywords: ['register', 'registration', 'new claim', 'intimation', 'create claim'],
        answer:
          '1. Open **Policy Search** and find the policy.\n2. Click to start registration — you enter the **Registration** wizard.\n3. Complete tabs in order: **Demographics → Requirements → Assessment → Decision**.\n4. Save each section before moving on.\n\nPre Assessors own this flow until the claim is handed to the assessor pool.',
        actions: [{ label: 'Open Policy Search', path: '/policy-search' }],
      },
      {
        id: 'pr-tabs',
        question: 'What are the registration wizard tabs?',
        keywords: ['registration tabs', 'wizard tabs', 'demographics tab'],
        answer:
          'The registration wizard has four tabs:\n\n• **Demographics** — Life assured, claimant, payee, intimation, and cause details.\n• **Requirements** — Documents and requirements checklist.\n• **Assessment** — Assessor questions and findings.\n• **Decision** — Summary and routing to the claim workspace.\n\nComplete and save each tab; mandatory fields are marked on screen.',
        actions: [{ label: 'Open Policy Search', path: '/policy-search' }],
      },
    ],
  },
  {
    id: 'claim-workspace',
    label: 'Claim workspace',
    questions: [
      {
        id: 'cw-open',
        question: 'How do I open a claim to work on it?',
        keywords: ['open claim', 'claim search', 'work claim', 'claim workspace', 'view claim'],
        answer:
          'Use **Claim Search**, **Dashboard**, or **My Tasks**:\n\n1. Search or pick a claim from the list.\n2. Click **View** (read-only) or **Work** to open the claim workspace.\n3. The workspace opens on a secure screen — the claim number is not shown in the browser URL.\n\nTabs: Demographics, Requirements, Assessment, Decision & Summary.',
        actions: [
          { label: 'Open Claim Search', path: '/claim-search' },
          { label: 'My Tasks', path: '/my-task' },
        ],
      },
      {
        id: 'cw-tabs',
        question: 'What can I do in each workspace tab?',
        keywords: ['workspace tabs', 'assessment tab', 'requirements tab', 'decision tab'],
        answer:
          '**Demographics** — Review or update life assured, claimant, and event details.\n\n**Requirements** — Track documents received and outstanding items.\n\n**Assessment** — Answer assessment questions, fraud checks, and calculations.\n\n**Decision & Summary** — Assessor recommendation, verifier decision, and case summary PDF download.',
        actions: [{ label: 'Open Claim Search', path: '/claim-search' }],
      },
      {
        id: 'cw-submit',
        question: 'How do I submit or save my work?',
        keywords: ['submit', 'save', 'save claim', 'final submit'],
        answer:
          'Each tab has its own **Save** action. Use **Submit** on the Decision tab when the claim is ready for the next workflow step.\n\nThe system validates mandatory fields before submit. If submit is blocked, check the toast message and the Requirements tab for missing documents.',
      },
      {
        id: 'cw-pdf',
        question: 'How do I download the claim summary PDF?',
        keywords: ['pdf', 'download', 'summary', 'case summary', 'report'],
        answer:
          'In the claim workspace, open the **case summary panel** at the top and click **PDF**.\n\nA branded **Dark Horse Digital** report is generated with claim overview, demographics, and status — ready to save or print.',
        actions: [{ label: 'Open Claim Search', path: '/claim-search' }],
      },
      {
        id: 'cw-submit-blocked',
        question: 'Why is Submit disabled or blocked?',
        keywords: ['submit disabled', 'submit blocked', 'cannot submit', 'save failed', 'validation', 'mandatory'],
        answer:
          'Submit is blocked when mandatory data is missing or the claim is not in an editable stage.\n\nCheck:\n\n• **Requirements** tab — outstanding mandatory documents.\n• **Assessment** tab — unanswered required questions.\n• **Demographics** — missing life assured or intimation fields.\n• **Role / status** — you may be in read-only browse mode; open from **My Tasks** to work the claim.\n\nRead the toast message on failed submit — it usually names the tab to fix.',
        actions: [{ label: 'Open My Tasks', path: '/my-task' }],
      },
      {
        id: 'cw-fraud',
        question: 'What are fraud rules and transaction details?',
        keywords: ['fraud', 'fraud rule', 'transaction', 'transaction details', 'suspicious'],
        answer:
          'In the claim workspace, use **Quick Access** to open:\n\n• **Fraud Rule Manager** — view or manage fraud-check rules applied to the claim.\n• **Transaction Details** — policy transaction history from Life Asia for verification.\n\nThese support assessor investigation; they do not replace the formal Decision tab recommendation.',
        actions: [{ label: 'Open Claim Search', path: '/claim-search' }],
      },
    ],
  },
  {
    id: 'tasks-pools',
    label: 'Tasks & pools',
    roles: ['Assessor', 'Verifier'],
    questions: [
      {
        id: 'tp-mytask',
        question: 'What is My Tasks?',
        keywords: ['my task', 'my tasks', 'assigned', 'assigned to me'],
        answer:
          '**My Tasks** lists claims **assigned to you** as Assessor or Verifier.\n\nOpen a row to work the claim in the workspace. Use filters and sorting on the grid to prioritise by status or aging.',
        actions: [{ label: 'Open My Tasks', path: '/my-task' }],
      },
      {
        id: 'tp-pool',
        question: 'What is Pool Selection?',
        keywords: ['pool', 'pool selection', 'pick pool', 'assessor pool'],
        answer:
          '**Pool Selection** lets Assessors and Verifiers choose a **work pool** (e.g. by product, region, or queue).\n\nAfter selecting a pool, you see claims available in that pool and can assign or open them for processing.',
        actions: [{ label: 'Open Pool Selection', path: '/pool-selection' }],
      },
      {
        id: 'tp-assign',
        question: 'How are claims assigned to users?',
        keywords: ['assign', 'assignment', 'allocate', 'superuser assign'],
        roles: ['superuser', 'Super User'],
        answer:
          '**Super Users** use **Claim Assignment** to distribute claims across assessors and verifiers.\n\nAssessors can also receive claims via pool selection or direct assignment from admin workflows. Check **My Tasks** for your current load.',
        actions: [{ label: 'Claim Assignment', path: '/superuser/claim-search' }],
      },
    ],
  },
  {
    id: 'advance-intelligence',
    label: 'Advance Intelligence (ADD)',
    roles: ['Assessor', 'Verifier'],
    questions: [
      {
        id: 'add-overview',
        question: 'What is Advance Intelligence?',
        keywords: ['advance intelligence', 'add', 'caps', 'add screen'],
        answer:
          '**Advance Intelligence** is the ADD / CAPS workflow for exclusion and underwriting-style cases.\n\nAvailable to **Assessors** and **Verifiers** via **Advance Intelligence** in the sidebar. Tabs include Case Search, Assessment Pool, Case Assignment, Approver Pool, and Data Entry Upload.',
        actions: [{ label: 'Open Advance Intelligence', path: '/add-screen' }],
      },
      {
        id: 'add-pool',
        question: 'How does the Assessment Pool work?',
        keywords: ['assessment pool', 'exclusion pool', 'non exclusion', 'pool tab'],
        answer:
          'The **Assessment Pool** has two sub-tabs:\n\n• **Exclusion (Y)** — Bulk actions: move to non-exclusion, close as exclusion, or refer.\n• **Non-exclusion (N)** — Double-click a row to open the case workspace.\n\nUse search filters (policy, KRN, case status) to narrow the list.',
        actions: [{ label: 'Open Assessment Pool', path: '/add-screen?tab=assess-pool' }],
      },
      {
        id: 'add-case',
        question: 'How do I open and work an ADD case?',
        keywords: ['add case', 'case detail', 'open case', 'work case', 'case workspace'],
        answer:
          'From **Assessment Pool** (non-exclusion tab), **double-click** a row to open the case.\n\nThe case workspace shows policy details, findings, and the **Decisions** tab. The case ID is kept out of the browser URL for security — same pattern as the claim workspace.',
        actions: [{ label: 'Open Assessment Pool', path: '/add-screen?tab=assess-pool' }],
      },
      {
        id: 'add-scn',
        question: 'What is SCN and how do I issue it?',
        keywords: ['scn', 'show cause', 'notice', 'scn pdf', 'reply window'],
        answer:
          '**SCN (Show Cause Notice)** is issued when a final assessor decision requires document submission from the claimant.\n\nOn **Save final decision**, SCN fields are set automatically (sent date, aging). Use **Download SCN notice (PDF)** for a branded notice listing required documents and the **15-day reply window**.',
        actions: [{ label: 'Open Assessment Pool', path: '/add-screen?tab=assess-pool' }],
      },
      {
        id: 'add-decision',
        question: 'How do ADD findings and decisions work?',
        keywords: ['findings', 'exclusion', 'final decision', 'negative', 'suspicious', 'decision panel'],
        answer:
          'Record **findings** per row (finding, remarks, evidence). The system derives a **final decision** from rules (e.g. Negative, Suspicious, or rule-based outcomes).\n\nSave findings first, then save the final decision. Verifiers use the **Approver Pool** to review cases awaiting approval.',
        actions: [{ label: 'Open Advance Intelligence', path: '/add-screen' }],
      },
      {
        id: 'add-excel',
        question: 'How does Excel case assignment work?',
        keywords: ['excel', 'excel assignment', 'bulk assign', 'upload excel', 'spreadsheet'],
        answer:
          'On **Advance Intelligence → Case Assignment**, open the **Excel Assignment** sub-tab.\n\nUpload a spreadsheet in the required format to assign multiple cases to users in one action. After upload, verify assignments in the case search grid or ask your Super User if rows fail validation.',
        actions: [{ label: 'Open Advance Intelligence', path: '/add-screen' }],
      },
      {
        id: 'add-approver',
        question: 'How does the Approver Pool work?',
        keywords: ['approver', 'approver pool', 'approval', 'awaiting approval', 'verify add'],
        answer:
          'The **Approver Pool** lists ADD cases awaiting **verifier / approver** review.\n\nOpen a case from the pool to review assessor findings and final decision. Approve or send back per your organisation\'s CAPS workflow. Cases appear here after the assessor saves a final decision that requires approval.',
        actions: [{ label: 'Open Advance Intelligence', path: '/add-screen' }],
      },
      {
        id: 'add-upload',
        question: 'How do I upload ADD data entry files?',
        keywords: ['data entry', 'uploader', 'upload add', 'life asia', 'enrichment', 'bulk upload'],
        answer:
          'Use **Advance Intelligence → Data Entry Uploader** to upload source files for ADD cases.\n\nAfter upload, cases are enriched from Life Asia and appear in the **Assessment Pool** once processing completes. If the pool is empty, wait for enrichment or check with your administrator.',
        actions: [{ label: 'Open Advance Intelligence', path: '/add-screen' }],
      },
      {
        id: 'add-scn-sddr',
        question: 'What is the difference between SCN and SDDR?',
        keywords: ['sddr', 'scn vs sddr', 'reply received', 'scn received', 'scn decision'],
        answer:
          '**SCN (Show Cause Notice)** — sent to the claimant when documents are required; tracks sent date, aging, and reply window.\n\n**SDDR** — tracks **reply received** after SCN: received date, decision on the submission, and follow-up status.\n\nOn final assessor save, SCN fields auto-populate. Update SDDR fields when the claimant responds within the 15-day window.',
        actions: [{ label: 'Open Assessment Pool', path: '/add-screen?tab=assess-pool' }],
      },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    questions: [
      {
        id: 'doc-upload',
        question: 'How do I upload documents?',
        keywords: ['upload', 'document', 'attachment', 'file'],
        answer:
          'In the **claim workspace**, open the **document panel** (quick access or side slider).\n\nSupported formats: PDF, images, Word, Excel, CSV, ZIP (max 10 MB per file). Uploaded files attach to the claim and appear in Requirements tracking.',
        actions: [{ label: 'Open Claim Search', path: '/claim-search' }],
      },
      {
        id: 'doc-requirements',
        question: 'How do I track outstanding requirements?',
        keywords: ['requirements', 'outstanding', 'pending documents', 'checklist'],
        answer:
          'Open the **Requirements** tab in the claim workspace. Each requirement shows received / pending status.\n\nUpdate status as documents arrive. Submit may be blocked until mandatory requirements are satisfied.',
        actions: [{ label: 'Open Claim Search', path: '/claim-search' }],
      },
    ],
  },
  {
    id: 'status-decisions',
    label: 'Status & decisions',
    questions: [
      {
        id: 'sd-status',
        question: 'What do claim statuses mean?',
        keywords: ['status', 'pending', 'approved', 'rejected', 'in progress'],
        answer:
          'Common workflow statuses:\n\n• **Pending / In Progress** — Claim is being worked.\n• **Approved** — Decision favourable; payout path may follow.\n• **Rejected / Repudiated** — Claim declined with reason on Decision tab.\n\nStatus appears on Dashboard, Claim Search, and the workspace header.',
      },
      {
        id: 'sd-assessor-verifier',
        question: 'What is the difference between Assessor and Verifier?',
        keywords: ['assessor vs verifier', 'accessor', 'verification', 'approve decision'],
        answer:
          '**Assessor** — Investigates the claim, completes assessment, and records a recommendation (amount, reason).\n\n**Verifier** — Independent review; confirms or overrides the assessor decision before final payout or rejection.\n\nField edit rights differ by role and claim stage — read-only fields are shown in grey.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account & access',
    questions: [
      {
        id: 'ac-login',
        question: 'I cannot log in or my session expired',
        keywords: ['login', 'log in', 'session', 'expired', '403', 'unauthorized', 'password'],
        answer:
          'If login fails or you are redirected to the login page:\n\n1. Clear browser cache and try again.\n2. Confirm your **username and password** with your administrator.\n3. Session timeout is normal after inactivity — log in again.\n\nIf the dashboard is empty after login, your role may have no assigned menus — contact your Super User.',
      },
      {
        id: 'ac-profile',
        question: 'How do I view or update my profile?',
        keywords: ['profile', 'my profile', 'account', 'settings'],
        answer:
          'Open **My Profile** from the sidebar or user menu.\n\nYou can view your account details; password changes depend on your organisation\'s identity provider (Keycloak) policy.',
        actions: [{ label: 'Open My Profile', path: '/profile' }],
      },
    ],
  },
]

/** Context hints when chat opens on a specific route. */
export const PAGE_HELP_HINTS = [
  {
    test: (p) => p.startsWith('/add-screen'),
    hint: 'You\'re on **Advance Intelligence**. Common questions: Assessment Pool, SCN notices, or case decisions.',
    categoryId: 'advance-intelligence',
    questionId: 'add-pool',
  },
  {
    test: (p) => p === '/add-case',
    hint: 'You\'re in an **ADD case workspace**. Need help with findings, final decision, or SCN PDF?',
    questionId: 'add-scn',
  },
  {
    test: (p) => p.startsWith('/registration-fetch'),
    hint: 'You\'re in the **claim workspace**. Ask about tabs, save/submit, documents, or summary PDF.',
    questionId: 'cw-tabs',
  },
  {
    test: (p) => p.startsWith('/registration'),
    hint: 'You\'re registering a **new claim**. Ask about wizard tabs or required fields.',
    questionId: 'pr-tabs',
  },
  {
    test: (p) => p.startsWith('/claim-search'),
    hint: 'You\'re on **Claim Search** — I can explain how to open and work a claim.',
    questionId: 'cw-open',
  },
  {
    test: (p) => p.startsWith('/policy-search'),
    hint: 'You\'re on **Policy Search** — I can walk you through finding a policy and starting registration.',
    questionId: 'pr-search',
  },
  {
    test: (p) => p.startsWith('/my-task'),
    hint: 'You\'re on **My Tasks** — see how assigned claims and the workspace fit together.',
    questionId: 'tp-mytask',
  },
  {
    test: (p) => p.startsWith('/pool-selection'),
    hint: 'You\'re on **Pool Selection** — learn how pools and assignment work.',
    questionId: 'tp-pool',
  },
]

/** Lucide icon names for categories (mapped in AskMeChat). */
export const CATEGORY_ICON_IDS = {
  'getting-started': 'compass',
  'policy-registration': 'file-search',
  'claim-workspace': 'briefcase',
  'tasks-pools': 'layers',
  'advance-intelligence': 'scan-search',
  documents: 'file-text',
  'status-decisions': 'git-branch',
  account: 'user-circle',
}

const SESSION_KEY = 'askMeChatSession'
const FEEDBACK_KEY = 'askMeFeedback'
const RECENT_KEY = 'askMeRecent'

export function getPageContextHint(pathname) {
  return PAGE_HELP_HINTS.find((h) => h.test(pathname)) || null
}

export function getRoleWelcome(hasRole) {
  if (hasRole('Pre Assessor')) {
    return 'Welcome, **Pre Assessor**! I can help with policy search, new claim registration, and documents.'
  }
  if (hasRole('Assessor')) {
    return 'Welcome, **Assessor**! I can help with claims, pools, Advance Intelligence, and SCN.'
  }
  if (hasRole('Verifier')) {
    return 'Welcome, **Verifier**! I can help with review workflows, ADD approver pool, and decisions.'
  }
  if (hasRole('superuser') || hasRole('Super User')) {
    return 'Welcome, **Super User**! I can help with assignment, workload, and platform navigation.'
  }
  return 'Welcome to **Life Claims Help**. Pick a topic below or type your question.'
}

export function getCategoriesForUser(hasRole) {
  return HELP_CATEGORIES.filter((cat) => {
    if (!cat.roles?.length) return true
    return cat.roles.some((r) => hasRole(r))
  })
}

export function getPopularQuestionIds(hasRole) {
  const order = ['Pre Assessor', 'Assessor', 'Verifier', 'superuser', 'Super User']
  for (const role of order) {
    if (hasRole(role) && POPULAR_BY_ROLE[role]) return POPULAR_BY_ROLE[role]
  }
  return POPULAR_BY_ROLE.default
}

export function getPopularQuestions(hasRole, pathname = '') {
  const pageHint = pathname ? getPageContextHint(pathname) : null
  const baseIds = getPopularQuestionIds(hasRole)
  const ids = [...baseIds]
  if (pageHint?.questionId && !ids.includes(pageHint.questionId)) {
    ids.unshift(pageHint.questionId)
  }
  return ids.map((id) => findQuestion(id)).filter(Boolean).slice(0, 4)
}

export function recordRecentQuestion(questionId) {
  if (!questionId) return
  try {
    const prev = JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]')
    const next = [questionId, ...prev.filter((id) => id !== questionId)].slice(0, 3)
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function getRecentQuestions() {
  try {
    const ids = JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]')
    return ids.map((id) => findQuestion(id)).filter(Boolean)
  } catch {
    return []
  }
}

/** Strip markdown bold for clipboard. */
export function plainHelpText(text) {
  return String(text || '').replace(/\*\*([^*]+)\*\*/g, '$1')
}

export function getAllQuestions() {
  return HELP_CATEGORIES.flatMap((cat) =>
    cat.questions.map((q) => ({ ...q, categoryId: cat.id, categoryLabel: cat.label })),
  )
}

export function findCategory(categoryId) {
  return HELP_CATEGORIES.find((c) => c.id === categoryId) || null
}

export function findQuestion(questionId) {
  return getAllQuestions().find((q) => q.id === questionId) || null
}

export function getRelatedQuestions(questionId, limit = 3) {
  const current = findQuestion(questionId)
  if (!current) return []
  const cat = findCategory(current.categoryId)
  if (!cat) return []
  return cat.questions.filter((q) => q.id !== questionId).slice(0, limit)
}

function tokenOverlapScore(normalized, q) {
  const words = normalized.split(/\s+/).filter((w) => w.length > 2)
  if (!words.length) return 0
  const hay = `${q.question} ${(q.keywords || []).join(' ')}`.toLowerCase()
  let score = 0
  for (const w of words) {
    if (hay.includes(w)) score += 8
    else if (words.length > 1) {
      const stem = w.slice(0, Math.min(4, w.length))
      if (stem.length >= 3 && hay.includes(stem)) score += 4
    }
  }
  return score
}

function scoreOne(normalized, q) {
  let score = 0
  const qText = q.question.toLowerCase()
  if (normalized === qText) score += 100
  if (qText.includes(normalized) || normalized.includes(qText)) score += 40
  for (const kw of q.keywords || []) {
    const k = kw.toLowerCase()
    if (normalized.includes(k) || k.includes(normalized)) score += 25
    const words = normalized.split(/\s+/)
    if (words.some((w) => w.length > 2 && k.includes(w))) score += 10
  }
  score += tokenOverlapScore(normalized, q)
  return score
}

export function matchQuestion(text) {
  const normalized = String(text || '').trim().toLowerCase()
  if (!normalized || GREETING_PATTERN.test(normalized)) return null

  let best = null
  let bestScore = 0
  for (const q of getAllQuestions()) {
    const score = scoreOne(normalized, q)
    if (score > bestScore) {
      bestScore = score
      best = q
    }
  }
  return bestScore >= 25 ? best : null
}

export function suggestQuestions(text, limit = 3) {
  const normalized = String(text || '').trim().toLowerCase()
  if (!normalized || normalized.length < 2 || GREETING_PATTERN.test(normalized)) return []

  return getAllQuestions()
    .map((q) => ({ q, score: scoreOne(normalized, q) }))
    .filter(({ score }) => score > 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ q }) => q)
}

export function autocompleteQuestions(text, limit = 4) {
  return suggestQuestions(text, limit)
}

export function getQuestionsForUser(categoryId, hasRole) {
  const cat = findCategory(categoryId)
  if (!cat) return []
  return cat.questions.filter((q) => {
    if (!q.roles?.length) return true
    return q.roles.some((r) => hasRole(r))
  })
}

export function loadChatSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveChatSession(messages) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages))
  } catch {
    // ignore
  }
}

export function clearChatSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

export function recordAnswerFeedback(questionId, helpful) {
  try {
    const prev = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]')
    prev.push({ questionId, helpful, at: Date.now() })
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(prev.slice(-300)))
  } catch {
    // ignore
  }
}
