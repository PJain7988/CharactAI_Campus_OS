const { verifyToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, role, name, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

module.exports = { requireAuth };
