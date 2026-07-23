const logger = require('../config/logConfig');
const claimsService = require('../services/claimsService');
const { hasSuperUserAccess } = require('../util/superuserRoles');
const { extractKeycloakRoles, extractKeycloakUsername } = require('../util/keycloakRoles');


exports.getClaimByUsername = async (req, res, next) => {
  const token = req.kauth?.grant?.access_token?.content;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No access token' });
  }

  const usernameFromToken = extractKeycloakUsername(token);
  const roles = extractKeycloakRoles(token);
  const requestedUsername = String(req.body?.username || '').trim();

  const isAdmin = hasSuperUserAccess(roles, usernameFromToken);

  // Non–super users can only fetch their own claims; super users may fetch any user.
  const username = isAdmin
    ? (requestedUsername || usernameFromToken)
    : usernameFromToken;

  try {
    let claims = await claimsService.getClaimByUsername(username);
    res.json(claims);
  } catch (error) {
    logger.error(`Cannot GET users || MSG : ${error}`);
    next(error);
  }

}

exports.assignClaims = async(req,res,next)=>{
  try {
    const claims = req.body.claims
    console.log('claimsController >> assignClaims request received');
  } catch (error) {
    logger.error(`Cannot GET users || MSG : ${error}`);
    next(error);
  }
}

exports.changeStatus = async (req, res, next) => {
  try {
    const {status, claimNumber} = req.body
    let  claims = await claimsService.changeStatus(claimNumber,status)
    res.json(claims)
  } catch (error) {
    logger.error(` ${error}`);
    next(error);
  }
}