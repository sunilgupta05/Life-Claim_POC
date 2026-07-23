/** Open the floating Help assistant from anywhere in the app. */
export const ASKME_OPEN_EVENT = 'askme:open'

/**
 * @param {{ questionId?: string, categoryId?: string, open?: boolean }} options
 */
export function openHelpAssistant({ questionId, categoryId, open = true } = {}) {
  window.dispatchEvent(
    new CustomEvent(ASKME_OPEN_EVENT, {
      detail: { questionId, categoryId, open },
    }),
  )
}
