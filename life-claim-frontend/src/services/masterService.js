import causeEventService from './causeEventService'
import trapScoreService from './trapScoreService'
import assessmentQuestionsService from './assessmentQuestionsService'
import systemDecisionAndReasonService from './systemDecisionAndReasonService'
import statesService from './statesService'
import countriesService from './countriesService'
import wrapper from '../util/ApiWrapper'
import {
  buildSystemDecisionPayload,
  normalizeSystemDecisionResponse,
  deriveLocalSystemDecision,
} from '../util/buildSystemDecision'
import { REGISTRATION_ASSESSMENT_QUESTIONS } from '../config/registrationCatalog'

export const getStates = () => statesService.getAllStates()

export const getCountries = () => countriesService.getAllCountries()

export const getCauseEvents = () => causeEventService.causeEvent()

export const getAssessmentQuestions = async () => REGISTRATION_ASSESSMENT_QUESTIONS

export const getSystemDecision = async (policyData, policy = null) => {
  const payload = buildSystemDecisionPayload(policyData, policy)
  try {
    const raw = await systemDecisionAndReasonService(payload)
    return normalizeSystemDecisionResponse(raw, policyData, policy)
  } catch {
    return deriveLocalSystemDecision(policyData, policy)
  }
}

export const getTrapScore = async (params) => trapScoreService(params)

export const getRoles = async () => {
  const response = await wrapper.fetchWithToken('/role/getroles')
  const payload = await response.json().catch(() => null)
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.roles)) return payload.roles
  return []
}
