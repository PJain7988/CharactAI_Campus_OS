const logger = require('../config/logger');

// ── 404 Handler ────────────────────────────────────────────────────────────────
function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

// ── Global Error Handler ───────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isDev  = process.env.NODE_ENV !== 'production';

  // Log server errors (5xx) as error, client errors (4xx) as warn
  if (status >= 500) {
    logger.error({ message: err.message, stack: err.stack, url: req.originalUrl, method: req.method });
  } else {
    logger.warn({ message: err.message, url: req.originalUrl, method: req.method, status });
  }

  res.status(status).json({
    success:   false,
    message:   err.message || 'Internal server error',
    errorCode: err.code    || null,
    ...(isDev ? { stack: err.stack } : {}),
  });
}

// ── Async Wrapper (eliminates repetitive try/catch in controllers) ─────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { notFound, errorHandler, asyncHandler };
