const db = require("../config/dbConfig");
const logger = require("../config/logConfig");
const StatusHistory = require("../models/StatusHistory");
const claimsService = require("./claimsService");
const TRACKED_USERS = ["sujal", "simran", "kishor"];
const TRACKED_USERS_WITH_ALIAS = ["sujal", "simran", "kishor", "kishore"];
const SESSION_TTL_MINUTES = Number(process.env.AUDIT_SESSION_TTL_MINUTES || 5);

/**
 * Admin-level summary for the platform overview dashboard.
 * Aggregates counts from claims_poc.claims.
 */
exports.getSummary = async () => {
  // NOTE: SLA / aging thresholds are currently hard-coded:
  // - "Breached" = open & pending for more than 3 days
  // - "At risk" = open & pending for 1–3 days
  // If business rules change, update the INTERVALs below.
  const summaryQuery = `
    SELECT
      COUNT(*) AS totalClaims,
      /* Mutually exclusive buckets — pending = all non-approved, non-rejected */
      SUM(
        CASE
          WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected', 'assessor rejected', 'verifier rejected')
          THEN 1 ELSE 0
        END
      ) AS rejectedClaims,
      SUM(
        CASE
          WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved', 'payout completed')
          THEN 1 ELSE 0
        END
      ) AS approvedClaims,
      SUM(
        CASE
          WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) NOT IN (
            'rejected', 'payout rejected', 'assessor rejected', 'verifier rejected',
            'approved', 'payout completed'
          )
          THEN 1 ELSE 0
        END
      ) AS pendingClaims,
      /* Weekly registrations (last 7 days including today) */
      SUM(
        CASE
          WHEN DATE(CREATED_AT) >= CURDATE() - INTERVAL 6 DAY
          THEN 1 ELSE 0
        END
      ) AS registeredThisWeek,
      /* Today snapshot */
      SUM(
        CASE
          WHEN DATE(COALESCE(CREATED_AT)) = CURDATE()
          THEN 1 ELSE 0
        END
      ) AS createdToday,
      SUM(
        CASE
          WHEN DATE(COALESCE(MODIFIED_AT, CREATED_AT)) = CURDATE()
               AND LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved', 'rejected', 'payout rejected', 'payout completed')
          THEN 1 ELSE 0
        END
      ) AS closedToday,
      /* Pipeline by stage */
      SUM(
        CASE
          WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
          THEN 1 ELSE 0
        END
      ) AS registeredStage,
      SUM(
        CASE
          WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('pending assessor action', 'pending assessor allocation')
          THEN 1 ELSE 0
        END
      ) AS pendingAssessorStage,
      SUM(
        CASE
          WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('pending verifier action', 'pending verifier allocation')
          THEN 1 ELSE 0
        END
      ) AS pendingVerifierStage,
      SUM(
        CASE
          WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved', 'payout completed')
          THEN 1 ELSE 0
        END
      ) AS approvedStage,
      SUM(
        CASE
          WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected')
          THEN 1 ELSE 0
        END
      ) AS rejectedStage,
      /* SLA / aging – pending claims older than 3 days */
      SUM(
        CASE
          WHEN (
                 LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
               )
               AND DATE(COALESCE(MODIFIED_AT, CREATED_AT)) < CURDATE() - INTERVAL 3 DAY
          THEN 1 ELSE 0
        END
      ) AS slaBreached,
      SUM(
        CASE
          WHEN (
                 LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
               )
               AND DATE(COALESCE(MODIFIED_AT, CREATED_AT)) BETWEEN CURDATE() - INTERVAL 3 DAY AND CURDATE()
          THEN 1 ELSE 0
        END
      ) AS slaAtRisk,
      /* Workload distribution by role for open/pending claims */
      SUM(
        CASE
          WHEN (
                 LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
               )
               AND role = 'Pre Assessor'
          THEN 1 ELSE 0
        END
      ) AS preAssessorOpen,
      SUM(
        CASE
          WHEN (
                 LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
               )
               AND role = 'Assessor'
          THEN 1 ELSE 0
        END
      ) AS assessorOpen,
      SUM(
        CASE
          WHEN (
                 LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
               )
               AND role = 'Verifier'
          THEN 1 ELSE 0
        END
      ) AS verifierOpen,
      /* Quality metrics – last 30 days window */
      SUM(
        CASE
          WHEN DATE(COALESCE(MODIFIED_AT, CREATED_AT)) >= CURDATE() - INTERVAL 29 DAY
          THEN 1 ELSE 0
        END
      ) AS last30Total,
      SUM(
        CASE
          WHEN DATE(COALESCE(MODIFIED_AT, CREATED_AT)) >= CURDATE() - INTERVAL 29 DAY
               AND LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected')
          THEN 1 ELSE 0
        END
      ) AS last30Rejected
    FROM claims_poc.claims;
  `;

  const [rows] = await db.execute(summaryQuery);
  const row = rows[0] || {};

  const last30Total = Number(row.last30Total || 0);
  const last30Rejected = Number(row.last30Rejected || 0);

  const summary = {
    totalClaims: Number(row.totalClaims || 0),
    pending: Number(row.pendingClaims || 0),
    approved: Number(row.approvedClaims || 0),
    rejected: Number(row.rejectedClaims || 0),
    registeredThisWeek: Number(row.registeredThisWeek || 0),
    today: {
      registered: Number(row.createdToday || 0),
      closed: Number(row.closedToday || 0),
    },
    byStage: {
      registered: Number(row.registeredStage || 0),
      pendingAssessor: Number(row.pendingAssessorStage || 0),
      pendingVerifier: Number(row.pendingVerifierStage || 0),
      approved: Number(row.approvedStage || 0),
      rejected: Number(row.rejectedStage || 0),
    },
    sla: {
      breached: Number(row.slaBreached || 0),
      atRisk: Number(row.slaAtRisk || 0),
    },
    workload: {
      preAssessorOpen: Number(row.preAssessorOpen || 0),
      assessorOpen: Number(row.assessorOpen || 0),
      verifierOpen: Number(row.verifierOpen || 0),
    },
    quality: {
      last30Total,
      last30Rejected,
      rejectionRate30d: last30Total > 0 ? last30Rejected / last30Total : 0,
    },
  };

  // Embed the four drill-down lists so each SLA/Workload card shows its list from same API
  const views = ["slaBreached", "slaAtRisk", "openByRole", "rejected30d"];
  const listKeys = ["slaBreachedClaims", "slaAtRiskClaims", "openByRoleClaims", "rejected30dClaims"];
  for (let i = 0; i < views.length; i++) {
    try {
      const list = await exports.getRecentClaims(500, views[i]);
      summary[listKeys[i]] = Array.isArray(list) ? list : [];
    } catch (e) {
      logger.error(`Admin getSummary ${listKeys[i]}: ${e.message}`);
      summary[listKeys[i]] = [];
    }
  }

  try {
    const [trendRows] = await db.execute(`
      SELECT
        DATE_FORMAT(CREATED_AT, '%b') AS month,
        MONTH(CREATED_AT) AS monthNum,
        COUNT(*) AS registered,
        SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected', 'assessor rejected', 'verifier rejected') THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved', 'payout completed') THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) NOT IN (
          'rejected', 'payout rejected', 'assessor rejected', 'verifier rejected',
          'approved', 'payout completed'
        ) THEN 1 ELSE 0 END) AS pending
      FROM claims_poc.claims
      WHERE CREATED_AT >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY YEAR(CREATED_AT), MONTH(CREATED_AT)
      ORDER BY YEAR(CREATED_AT), MONTH(CREATED_AT)
    `);
    summary.charts = summary.charts || {};
    summary.charts.monthlyTrend = (trendRows || []).map((r) => ({
      name: r.month,
      registered: Number(r.registered || 0),
      approved: Number(r.approved || 0),
      rejected: Number(r.rejected || 0),
      pending: Number(r.pending || 0),
    }));
  } catch (e) {
    logger.error(`Admin getSummary monthlyTrend: ${e.message}`);
    summary.charts = summary.charts || {};
    summary.charts.monthlyTrend = [];
  }

  try {
    const [typeRows] = await db.execute(`
      SELECT
        CASE
          WHEN LOWER(TRIM(COALESCE(CLAIM_TYPE, ''))) IN ('death', 'death claim') THEN 'Death'
          WHEN LOWER(TRIM(COALESCE(CLAIM_TYPE, ''))) IN ('rider', 'rider claim') THEN 'Rider'
          ELSE COALESCE(NULLIF(TRIM(CLAIM_TYPE), ''), 'Other')
        END AS claimType,
        COUNT(*) AS cnt
      FROM claims_poc.claims
      GROUP BY 1
      ORDER BY cnt DESC
    `);
    const typeColors = ['#1D4ED8', '#0891B2', '#7C3AED', '#059669', '#D97706', '#64748B'];
    summary.charts = summary.charts || {};
    summary.charts.claimTypes = (typeRows || []).map((r, i) => ({
      name: r.claimType,
      value: Number(r.cnt || 0),
      color: typeColors[i % typeColors.length],
    }));
  } catch (e) {
    logger.error(`Admin getSummary claimTypes: ${e.message}`);
    summary.charts = summary.charts || {};
    summary.charts.claimTypes = [];
  }

  return summary;
};

/**
 * Recent claims across the platform ordered by most recent activity.
 */
exports.getRecentClaims = async (limit = 20, view) => {
  try {
    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 500) : 20;

    // Base WHERE for different drill-down views; default = recent claims (no extra filter)
    let whereClause = "";
    if (view === "slaBreached") {
      whereClause = `
      WHERE (
        LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
      )
      AND DATE(COALESCE(MODIFIED_AT, CREATED_AT)) < CURDATE() - INTERVAL 3 DAY
    `;
    } else if (view === "slaAtRisk") {
      whereClause = `
      WHERE (
        LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
      )
      AND DATE(COALESCE(MODIFIED_AT, CREATED_AT)) BETWEEN CURDATE() - INTERVAL 3 DAY AND CURDATE()
    `;
    } else if (view === "openByRole") {
      whereClause = `
      WHERE (
        LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
      )
    `;
    } else if (view === "rejected30d") {
      whereClause = `
      WHERE DATE(COALESCE(MODIFIED_AT, CREATED_AT)) >= CURDATE() - INTERVAL 29 DAY
        AND LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected')
    `;
    }

    const query = `
    SELECT
      CLAIM_NUMBER,
      POLICY_ID AS POLICY_NUMBER,
      COALESCE(status, CLAIM_STATUS) AS STATUS,
      role AS ROLE,
      ASSIGNED_TO,
      CREATED_BY,
      DATE_FORMAT(COALESCE(MODIFIED_AT, CREATED_AT), '%Y-%m-%d %H:%i:%s') AS ACTIVITY_DATE
    FROM claims_poc.claims
    ${whereClause}
    ORDER BY COALESCE(MODIFIED_AT, CREATED_AT) DESC
    LIMIT ${safeLimit}
  `;

    const [rows] = await db.query(query);
    const list = (rows || []).map((r) => {
      const row = r || {};
      return {
        claimNumber: row.CLAIM_NUMBER ?? row.claim_number,
        policyNumber: row.POLICY_NUMBER ?? row.policy_number,
        status: row.STATUS ?? row.status,
        role: row.ROLE ?? row.role ?? "",
        assignedTo: row.ASSIGNED_TO ?? row.assigned_to ?? "",
        createdBy: row.CREATED_BY ?? row.created_by,
        date: row.ACTIVITY_DATE ?? row.DATE ?? row.date,
      };
    });
    if (view && list.length === 0) {
      logger.error(`Admin getRecentClaims view=${view} returned 0 rows (check WHERE clause and table claims_poc.claims)`);
    }
    return list;
  } catch (err) {
    logger.error(`Admin getRecentClaims error: ${err.message}`);
    return [];
  }
};

/**
 * Reports summary for a given date window.
 * Used by the Admin Reports page; aggregates from claims_poc.claims.
 */
exports.getReportSummary = async ({ range, from, to }) => {
  let whereClause = "";
  const params = [];

  if (from && to) {
    whereClause = "WHERE DATE(COALESCE(MODIFIED_AT, CREATED_AT)) BETWEEN ? AND ?";
    params.push(from, to);
  } else {
    // Quick ranges based on server date
    switch (range) {
      case "last30":
        whereClause =
          "WHERE DATE(COALESCE(MODIFIED_AT, CREATED_AT)) >= CURDATE() - INTERVAL 29 DAY";
        break;
      case "quarter":
        whereClause =
          "WHERE DATE(COALESCE(MODIFIED_AT, CREATED_AT)) >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)";
        break;
      case "ytd":
        whereClause =
          "WHERE YEAR(DATE(COALESCE(MODIFIED_AT, CREATED_AT))) = YEAR(CURDATE())";
        break;
      case "last7":
      default:
        whereClause =
          "WHERE DATE(COALESCE(MODIFIED_AT, CREATED_AT)) >= CURDATE() - INTERVAL 6 DAY";
        break;
    }
  }

  const query = `
    SELECT
      COUNT(*) AS totalClaims,
      SUM(CASE
            WHEN LOWER(COALESCE(status, '')) IN ('pending', 'in progress')
                 OR status IS NULL
                 OR LOWER(status) IN ('pending assessor action', 'pending verifier action')
            THEN 1 ELSE 0 END
          ) AS pendingClaims,
      SUM(CASE
            WHEN LOWER(COALESCE(status, '')) IN ('approved', 'pending verifier allocation', 'payout completed')
            THEN 1 ELSE 0 END
          ) AS approvedClaims,
      SUM(CASE
            WHEN LOWER(COALESCE(status, '')) IN ('rejected', 'verifier rejected', 'assessor rejected', 'payout rejected')
            THEN 1 ELSE 0 END
          ) AS rejectedClaims
    FROM claims_poc.claims
    ${whereClause};
  `;

  const [rows] = await db.execute(query, params);
  const row = rows[0] || {};

  return {
    range: range || "custom",
    from: from || null,
    to: to || null,
    totalClaims: Number(row.totalClaims || 0),
    pendingClaims: Number(row.pendingClaims || 0),
    approvedClaims: Number(row.approvedClaims || 0),
    rejectedClaims: Number(row.rejectedClaims || 0),
  };
};

/**
 * Audit events for admin audit log page.
 * Backed by USER_LOGIN_AUDIT table (login/logout sessions).
 */
exports.getAuditEvents = async ({ limit = 50, user, from, to }) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 500);
  const safeFrom = typeof from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : null;
  const safeTo = typeof to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : null;
  const safeUser = typeof user === "string" && user.trim() ? user.trim() : null;

  // All column references must use the ula. alias to avoid ambiguity with the joined users table
  // IMPORTANT: do NOT hardcode username allow-lists here; admin audit must show all users present in user_login_audit.
  const whereParts = ["1=1"];
  if (safeUser) whereParts.push(`ula.USERNAME = '${safeUser.replace(/'/g, "''")}'`);
  if (safeFrom) whereParts.push(`DATE(ula.LOGIN_AT) >= '${safeFrom}'`);
  if (safeTo) whereParts.push(`DATE(ula.LOGIN_AT) <= '${safeTo}'`);

  const whereSql = whereParts.join(" AND ");

  const mapAuditRows = (rows, includeLogoutReason) =>
    (rows || []).map((r) => {
      let rolesArr = [];
      try {
        rolesArr = r.USER_ROLES
          ? (typeof r.USER_ROLES === "string" ? JSON.parse(r.USER_ROLES) : r.USER_ROLES)
          : [];
      } catch (_) {
        rolesArr = [];
      }

      const { hasSuperUserRole, isSuperUserUsername } = require("../util/superuserRoles");
      const norm = (r) =>
        String(r || "")
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/-/g, " ")
          .trim();
      const hasRoleNamed = (want) =>
        rolesArr.some((r) => {
          const n = norm(r);
          const w = norm(want);
          if (w === "pre assessor") return n.includes("pre") && n.includes("assessor");
          if (w === "assessor") return n === "assessor" || (n.includes("assessor") && !n.includes("pre"));
          if (w === "verifier") return n === "verifier" || n.includes("verifier");
          if (w === "superuser") return n === "superuser" || n === "super user";
          return n === w;
        });
      let displayRole = "—";
      if (hasSuperUserRole(rolesArr) || isSuperUserUsername(r.USERNAME)) {
        displayRole = "Super User";
      } else if (hasRoleNamed("Pre Assessor")) {
        displayRole = "Pre Assessor";
      } else if (hasRoleNamed("Assessor")) {
        displayRole = "Assessor";
      } else if (hasRoleNamed("Verifier")) {
        displayRole = "Verifier";
      } else if (rolesArr[0]) {
        displayRole = hasSuperUserRole([rolesArr[0]]) ? "Super User" : String(rolesArr[0]);
      }

      const reasonSuffix =
        includeLogoutReason && r.LOGOUT_REASON ? ` — ${r.LOGOUT_REASON}` : "";

      return {
        id: r.ID,
        username: r.USERNAME,
        loginAt: r.LOGIN_AT,
        logoutAt: r.LOGOUT_AT,
        durationMin: Number(r.DURATION_MIN || 0),
        ipAddress: r.IP_ADDRESS || "",
        userAgent: r.USER_AGENT || "",
        userRole: displayRole,
        modifiedBy: r.USERNAME,
        modifiedOn: r.LOGIN_AT,
        status: `Login session (${Number(r.DURATION_MIN || 0)} min)`,
        remarks: `Login at ${r.LOGIN_AT}${
          r.LOGOUT_AT ? `, logout at ${r.LOGOUT_AT}` : ", session still active"
        }${reasonSuffix}`,
      };
    });

  const queryWithReason = `
    SELECT
      ula.ID,
      ula.USERNAME,
      ula.LOGIN_AT,
      ula.LOGOUT_AT,
      ula.LOGOUT_REASON,
      ula.IP_ADDRESS,
      ula.USER_AGENT,
      TIMESTAMPDIFF(MINUTE, ula.LOGIN_AT, COALESCE(ula.LOGOUT_AT, NOW())) AS DURATION_MIN,
      COALESCE(ula.USER_ROLES, u.roles) AS USER_ROLES
    FROM claims_poc.user_login_audit ula
    LEFT JOIN claims_poc.users u ON LOWER(u.username) = LOWER(ula.USERNAME)
    WHERE ${whereSql}
    ORDER BY ula.LOGIN_AT DESC
    LIMIT ${safeLimit}
  `;

  const queryWithoutReason = `
    SELECT
      ula.ID,
      ula.USERNAME,
      ula.LOGIN_AT,
      ula.LOGOUT_AT,
      ula.IP_ADDRESS,
      ula.USER_AGENT,
      TIMESTAMPDIFF(MINUTE, ula.LOGIN_AT, COALESCE(ula.LOGOUT_AT, NOW())) AS DURATION_MIN,
      COALESCE(ula.USER_ROLES, u.roles) AS USER_ROLES
    FROM claims_poc.user_login_audit ula
    LEFT JOIN claims_poc.users u ON LOWER(u.username) = LOWER(ula.USERNAME)
    WHERE ${whereSql}
    ORDER BY ula.LOGIN_AT DESC
    LIMIT ${safeLimit}
  `;

  const isUnknownLogoutReasonColumn = (err) =>
    err && (err.code === "ER_BAD_FIELD_ERROR" || Number(err.errno) === 1054);

  try {
    const [rows] = await db.query(queryWithReason);
    return mapAuditRows(rows, true);
  } catch (err) {
    if (isUnknownLogoutReasonColumn(err)) {
      try {
        const [rows] = await db.query(queryWithoutReason);
        return mapAuditRows(rows, false);
      } catch (err2) {
        logger.error(`Admin getAuditEvents (fallback) error: ${err2.message}`);
        return [];
      }
    }
    logger.error(`Admin getAuditEvents USER_LOGIN_AUDIT error: ${err.message}\nQuery was: ${queryWithReason}`);
    return [];
  }
};

/**
 * Admin assignment of a claim to a specific user for a given role.
 * Only allows assignment when the claim is already in that role's open/pending pool.
 */
exports.assignClaim = async ({ claimNumber, assignee, role, actingUser }) => {
  if (!claimNumber || !assignee || !role) {
    const err = new Error("claimNumber, assignee and role are required");
    err.status = 400;
    throw err;
  }

  const [rows] = await db.query(
    `
      SELECT
        CLAIM_NUMBER,
        POLICY_ID,
        COALESCE(status, CLAIM_STATUS) AS STATUS,
        ROLE,
        ASSIGNED_TO,
        ASSESSMENT_USERNAME,
        APPROVER_USERNAME
      FROM claims_poc.claims
      WHERE CLAIM_NUMBER = ?
    `,
    [claimNumber]
  );

  const claim = rows && rows[0];
  if (!claim) {
    const err = new Error("Claim not found");
    err.status = 404;
    throw err;
  }

  const normalizedStatus = String(claim.STATUS || "").toLowerCase();
  const normPoolRole = (r) => {
    const n = String(r || "").toLowerCase().replace(/_/g, " ").replace(/-/g, " ").trim();
    if (n.includes("pre") && n.includes("assessor")) return "Pre Assessor";
    if (n === "assessor" || (n.includes("assessor") && !n.includes("pre"))) return "Assessor";
    if (n === "verifier" || n.includes("verifier")) return "Verifier";
    return String(r || "").trim();
  };
  const claimRole = normPoolRole(claim.ROLE);
  const targetRole = normPoolRole(role);

  if (claimRole.toLowerCase() !== targetRole.toLowerCase()) {
    const err = new Error("Claim is not currently in the selected role pool");
    err.status = 400;
    throw err;
  }

  // Allow assignment only for appropriate pending statuses
  if (targetRole === "Assessor") {
    if (
      normalizedStatus !== "pending assessor allocation" &&
      normalizedStatus !== "pending assessor action"
    ) {
      const err = new Error("Claim status is not in an Assessor pending stage");
      err.status = 400;
      throw err;
    }
  } else if (targetRole === "Verifier") {
    if (
      normalizedStatus !== "pending verifier allocation" &&
      normalizedStatus !== "pending verifier action"
    ) {
      const err = new Error("Claim status is not in a Verifier pending stage");
      err.status = 400;
      throw err;
    }
  } else if (targetRole === "Pre Assessor") {
    if (!normalizedStatus.startsWith("pending")) {
      const err = new Error("Claim status is not pending for Pre Assessor");
      err.status = 400;
      throw err;
    }
  }

  const wasUnassigned = !String(claim.ASSIGNED_TO || "").trim();
  let nextStatus = String(claim.STATUS || "").trim();

  if (targetRole === "Assessor") {
    if (
      normalizedStatus === "pending assessor allocation" ||
      (wasUnassigned && normalizedStatus.includes("pending assessor"))
    ) {
      nextStatus = "Pending Assessor Action";
    }
  } else if (targetRole === "Verifier") {
    if (
      normalizedStatus === "pending verifier allocation" ||
      (wasUnassigned && normalizedStatus.includes("pending verifier"))
    ) {
      nextStatus = "Pending Verifier Action";
    }
  }

  let updateSql =
    "UPDATE claims_poc.claims SET ASSIGNED_TO = ?, MODIFIED_BY = ?, MODIFIED_AT = NOW()";
  const params = [assignee, actingUser || assignee];

  if (targetRole === "Assessor") {
    updateSql += ", ASSESSMENT_USERNAME = ?";
    params.push(assignee);
  } else if (targetRole === "Verifier") {
    updateSql += ", APPROVER_USERNAME = ?";
    params.push(assignee);
  }

  updateSql += " WHERE CLAIM_NUMBER = ?";
  params.push(claimNumber);

  await db.execute(updateSql, params);

  const priorStatus = String(claim.STATUS || "").trim();
  if (nextStatus && nextStatus !== priorStatus) {
    try {
      await claimsService.changeStatus(
        claimNumber,
        nextStatus,
        assignee,
        targetRole === "Pre Assessor" ? null : targetRole
      );
    } catch (e) {
      logger.error(`assignClaim changeStatus notify error: ${e.message}`);
    }
  }

  try {
    await StatusHistory.create({
      CLAIM_NUMBER: claimNumber,
      POLICY_NUMBER: claim.POLICY_ID || "",
      MODIFIED_BY: actingUser || assignee,
      STATUS: nextStatus || claim.STATUS,
    });
  } catch (e) {
    logger.error(`assignClaim StatusHistory error: ${e.message}`);
  }

  return {
    claimNumber,
    policyNumber: claim.POLICY_ID,
    role: targetRole,
    status: nextStatus || claim.STATUS,
    assignedTo: assignee,
    previousAssignee: claim.ASSIGNED_TO || null,
  };
};

/**
 * Return a claim to the allocation pool — clears assignee and reverts action → allocation status.
 */
exports.unassignClaim = async ({ claimNumber, role, actingUser }) => {
  if (!claimNumber || !role) {
    const err = new Error("claimNumber and role are required");
    err.status = 400;
    throw err;
  }

  const [rows] = await db.query(
    `
      SELECT
        CLAIM_NUMBER,
        POLICY_ID,
        COALESCE(status, CLAIM_STATUS) AS STATUS,
        ROLE,
        ASSIGNED_TO,
        ASSESSMENT_USERNAME,
        APPROVER_USERNAME
      FROM claims_poc.claims
      WHERE CLAIM_NUMBER = ?
    `,
    [claimNumber]
  );

  const claim = rows && rows[0];
  if (!claim) {
    const err = new Error("Claim not found");
    err.status = 404;
    throw err;
  }

  const normalizedStatus = String(claim.STATUS || "").toLowerCase();
  const normPoolRole = (r) => {
    const n = String(r || "").toLowerCase().replace(/_/g, " ").replace(/-/g, " ").trim();
    if (n.includes("pre") && n.includes("assessor")) return "Pre Assessor";
    if (n === "assessor" || (n.includes("assessor") && !n.includes("pre"))) return "Assessor";
    if (n === "verifier" || n.includes("verifier")) return "Verifier";
    return String(r || "").trim();
  };
  const claimRole = normPoolRole(claim.ROLE);
  const targetRole = normPoolRole(role);

  if (claimRole.toLowerCase() !== targetRole.toLowerCase()) {
    const err = new Error("Claim is not currently in the selected role pool");
    err.status = 400;
    throw err;
  }

  const hasAssignee = Boolean(String(claim.ASSIGNED_TO || "").trim());
  if (!hasAssignee) {
    const err = new Error("Claim is not assigned to anyone");
    err.status = 400;
    throw err;
  }

  let nextStatus = String(claim.STATUS || "").trim();
  if (targetRole === "Assessor") {
    if (normalizedStatus !== "pending assessor action") {
      const err = new Error("Only claims in Pending Assessor Action can be returned to the pool");
      err.status = 400;
      throw err;
    }
    nextStatus = "Pending Assessor Allocation";
  } else if (targetRole === "Verifier") {
    if (normalizedStatus !== "pending verifier action") {
      const err = new Error("Only claims in Pending Verifier Action can be returned to the pool");
      err.status = 400;
      throw err;
    }
    nextStatus = "Pending Verifier Allocation";
  } else if (targetRole === "Pre Assessor") {
    if (!normalizedStatus.startsWith("pending")) {
      const err = new Error("Claim status is not pending for Pre Assessor");
      err.status = 400;
      throw err;
    }
  }

  let updateSql =
    "UPDATE claims_poc.claims SET ASSIGNED_TO = NULL, MODIFIED_BY = ?, MODIFIED_AT = NOW()";
  const params = [actingUser || "superuser"];

  if (targetRole === "Assessor") {
    updateSql += ", ASSESSMENT_USERNAME = NULL, status = ?, CLAIM_STATUS = ?";
    params.push(nextStatus, nextStatus);
  } else if (targetRole === "Verifier") {
    updateSql += ", APPROVER_USERNAME = NULL, status = ?, CLAIM_STATUS = ?";
    params.push(nextStatus, nextStatus);
  }

  updateSql += " WHERE CLAIM_NUMBER = ?";
  params.push(claimNumber);

  await db.execute(updateSql, params);

  try {
    await StatusHistory.create({
      CLAIM_NUMBER: claimNumber,
      POLICY_NUMBER: claim.POLICY_ID || "",
      MODIFIED_BY: actingUser || "superuser",
      STATUS: nextStatus,
    });
  } catch (e) {
    logger.error(`unassignClaim StatusHistory error: ${e.message}`);
  }

  return {
    claimNumber,
    policyNumber: claim.POLICY_ID,
    role: targetRole,
    status: nextStatus,
    assignedTo: null,
    previousAssignee: claim.ASSIGNED_TO || null,
  };
};

/**
 * Live status for tracked users shown in Admin > User Management.
 * Uses latest audit session for each tracked user and marks ACTIVE only inside TTL.
 */
exports.getTrackedUserStatuses = async () => {
  // Display LIVE status for *all usernames* that exist in user_login_audit.
  // Uses the latest audit session per username and marks ACTIVE only inside TTL.
  const query = `
    SELECT
      base.USERNAME AS TRACKED_USER,
      last_session.LOGIN_AT,
      last_session.LOGOUT_AT,
      last_session.IP_ADDRESS,
      last_session.USER_AGENT,
      CASE
        WHEN last_session.LOGOUT_AT IS NULL
             AND last_session.LOGIN_AT IS NOT NULL
             AND last_session.LOGIN_AT >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
        THEN 1 ELSE 0
      END AS IS_ACTIVE
    FROM (
      SELECT DISTINCT
        CASE
          WHEN LOWER(USERNAME) = 'kishore' THEN 'kishor'
          ELSE LOWER(USERNAME)
        END AS USERNAME
      FROM claims_poc.user_login_audit
      WHERE USERNAME IS NOT NULL
    ) base
    LEFT JOIN (
      SELECT audit.*
      FROM claims_poc.user_login_audit audit
      INNER JOIN (
        SELECT
          CASE
            WHEN LOWER(USERNAME) = 'kishore' THEN 'kishor'
            ELSE LOWER(USERNAME)
          END AS NORMALIZED_USER,
          MAX(ID) AS MAX_ID
        FROM claims_poc.user_login_audit
        WHERE USERNAME IS NOT NULL
        GROUP BY NORMALIZED_USER
      ) latest ON latest.MAX_ID = audit.ID
    ) last_session
      ON (
        CASE
          WHEN LOWER(last_session.USERNAME) = 'kishore' THEN 'kishor'
          ELSE LOWER(last_session.USERNAME)
        END
      ) = base.USERNAME
    ORDER BY base.USERNAME
  `;

  try {
    const [rows] = await db.execute(query, [SESSION_TTL_MINUTES]);
    return (rows || []).map((row) => ({
      username: row.TRACKED_USER,
      isActive: Number(row.IS_ACTIVE || 0) === 1,
      loginAt: row.LOGIN_AT || null,
      logoutAt: row.LOGOUT_AT || null,
      ipAddress: row.IP_ADDRESS || null,
      userAgent: row.USER_AGENT || null,
    }));
  } catch (error) {
    logger.error(`Admin getTrackedUserStatuses error: ${error.message}`);
    return [];
  }
};

/**
 * Admin action: force logout a tracked user by closing open audit sessions
 * and clearing current_session_id in users table.
 */
exports.forceLogoutTrackedUser = async ({ username }) => {
  if (typeof username !== "string" || !username.trim()) {
    const error = new Error("Username is required");
    error.status = 400;
    throw error;
  }

  const normalized = username.trim().toLowerCase();
  if (!TRACKED_USERS.includes(normalized)) {
    const error = new Error("Only tracked users can be force logged out");
    error.status = 400;
    throw error;
  }

  const variants = normalized === "kishor" ? ["kishor", "kishore"] : [normalized];
  const placeholders = variants.map(() => "?").join(",");

  const closeAuditQuery = `
    UPDATE claims_poc.user_login_audit
    SET LOGOUT_AT = NOW()
    WHERE LOWER(USERNAME) IN (${placeholders})
      AND LOGOUT_AT IS NULL
  `;

  const clearSessionQuery = `
    UPDATE claims_poc.users
    SET current_session_id = NULL
    WHERE LOWER(username) IN (${placeholders})
  `;

  try {
    const [auditResult] = await db.execute(closeAuditQuery, variants);
    const [userResult] = await db.execute(clearSessionQuery, variants);

    return {
      username: normalized,
      closedAuditSessions: Number(auditResult?.affectedRows || 0),
      clearedUserSessions: Number(userResult?.affectedRows || 0),
    };
  } catch (error) {
    logger.error(`Admin forceLogoutTrackedUser error (${normalized}): ${error.message}`);
    throw error;
  }
};