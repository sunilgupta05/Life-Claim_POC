const { getUserContext } = require('./claimAccessMiddleware');

/**
 * Prevent horizontal privilege escalation via spoofed username in request body.
 * Fills req.body.username from the authenticated session when omitted.
 */
function assertBodyUsernameMatchesSession(req, res, next) {
  const { username } = getUserContext(req);
  if (!username) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const bodyUser = String(req.body?.username || '').trim();
  if (bodyUser && bodyUser.toLowerCase() !== username.toLowerCase()) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: username does not match your session.',
    });
  }

  if (!bodyUser) {
    req.body.username = username;
  }
  return next();
}

module.exports = assertBodyUsernameMatchesSession;
