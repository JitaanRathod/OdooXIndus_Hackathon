const router = require('express').Router();
const catchAsync = require('../utils/catchAsync');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const svc = require('../services/user.service');

router.get('/',       protect, authorize('admin'), catchAsync(async (req, res) => { const data = await svc.list();                         res.json({ success: true, data }); }));
router.put('/:id',    protect, authorize('admin'), catchAsync(async (req, res) => { const data = await svc.update(req.params.id, req.body); res.json({ success: true, data }); }));
router.delete('/:id', protect, authorize('admin'), catchAsync(async (req, res) => { await svc.remove(req.params.id);                       res.json({ success: true, data: null }); }));
module.exports = router;