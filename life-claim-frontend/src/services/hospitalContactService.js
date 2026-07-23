import wrapper from '../util/ApiWrapper'

const parseJson = async (res) => {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed (${res.status})`)
  }
  return res.json().catch(() => null)
}

export const searchHospitalContacts = async (hospitalId) => {
  const res = await wrapper.fetchWithToken(`/app/searchEmail_fax_contact/${encodeURIComponent(hospitalId)}`)
  const data = await parseJson(res)
  return {
    email: Array.isArray(data?.email) ? data.email : [],
    fax: Array.isArray(data?.fax) ? data.fax : [],
    contact: Array.isArray(data?.contact) ? data.contact : [],
  }
}

export const addHospitalEmail = async (hospitalId, email) => {
  const res = await wrapper.fetchWithToken('/app/add-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospitalId, email }),
  })
  return parseJson(res)
}

export const addHospitalFax = async (hospitalId, fax) => {
  const res = await wrapper.fetchWithToken('/app/add-fax', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospitalId, fax }),
  })
  return parseJson(res)
}

export const addHospitalContact = async (hospitalId, contact) => {
  const res = await wrapper.fetchWithToken('/app/add-contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospitalId, contact }),
  })
  return parseJson(res)
}

export const deleteHospitalEmail = async (hospitalEmail) => {
  const res = await wrapper.fetchWithToken(`/app/delete-email/${encodeURIComponent(hospitalEmail)}`, { method: 'DELETE' })
  return parseJson(res)
}

export const deleteHospitalFax = async (faxNo) => {
  const res = await wrapper.fetchWithToken(`/app/delete-fax/${encodeURIComponent(faxNo)}`, { method: 'DELETE' })
  return parseJson(res)
}

export const deleteHospitalContact = async (hospitalPhone) => {
  const res = await wrapper.fetchWithToken(`/app/delete-contact/${encodeURIComponent(hospitalPhone)}`, { method: 'DELETE' })
  return parseJson(res)
}

export const updateHospitalEmail = async (hospitalId, updatedDetails) => {
  const res = await wrapper.fetchWithToken(`/app/updateEmail/${encodeURIComponent(hospitalId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedDetails),
  })
  return parseJson(res)
}

export const updateHospitalFax = async (hospitalId, updatedDetails) => {
  const res = await wrapper.fetchWithToken(`/app/updateFax/${encodeURIComponent(hospitalId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedDetails),
  })
  return parseJson(res)
}

export const updateHospitalContactRow = async (hospitalId, updatedDetails) => {
  const res = await wrapper.fetchWithToken(`/app/updateContact/${encodeURIComponent(hospitalId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedDetails),
  })
  return parseJson(res)
}

export default {
  searchHospitalContacts,
  addHospitalEmail,
  addHospitalFax,
  addHospitalContact,
  deleteHospitalEmail,
  deleteHospitalFax,
  deleteHospitalContact,
  updateHospitalEmail,
  updateHospitalFax,
  updateHospitalContactRow,
}
