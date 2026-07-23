/** Sync logout across browser tabs (VAPT / session hygiene). */
export const AUTH_LOGOUT_CHANNEL = 'life-claims-logout-v1';

export function notifyOtherTabsLogout(reason = 'session') {
  try {
    const bc = new BroadcastChannel(AUTH_LOGOUT_CHANNEL);
    bc.postMessage({ type: 'logout', reason });
    bc.close();
  } catch {
    // BroadcastChannel unsupported — ignore
  }
}
