/** @deprecated Prefer useTheme().tokens or usePageTokens() */
export { UI_T, PAGE_TOKENS, usePageTokens } from './pageTokens'

export const cardShell = (T) => ({
  background: T.card,
  borderRadius: '12px',
  border: `1px solid ${T.border}`,
  boxShadow: T.cardShadow,
})
