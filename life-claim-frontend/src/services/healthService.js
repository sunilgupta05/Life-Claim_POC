// src/services/healthService.js
//
// Frontend client for the integration health endpoint (roadmap 3.2). Superuser
// only (enforced server-side). Powers the live Integration Health dashboard.

import api from './api'

const health = {
  // Per-integration status: resolved endpoint, circuit-breaker state + stats.
  getIntegrations: () => api.get('/health/integrations').then((r) => r.data),
  // Public liveness (no auth) — handy for a quick "backend up?" check.
  liveness: () => api.get('/health').then((r) => r.data),
}

export default health
