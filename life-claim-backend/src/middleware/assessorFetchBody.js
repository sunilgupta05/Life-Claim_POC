const { getClaimNumberFromRequest } = require('./claimAccessMiddleware');

/** Promote POST body claimNo into params for existing assessor controllers. */
function injectClaimNoFromBody(req, res, next) {
  const claimNo = getClaimNumberFromRequest(req);
  if (!claimNo) {
    return res.status(400).json({ message: 'claimNo is required in request body.' });
  }
  req.params.claimNo = claimNo;
  return next();
}

module.exports = { injectClaimNoFromBody };
