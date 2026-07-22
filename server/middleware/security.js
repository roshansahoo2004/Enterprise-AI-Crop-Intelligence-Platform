/**
 * Security Middleware Layer
 * Input sanitization, basic rate limiting, and Mongo injection prevention.
 */

// Simple in-memory rate limiter for auth routes
const authRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_AUTH_REQUESTS = 50;

// Periodic cleanup to prevent memory leaks from expired IP entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of authRateLimitMap.entries()) {
    if (now > record.resetTime) {
      authRateLimitMap.delete(ip);
    }
  }
}, 30 * 60 * 1000);

const authRateLimiter = (req, res, next) => {
  const ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
  const now = Date.now();

  const record = authRateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    record.count += 1;
  }

  authRateLimitMap.set(ip, record);

  if (record.count > MAX_AUTH_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    });
  }

  next();
};

/**
 * Mongo Injection & Script Sanitizer
 * Strips $ operators and script tags from query/body strings.
 */
const sanitizeParams = (req, res, next) => {
  const sanitize = (obj, visited = new WeakSet()) => {
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return obj;
    visited.add(obj);

    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key], visited);
      }
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

module.exports = { authRateLimiter, sanitizeParams };

