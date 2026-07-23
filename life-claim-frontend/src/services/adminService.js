import wrapper from "../util/ApiWrapper";

const adminService = {
  /**
   * Get platform-wide summary for admin dashboard.
   * Always uses real API data; on error returns zeroed summary.
   */
  getSummary: async () => {
    try {
      const headers = { "Content-Type": "application/json" };

      const res = await wrapper.fetchWithToken(`/superuser/summary`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.totalClaims === "number") {
          return data;
        }
      }
      // Backend responded but shape is unexpected – fall through to zero summary
    } catch (e) {
      console.error("Admin getSummary error", e);
    }

    // Fallback: zero summary (no static/demo data)
    return {
      totalClaims: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      registeredThisWeek: 0,
      today: { registered: 0, closed: 0 },
      byStage: {
        registered: 0,
        pendingAssessor: 0,
        pendingVerifier: 0,
        approved: 0,
        rejected: 0,
      },
      sla: {
        breached: 0,
        atRisk: 0,
      },
      workload: {
        preAssessorOpen: 0,
        assessorOpen: 0,
        verifierOpen: 0,
      },
      quality: {
        last30Total: 0,
        last30Rejected: 0,
        rejectionRate30d: 0,
      },
      charts: {
        monthlyTrend: [],
        claimTypes: [],
      },
    };
  },

  /**
   * Get recent claims across the platform for admin.
   * Uses demo list when API returns empty. Replace with GET /api/admin/claims/recent?limit=20 when available.
   */
  getRecentClaims: async (options) => {
    const { limit = 20, view } = typeof options === "number" ? { limit: options } : (options || {});
    try {
      const headers = { "Content-Type": "application/json" };

      const params = new URLSearchParams();
      if (limit) params.append("limit", String(limit));
      if (view) params.append("view", view);
      const query = params.toString();
      const url = `/superuser/claims/recent${query ? `?${query}` : ""}`;

      const res = await wrapper.fetchWithToken(url, { headers });
      const data = res.ok ? await res.json().catch(() => null) : null;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.claims)) return data.claims;
      if (data && Array.isArray(data.data)) return data.data;
      if (!res.ok) console.warn("Admin getRecentClaims: response not ok", res.status, url);
      return [];
    } catch (e) {
      console.error("Admin getRecentClaims error", e);
      return [];
    }
  },

  /**
   * Get aggregated report summary for a given date range.
   * Range can be: last7, last30, quarter, ytd; or explicit from/to (YYYY-MM-DD).
   */
  getReportSummary: async ({ range, from, to } = {}) => {
    try {
      const headers = { "Content-Type": "application/json" };

      const params = new URLSearchParams();
      if (range) params.append("range", range);
      if (from) params.append("from", from);
      if (to) params.append("to", to);

      const query = params.toString();
      const res = await wrapper.fetchWithToken(
        `/superuser/reports/summary${query ? `?${query}` : ""}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.totalClaims === "number") {
          return data;
        }
      }
      return {
        range: range || "custom",
        from: from || null,
        to: to || null,
        totalClaims: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
      };
    } catch (e) {
      console.error("Admin getReportSummary error", e);
      return {
        range: range || "custom",
        from: from || null,
        to: to || null,
        totalClaims: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
      };
    }
  },

  /**
   * Get audit events for the admin audit log.
   * Optional filters: user, from, to, limit.
   */
  getAuditEvents: async ({ user, from, to, limit = 50 } = {}) => {
    try {
      const headers = { "Content-Type": "application/json" };

      const params = new URLSearchParams();
      if (user) params.append("user", user);
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (limit) params.append("limit", String(limit));

      const query = params.toString();
      const res = await wrapper.fetchWithToken(
        `/superuser/audit${query ? `?${query}` : ""}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
      return [];
    } catch (e) {
      console.error("Admin getAuditEvents error", e);
      return [];
    }
  },

  /**
   * Assign a claim to a specific user for a given role.
   */
  assignClaim: async ({ claimNumber, assignee, role }) => {
    const res = await wrapper.fetchWithToken(`/superuser/claims/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimNumber, assignee, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || `Assign failed (${res.status})`);
    }
    return data;
  },

  unassignClaim: async ({ claimNumber, role }) => {
    const res = await wrapper.fetchWithToken(`/superuser/claims/unassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimNumber, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || `Unassign failed (${res.status})`);
    }
    return data;
  },

  /**
   * Get tracked user live status cards for User Management.
   */
  getTrackedUsersStatus: async () => {
    try {
      const headers = { "Content-Type": "application/json" };

      const res = await wrapper.fetchWithToken(`/superuser/audit/tracked-users`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
      return [];
    } catch (e) {
      console.error("Admin getTrackedUsersStatus error", e);
      return [];
    }
  },

  /**
   * Admin force logout for one tracked user.
   */
  forceLogoutTrackedUser: async (username) => {
    const headers = { "Content-Type": "application/json" };

    const res = await wrapper.fetchWithToken(`/superuser/audit/force-logout`, {
      method: "POST",
      headers,
      body: JSON.stringify({ username }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || "Failed to force logout user");
    }
    return data;
  },
};

export default adminService;
