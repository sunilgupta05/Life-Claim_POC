import { API_URL } from './config'

const baseUrl = `${API_URL || ''}/api`

const wrapper = {
  fetchWithToken: async (url, options = {}) => {
    const response = await fetch(`${baseUrl}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.headers || {}),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Error fetching data: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response
  },
}

export default wrapper
