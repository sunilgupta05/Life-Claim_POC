import { API_URL } from "../util/config";
import claimsService from "./claimsServices";
import wrapper from "../util/ApiWrapper";
import adminService from "./adminService";
import { buildDashboardMetrics } from "../util/dashboardMetrics";

const dashboardService = {
  getDashboardStats: async (username, roles = []) => {
    try {
      const claims = await claimsService.getClaimByUsername(username);
      if (!claims || !Array.isArray(claims)) {
        return {
          totalClaims: 0,
          pendingClaims: 0,
          approvedClaims: 0,
          rejectedClaims: 0,
          totalPipelineValue: 0,
          avgDaysOpen: 0,
          overdueCount: 0,
          slaCompliance: 0,
          approvalRate: 0,
          fraudFlags: 0,
          typeBreakdown: [],
          monthlyTrend: [],
          monthlyTrendSum: 0,
          pieData: [],
          allClaims: [],
        };
      }

      const metrics = buildDashboardMetrics(claims, roles);
      return {
        totalClaims: metrics.total,
        pendingClaims: metrics.pending,
        approvedClaims: metrics.approved,
        rejectedClaims: metrics.rejected,
        totalPipelineValue: metrics.totalPipelineValue,
        avgDaysOpen: metrics.avgDaysOpen,
        overdueCount: metrics.overdueCount,
        slaCompliance: metrics.slaCompliance,
        approvalRate: metrics.approvalRate,
        fraudFlags: metrics.fraudFlags,
        typeBreakdown: metrics.typeBreakdown,
        monthlyTrend: metrics.monthlyTrend,
        monthlyTrendSum: metrics.monthlyTrendSum,
        pieData: metrics.pieData,
        allClaims: metrics.claims,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        totalClaims: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
        totalPipelineValue: 0,
        avgDaysOpen: 0,
        overdueCount: 0,
        slaCompliance: 0,
        approvalRate: 0,
        fraudFlags: 0,
        typeBreakdown: [],
        monthlyTrend: [],
        monthlyTrendSum: 0,
        pieData: [],
        allClaims: [],
      };
    }
  },

  getRecentActivities: async () => {
    try {
      const response = await wrapper.fetchWithToken("/dashboard/activities", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => null);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching dashboard activities:", error);
      return [];
    }
  },

  getRecentClaims: async (username, limit = 10) => {
    try {
      const claims = await claimsService.getClaimByUsername(username);
      if (!claims || !Array.isArray(claims)) return [];

      return claims
        .sort((a, b) => {
          const dateA = new Date(a.MODIFIED_AT || a.CREATED_AT || a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.MODIFIED_AT || b.CREATED_AT || b.createdAt || b.updatedAt || 0);
          return dateB - dateA;
        })
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent claims:", error);
      return [];
    }
  },
};

export const getDashboardData = async () => {
  const summary = await adminService.getSummary();
  return {
    metrics: {
      total: summary.totalClaims || 0,
      pending: summary.pending || 0,
      approved: summary.approved || 0,
      rejected: summary.rejected || 0,
    },
  };
};

export default dashboardService;
