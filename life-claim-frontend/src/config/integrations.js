/**
 * Client-visible integration hints (Section K).
 * Secrets (DB password, DMS, email, reCAPTCHA secret) live only in backend .env.
 */
import { readEnv } from '../util/env'
import { API_URL, KEYCLOAK_URL } from '../util/config'
import { APP_ENVIRONMENT } from './appEnv'

export const V2_PORTS = {
  frontendDev: 5174,
  backend: 3010,
  keycloak: 8081,
  transactionApi: 3003,
  whatsapp: 3002,
  rabbitAmqp: 5672,
  rabbitMgmt: 15672,
  alfresco: 8080,
}

/** How the browser reaches the API in this build. */
export function getApiAccessMode() {
  if (API_URL) return { mode: 'direct', base: API_URL }
  const proxy = readEnv('PROXY_TARGET', '')
  return {
    mode: 'vite-proxy',
    base: '/api',
    proxyTarget: proxy || '(vite.config default :3010)',
  }
}

export const INTEGRATION_ROWS = [
  {
    id: 'keycloak',
    name: 'Keycloak',
    usedFor: 'Login, realm roles, API bearer protection',
    clientConfig: 'KEYCLOAK_URL (informational); token via POST /api/auth/keycloak/token',
    defaultHost: `http://localhost:${V2_PORTS.keycloak}`,
    failure: 'Cannot sign in; all /api routes reject requests.',
  },
  {
    id: 'mysql',
    name: 'MySQL (claims_poc)',
    usedFor: 'Claims, users, audit, CAPS, UploadedDocuments metadata',
    clientConfig: '— (backend only: DB_HOST, DB_USER, DB_DATABASE)',
    defaultHost: 'localhost',
    failure: 'API errors on every data operation.',
  },
  {
    id: 'txn',
    name: 'Transaction API (Life Asia)',
    usedFor: 'GET /api/policy/policySearch — policy search, registration, CAPS enrichment',
    clientConfig: '— (backend TXN_API_BASE_URL or TXN_PORT)',
    defaultHost: `http://localhost:${V2_PORTS.transactionApi}`,
    failure: '"Policy not found in Life Asia" or registration/CAPS refresh fails.',
  },
  {
    id: 'alfresco',
    name: 'Alfresco DMS',
    usedFor: 'Document upload & preview via backend proxy (not direct from browser)',
    clientConfig: 'Documents use /api/upload and authenticated preview fetch',
    defaultHost: '192.168.60.63:8080 (DOCUMENT_VIEWER_IP)',
    failure: 'Upload/preview fails; claim workspace documents empty.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp gateway',
    usedFor: 'Registration notify (direct); pool/decision texts via Rabbit worker',
    clientConfig: '— (backend WHATSAPP_API_URL)',
    defaultHost: `192.168.60.62:${V2_PORTS.whatsapp}`,
    failure: 'No SMS-style alerts; registration may still save.',
  },
  {
    id: 'rabbit',
    name: 'RabbitMQ + worker',
    usedFor: 'Queued notifications (assign, decisions, payout)',
    clientConfig: '— (backend RABBITMQ_URL; run npm run start:worker)',
    defaultHost: `192.168.60.62:${V2_PORTS.rabbitAmqp}`,
    failure: 'Assignment/decision WhatsApp/email never sent if worker down.',
  },
  {
    id: 'email',
    name: 'Gmail SMTP',
    usedFor: 'Registration / worker outbound email',
    clientConfig: '— (backend EMAIL_ID / EMAIL_PASS)',
    defaultHost: 'smtp.gmail.com',
    failure: 'Email leg of notifications skipped.',
  },
]

export function getClientIntegrationSummary() {
  const api = getApiAccessMode()
  return {
    environment: APP_ENVIRONMENT,
    api,
    keycloakUrl: KEYCLOAK_URL,
    idleMinutes: readEnv('IDLE_TIMEOUT_MINUTES', '5'),
    captchaOptional: readEnv('CAPTCHA_OPTIONAL', 'false'),
    sessionCheckMs: readEnv('SESSION_CHECK_INTERVAL_MS', '90000'),
  }
}
