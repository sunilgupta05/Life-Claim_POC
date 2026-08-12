const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/requirePermission");

const router = express.Router();

// Authenticate every platform route, then gate per-feature (roadmap 1.5
// follow-on): overview/user/claim-assignment endpoints need admin.users.manage;
// the audit (Login Sessions) endpoints need audit.view. Only superuser holds
// either by default, so this stays superuser-only — but audit.view can now be
// delegated to a non-superuser role via the Access Control console.
router.use(authMiddleware.authenticate);
const users = requirePermission("admin.users.manage");
const audit = requirePermission("audit.view");

// Platform-wide dashboard summary
router.get("/summary", users, adminController.getSummary);

// Recent claims across the platform
router.get("/claims/recent", users, adminController.getRecentClaims);

// Reports summary for admin reports page
router.get("/reports/summary", users, adminController.getReportSummary);

// Audit events for admin audit log
router.get("/audit", audit, adminController.getAuditEvents);
router.get("/audit/tracked-users", audit, adminController.getTrackedUserStatuses);
router.post("/audit/force-logout", audit, adminController.forceLogoutTrackedUser);

// Admin claim assignment
router.post("/claims/assign", users, adminController.assignClaim);
router.post("/claims/unassign", users, adminController.unassignClaim);

module.exports = router;
