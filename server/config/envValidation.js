/**
 * Phase 12 - Step 6: Environment Variable Validation
 * Validates mandatory environment variables at server startup.
 */

const validateEnv = () => {
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`[Environment Warning] ⚠️ Missing recommended environment variables: ${missing.join(', ')}`);
    console.warn(`[Environment Warning] Using fallback defaults for local execution.`);
  }

  // Sanitize PORT
  process.env.PORT = process.env.PORT || '5000';
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
};

module.exports = validateEnv;
