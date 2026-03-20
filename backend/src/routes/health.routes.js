const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const { NODE_ENV } = require('../config/env');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check server and database health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get('/', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await sequelize.authenticate();
  } catch {
    dbStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'connected';

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: isHealthy ? 'ok' : 'degraded',
      db: dbStatus,
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});
module.exports = router;