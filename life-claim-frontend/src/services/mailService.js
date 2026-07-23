import wrapper from '../util/ApiWrapper'

const parseJson = async (res) => {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed (${res.status})`)
  }
  return res.json().catch(() => null)
}

export const getMails = async (page = 1, desc = true) => {
  const params = new URLSearchParams({ page: String(page), desc: desc ? 'true' : 'false' })
  const res = await wrapper.fetchWithToken(`/mail?${params}`)
  const data = await parseJson(res)
  return Array.isArray(data) ? data : []
}

export const getMailsCount = async () => {
  const res = await wrapper.fetchWithToken('/mail/count')
  return parseJson(res)
}

export const getMailById = async (id) => {
  const res = await wrapper.fetchWithToken(`/mail/${id}`)
  return parseJson(res)
}

export const getAttachments = async (mailId) => {
  const res = await wrapper.fetchWithToken(`/attachment/${mailId}`)
  const data = await parseJson(res)
  return Array.isArray(data) ? data : []
}

export const patchAttachments = async (mailId, body) => {
  const res = await wrapper.fetchWithToken(`/attachment/${mailId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

export default { getMails, getMailsCount, getMailById, getAttachments, patchAttachments }
