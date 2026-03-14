const router = require('express').Router();
const catchAsync = require('../utils/catchAsync');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const svc = require('../services/stockmove.service');

router.get('/', protect, authorize('admin','inventory_manager'), catchAsync(async (req, res) => {
  const data = await svc.list(req.query);
  res.json({ success: true, data });
}));
module.exports = router;