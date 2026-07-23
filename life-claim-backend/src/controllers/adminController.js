const logger = require("../config/logConfig");
const adminService = require("../services/adminService");

exports.getSummary = async (req, res, next) => {
  try {
    const summary = await adminService.getSummary();
    res.json(summary);
  } catch (error) {
    logger.error(`Admin summary error: ${error}`);
    next(error);
  }
};

exports.getRecentClaims = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 500);
    let view = req.query.view;
    if (Array.isArray(view)) view = view[0];
    view = view || undefined;
    const claims = await adminService.getRecentClaims(limit, view);
    res.json(Array.isArray(claims) ? claims : []);
  } catch (error) {
    logger.error(`Admin recent claims error: ${error}`);
    next(error);
  }
};

exports.getReportSummary = async (req, res, next) => {
  try {
    const { range, from, to } = req.query;
    const summary = await adminService.getReportSummary({ range, from, to });
    res.json(summary);
  } catch (error) {
    logger.error(`Admin report summary error: ${error}`);
    next(error);
  }
};

exports.getAuditEvents = async (req, res, next) => {
  try {
    const { user, from, to, limit } = req.query;
    const events = await adminService.getAuditEvents({
      user: user || undefined,
      from: from || undefined,
      to: to || undefined,
      limit: limit ? Number(limit) : 50,
    });
    res.json(events);
  } catch (error) {
    logger.error(`Admin audit events error: ${error}`);
    next(error);
  }
};

exports.getTrackedUserStatuses = async (req, res, next) => {
  try {
    const statuses = await adminService.getTrackedUserStatuses();
    res.json(statuses);
  } catch (error) {
    logger.error(`Admin tracked user statuses error: ${error}`);
    next(error);
  }
};

exports.forceLogoutTrackedUser = async (req, res, next) => {
  try {
    const { username } = req.body || {};
    const result = await adminService.forceLogoutTrackedUser({ username });
    res.json({
      message: `Force logout processed for ${result.username}`,
      ...result,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Force logout failed" });
  }
};

exports.assignClaim = async (req, res, next) => {
  try {
    const { claimNumber, assignee, role } = req.body || {};
    const actingUser = req.user && req.user.username ? req.user.username : "superuser";
    const result = await adminService.assignClaim({
      claimNumber,
      assignee,
      role,
      actingUser,
    });
    res.json(result);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to assign claim" });
  }
};

exports.unassignClaim = async (req, res, next) => {
  try {
    const { claimNumber, role } = req.body || {};
    const actingUser = req.user && req.user.username ? req.user.username : "superuser";
    const result = await adminService.unassignClaim({
      claimNumber,
      role,
      actingUser,
    });
    res.json(result);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to unassign claim" });
  }
};