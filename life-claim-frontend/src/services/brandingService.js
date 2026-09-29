// src/services/brandingService.js
//
// Frontend client for the branding admin API (roadmap 2.1). GET is public;
// PUT / logo upload are superuser-only (enforced server-side).

import axios from 'axios'
import api from './api'
import { API_URL } from '../util/config'

const branding = {
  getOrgProfile: () => api.get('/org-profile').then((r) => r.data),
  updateOrgProfile: (fields) => api.put('/org-profile', fields).then((r) => r.data),
  uploadLogo: (file) => {
    const form = new FormData()
    form.append('logo', file)
    // Use a BARE axios call (not the shared `api` client). The shared client sets
    // a default `Content-Type: application/json`, which axios keeps even for a
    // FormData body — so the server sees json, and multer ignores the file
    // ("no logo file received"). A bare axios.post with FormData auto-sets the
    // correct `multipart/form-data; boundary=...`. withCredentials sends cookies.
    return axios
      .post(`${API_URL || ''}/api/org-profile/logo`, form, { withCredentials: true })
      .then((r) => r.data)
  },
}

export default branding
