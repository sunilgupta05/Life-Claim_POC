import axios from 'axios'
import { API_URL } from '../util/config'

const api = axios.create({
  baseURL: `${API_URL || ''}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use(config => {
  config.withCredentials = true
  return config
})

api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
)

export default api
