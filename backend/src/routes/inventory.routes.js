const router = require('express').Router();
const catchAsync = require('../utils/catchAsync');
const { protect } = require('../middleware/auth');
const svc = require('../services/inventory.service');

router.get('/', protect, catchAsync(async (req, res) => {
  const data = await svc.list(req.query);
  res.json({ success: true, data });
}));
module.exports = router;