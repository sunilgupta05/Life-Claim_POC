// Production: leave API_URL empty — same origin (https://host:3010/api).
// Dev with Vite proxy: also empty; vite.config.js proxies /api to backend.
import { readEnv } from './env'

export const API_URL = readEnv('API_URL', '')

export const KEYCLOAK_URL = readEnv('KEYCLOAK_URL', 'http://localhost:8081')
