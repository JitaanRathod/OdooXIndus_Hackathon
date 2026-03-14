const router = require('express').Router();
const { make } = require('../controllers/generic.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { receiptSchema } = require('../validators/modules.validator');
const c = make(require('../services/receipt.service'));

router.get('/',              protect, c.list);
router.post('/',             protect, authorize('admin','inventory_manager','warehouse_staff'), validate(receiptSchema), c.create);
router.get('/:id',           protect, c.getOne);
router.put('/:id',           protect, authorize('admin','inventory_manager'), c.update);
router.post('/:id/validate', protect, authorize('admin','inventory_manager'), c.action('validate'));
router.post('/:id/cancel',   protect, authorize('admin'), c.action('cancel'));

module.exports = router;