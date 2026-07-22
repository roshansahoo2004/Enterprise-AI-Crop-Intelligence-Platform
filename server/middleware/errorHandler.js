/**
 * Phase 12 - Step 6: Centralized Error Handler Middleware
 * Formats all unhandled errors into standard JSON responses.
 */
const errorHandler = (err, req, res, _next) => {
  console.error(`[Server Error] ${req.method} ${req.path} —`, err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errorDetails: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
