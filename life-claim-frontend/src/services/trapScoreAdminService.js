import wrapper from '../util/ApiWrapper'

export const fetchTrapScoreCities = async () => {
  const res = await wrapper.fetchWithToken('/trap-score/city')
  return res.json().catch(() => [])
}

export const checkTrapScoreNulls = async () => {
  const res = await wrapper.fetchWithToken('/trap-score/null')
  return res.json().catch(() => null)
}
