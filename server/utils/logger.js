/**
 * Enterprise Production Logger Utility
 * Provides structured logging with levels (info, warn, error, debug).
 * Suppresses debug log noise in production environments while keeping critical audits.
 */

const isProd = process.env.NODE_ENV === 'production';

const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
};

const logger = {
  info: (message, meta) => {
    console.log(formatLog('info', message, meta));
  },

  warn: (message, meta) => {
    console.warn(formatLog('warn', message, meta));
  },

  error: (message, meta) => {
    console.error(formatLog('error', message, meta));
  },

  debug: (message, meta) => {
    if (!isProd) {
      console.log(formatLog('debug', message, meta));
    }
  }
};

module.exports = logger;
