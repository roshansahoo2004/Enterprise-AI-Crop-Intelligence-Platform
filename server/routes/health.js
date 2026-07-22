const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * GET /health & GET /ready
 * Production health & readiness probes for Render / Kubernetes / Load Balancers.
 */
const getHealthStatus = () => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  const isHealthy = dbState === 1;

  return {
    status: isHealthy ? 'UP' : 'DEGRADED',
    ready: isHealthy,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: {
      status: dbStatusMap[dbState] || 'Unknown',
      readyState: dbState
    }
  };
};

router.get('/health', (req, res) => {
  const health = getHealthStatus();
  const statusCode = health.status === 'UP' ? 200 : 503;
  res.status(statusCode).json({
    success: health.status === 'UP',
    ...health
  });
});

router.get('/ready', (req, res) => {
  const health = getHealthStatus();
  if (health.ready) {
    res.status(200).json({ success: true, message: 'Server is ready to accept traffic', ...health });
  } else {
    res.status(503).json({ success: false, message: 'Database connection not ready', ...health });
  }
});

module.exports = router;
