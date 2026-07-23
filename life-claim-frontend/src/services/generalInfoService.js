import wrapper from '../util/ApiWrapper'

const parse = async (res) => res.json().catch(() => null)

export const fetchGeneralInfo = async (hospitalId) => {
  const res = await wrapper.fetchWithToken(`/app/general-info/${encodeURIComponent(hospitalId)}`)
  return parse(res)
}

export const fetchProcessAutomated = async (hospitalId) => {
  const res = await wrapper.fetchWithToken(`/app/general-info/${encodeURIComponent(hospitalId)}/process-automated`)
  return parse(res)
}

export const fetchMarketing = async (hospitalId) => {
  const res = await wrapper.fetchWithToken(`/app/general-info/${encodeURIComponent(hospitalId)}/marketing`)
  return parse(res)
}

export const updateGeneralInfo = async (hospitalId, genInfoData, valuesArray) => {
  const res = await wrapper.fetchWithToken(`/app/general-info/${encodeURIComponent(hospitalId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ genInfoData, valuesArray }),
  })
  return parse(res)
}

export const updateMarketing = async (hospitalId, body) => {
  const res = await wrapper.fetchWithToken(`/app/general-info/${encodeURIComponent(hospitalId)}/marketing`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parse(res)
}

export const addMarketing = async (event) => {
  const res = await wrapper.fetchWithToken('/app/general-info/marketing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  })
  return parse(res)
}

export const deleteMarketing = async (campaignType) => {
  const res = await wrapper.fetchWithToken(`/app/general-info/marketing/${encodeURIComponent(campaignType)}`, {
    method: 'DELETE',
  })
  return parse(res)
}
