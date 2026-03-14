const router = require('express').Router();
const catchAsync = require('../utils/catchAsync');
const { protect } = require('../middleware/auth');
const { getAlerts } = require('../services/alerts.service');

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: Get all low stock and out-of-stock products
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products below reorder point
 */
router.get('/', protect, catchAsync(async (req, res) => {
  const data = await getAlerts();
  res.json({ success: true, data });
}));

module.exports = router;