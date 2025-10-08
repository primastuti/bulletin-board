// src/utils/isAuth.js
module.exports = (req, res, next) => {
  // NOTE: req.user akan tersedia setelah kamu konfigurasikan Passport / session
  if (req.user) return next();
  return res.status(401).json({ error: 'Authentication required' });
};
