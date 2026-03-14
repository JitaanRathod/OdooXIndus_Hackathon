const router = require('express').Router();
const { make } = require('../controllers/generic.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const c = make(require('../services/adjustment.service'));

router.get('/',           protect, c.list);
router.post('/',          protect, authorize('admin','warehouse_staff'), c.create);
router.get('/:id',        protect, c.getOne);
router.post('/:id/apply', protect, authorize('admin','warehouse_staff'), c.action('apply'));
module.exports = router;