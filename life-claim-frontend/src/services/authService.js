import { API_URL } from '../util/config';
import { notifyOtherTabsLogout } from '../util/authBroadcast';
import { encryptPasswordForLogin } from '../util/loginCrypto';
import { clearLegacyTokenStorage, profileFromLoginResponse } from '../util/authUser';

const REFRESH_BUFFER_SEC = 90;

const writeLogoutAudit = async (meta = {}) => {
  const logoutReason =
    typeof meta.logoutReason === 'string' && meta.logoutReason.trim()
      ? meta.logoutReason.trim().slice(0, 120)
      : '';
  const body = logoutReason ? JSON.stringify({ logoutReason }) : '{}';
  try {
    await fetch(`${API_URL}/api/auth/logout-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body,
    });
  } catch {
    // Best-effort only.
  }
};

async function sessionCheckRequest() {
  return fetch(`${API_URL}/api/auth/session-check`, {
    method: 'GET',
    credentials: 'include',
  });
}

const authService = {
  login: async (username, password, captchaToken) => {
    clearLegacyTokenStorage();

    let passwordPayload = password;
    let passwordEncrypted = false;
    try {
      passwordPayload = await encryptPasswordForLogin(password);
      passwordEncrypted = true;
    } catch {
      passwordPayload = password;
      passwordEncrypted = false;
    }

    const params = new URLSearchParams();
    params.append('client_id', 'life-claims-frontend');
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', passwordPayload);
    if (passwordEncrypted) params.append('password_encrypted', 'true');
    if (captchaToken) params.append('captchaToken', captchaToken);

    const res = await fetch(`${API_URL}/api/auth/keycloak/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include',
      body: params,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg =
        data.error_description ||
        data.message ||
        data.error ||
        'Login failed';
      const err = new Error(msg);
      err.lockout = Boolean(data.lockout);
      err.remainingMs = Number(data.remainingMs) || 0;
      throw err;
    }

    const data = await res.json();
    const profile = profileFromLoginResponse(data, username);
    if (!profile) {
      throw new Error('Login succeeded but session profile was not returned.');
    }
    sessionStorage.setItem('loggedUser', username);
    return profile;
  },

  refreshAccessToken: async () => {
    const res = await fetch(`${API_URL}/api/auth/keycloak/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: '{}',
    });

    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return Boolean(data?.ok && data?.user);
  },

  verifyServerSession: async () => {
    const res = await sessionCheckRequest();
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, user: data.user };
    }

    const data = await res.json().catch(() => ({}));
    const err = new Error(data.message || 'Session invalid');
    err.concurrentLogout = Boolean(data.concurrentLogout);
    err.status = res.status;
    throw err;
  },

  authenticate: async () => {
    clearLegacyTokenStorage();

    let res = await sessionCheckRequest();

    if (res.status === 401) {
      const refreshed = await authService.refreshAccessToken();
      if (refreshed) {
        res = await sessionCheckRequest();
      }
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.message || 'Session invalid');
      err.concurrentLogout = Boolean(data.concurrentLogout);
      throw err;
    }

    const data = await res.json();
    if (!data?.user) {
      throw new Error('No active session');
    }

    const exp = Number(data.user.exp) || 0;
    const now = Math.floor(Date.now() / 1000);
    if (exp && exp - now < REFRESH_BUFFER_SEC) {
      await authService.refreshAccessToken().catch(() => {});
      const retry = await sessionCheckRequest();
      if (retry.ok) {
        const retryData = await retry.json();
        if (retryData?.user) {
          if (retryData.user.preferred_username) {
            sessionStorage.setItem('loggedUser', retryData.user.preferred_username);
          }
          return retryData.user;
        }
      }
    }

    if (data.user.preferred_username) {
      sessionStorage.setItem('loggedUser', data.user.preferred_username);
    }
    return data.user;
  },

  logout: async (opts = {}) => {
    const broadcastReason = opts.logoutReason || opts.reason || 'session';
    notifyOtherTabsLogout(broadcastReason);
    try {
      await writeLogoutAudit({ logoutReason: opts.logoutReason || opts.reason });
      await fetch(`${API_URL}/api/auth/clear-token-cookie`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Keep logout resilient even if audit endpoint fails.
    }
    clearLegacyTokenStorage();
    sessionStorage.removeItem('loggedUser');
    return { success: true };
  },
};

export default authService;
