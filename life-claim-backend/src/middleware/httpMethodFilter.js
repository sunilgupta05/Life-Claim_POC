/** Reject dangerous or unnecessary HTTP methods (VAPT). */
const DISALLOWED_METHODS = new Set(['TRACE', 'TRACK', 'CONNECT']);

function httpMethodFilter(req, res, next) {
  if (DISALLOWED_METHODS.has(req.method)) {
    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
    return res.status(405).json({ message: 'Method not allowed.' });
  }
  return next();
}

module.exports = { httpMethodFilter };
