// src/services/formConfigService.js
//
// Frontend client for per-form field overrides (roadmap 2.3). GET is available
// to any authenticated user (the wizard applies overrides); writes are
// superuser-only (enforced server-side).

import api from './api'

const formConfig = {
  getAll: () => api.get('/form-config').then((r) => r.data.forms || {}),
  getForm: (formKey) => api.get(`/form-config/${encodeURIComponent(formKey)}`).then((r) => r.data.fields || {}),
  saveForm: (formKey, fields) => api.put(`/form-config/${encodeURIComponent(formKey)}`, { fields }).then((r) => r.data),
  patchField: (formKey, name, body) => api.patch(`/form-config/${encodeURIComponent(formKey)}/fields/${encodeURIComponent(name)}`, body).then((r) => r.data),
  resetForm: (formKey) => api.delete(`/form-config/${encodeURIComponent(formKey)}`).then((r) => r.data),
}

export default formConfig
