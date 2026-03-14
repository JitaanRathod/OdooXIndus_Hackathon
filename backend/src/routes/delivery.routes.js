const router = require('express').Router();
const { make } = require('../controllers/generic.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const c = make(require('../services/delivery.service'));

router.get('/',              protect, c.list);
router.post('/',             protect, authorize('admin','inventory_manager','warehouse_staff'), c.create);
router.get('/:id',           protect, c.getOne);
router.put('/:id',           protect, authorize('admin','inventory_manager'), c.update);
router.post('/:id/pick',     protect, authorize('admin','inventory_manager','warehouse_staff','dispatcher'), c.action('pick'));
router.post('/:id/pack',     protect, authorize('admin','inventory_manager','warehouse_staff','dispatcher'), c.action('pack'));
router.post('/:id/validate', protect, authorize('admin','inventory_manager'), c.action('validate'));
router.post('/:id/cancel',   protect, authorize('admin'), c.action('cancel'));
module.exports = router;