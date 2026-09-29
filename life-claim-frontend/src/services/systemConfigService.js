// src/services/systemConfigService.js
//
// Frontend client for the IT Administrator settings API (roadmap 3.5). A curated
// view over the runtime config service — integration URLs, timeouts, log level.
// Superuser only (enforced server-side). Saves hot-reload immediately.

import api from './api'

const systemConfig = {
  getSettings: () => api.get('/settings').then((r) => r.data),
  updateSetting: (key, value) =>
    api.put(`/settings/${encodeURIComponent(key)}`, { value }).then((r) => r.data),
  resetSetting: (key) =>
    api.delete(`/settings/${encodeURIComponent(key)}`).then((r) => r.data),
}

export default systemConfig
