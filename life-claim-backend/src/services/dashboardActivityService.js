const dashboardActivityDao = require('../dataAccess/dashboardActivityDao');

const APP_TZ_OFFSET = process.env.APP_TIMEZONE_OFFSET || '+05:30';

const ACTIVITY_WINDOW_SECONDS = Number(process.env.ACTIVITY_WINDOW_HOURS || 24) * 60 * 60; // default last 24 hours

/** Parse MySQL DATETIME (naive IST) without UTC skew from the Node host timezone. */
function parseDbDateTime(value) {
  if (value == null || value === '') return null;

  const pad = (n) => String(n).padStart(2, '0');

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    // mysql2 Date — use local wall-clock parts as the DB stored instant (IST business TZ).
    const wall = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
    return new Date(`${wall}${APP_TZ_OFFSET}`);
  }

  const s = String(value).trim();
  if (!s) return null;

  const mysql = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?/);
  if (mysql) {
    return new Date(`${mysql[1]}T${mysql[2]}${APP_TZ_OFFSET}`);
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapRowToActivity(row, diffSeconds) {
  let action = 'Updated claim';
  let type = 'modification';

  const claimId = row.claimId || '';
  const actor = row.user || 'System';
  const status = (row.status || '').toLowerCase();
  const roles = parseRolesSafe(row.roles);

  const isAssessor = roles.includes('Assessor');
  const isVerifier = roles.includes('Verifier');
  const roleLabel = isAssessor ? 'Assessor' : (isVerifier ? 'Verifier' : (actor !== 'System' ? actor : 'User'));

  if (status.includes('assessor rejected') || status.includes('rejected')) {
    action = `${roleLabel} rejected claim ${claimId}`;
    type = 'rejection';
  } else if (status.includes('pending verifier allocation')) {
    action = `Assessor approved claim ${claimId}`;
    type = 'approval';
  } else if (status.includes('payout completed')) {
    action = `Verifier approved claim ${claimId}`;
    type = 'approval';
  } else if (status.includes('pending assessor allocation')) {
    action = `Registered new claim ${claimId}`;
    type = 'registration';
  } else if (status.includes('pending assessor action') || status.includes('pending verifier action')) {
    action = `${roleLabel} working on claim ${claimId}`;
    type = 'modification';
  } else if (status.includes('modified')) {
    action = `${roleLabel} modified claim ${claimId}`;
    type = 'modification';
  } else if (claimId) {
    action = `${roleLabel} updated claim ${claimId}`;
    type = 'modification';
  }

  const statusLabel = row.status ? String(row.status) : '';
  const rowTime = parseDbDateTime(row.time) || new Date();

  return {
    user: actor,
    action,
    claimId,
    detail: claimId
      ? `${claimId} · ${actor}${statusLabel ? ` · ${statusLabel}` : ''}`
      : actor,
    time: getTimeSinceDetailed(diffSeconds),
    type,
    rawTime: rowTime.toISOString(),
    status: statusLabel,
  };
}

const parseRolesSafe = (rawRoles) => {
  if (Array.isArray(rawRoles)) return rawRoles;
  if (!rawRoles) return [];
  if (typeof rawRoles === 'string') {
    const value = rawRoles.trim();
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
      return [];
    } catch {
      // Fallback for legacy DB formats like "Assessor,Verifier" or single "Assessor"
      return value.includes(',') ? value.split(',').map((r) => r.trim()).filter(Boolean) : [value];
    }
  }
  return [];
};

const getRecentActivitiesService = async () => {
  try {
    const rows = await dashboardActivityDao.getRecentActivities();
    console.log('Service >> DAO returned rows:', rows.length);
    if (rows.length > 0) {
      console.log('Service >> First row example:', JSON.stringify(rows[0], null, 2));
    }

    // Process rows to create readable activity pulse messages.
    // We:
    // 1) Compute "age" in seconds in Node (Date is always in UTC internally, so no TZ skew).
    // 2) Keep only activities from the last 24h.
    // 3) De‑duplicate by (user, claimId, status) keeping only the most recent entry.
    const now = new Date();
    const dedupeMap = new Map();

    for (const row of rows) {
      const rowTime = parseDbDateTime(row.time);
      if (!rowTime) continue;

      const diffSeconds = Math.floor(Math.abs(now.getTime() - rowTime.getTime()) / 1000);
      if (diffSeconds > ACTIVITY_WINDOW_SECONDS) continue;

      const key = `${row.user || ""}|${row.claimId || ""}|${row.status || ""}`;
      if (dedupeMap.has(key)) continue;

      dedupeMap.set(key, { row, diffSeconds });
    }

    return Array.from(dedupeMap.values()).map(({ row, diffSeconds }) =>
      mapRowToActivity(row, diffSeconds)
    );
  } catch (error) {
    console.error('Error in dashboard activity service:', error);
    throw error;
  }
};

// Helper function to format time as "Xm ago", "Xh ago" using seconds from DB
function getTimeSinceDetailed(seconds) {
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

module.exports = {
  getRecentActivitiesService
};
