const router = require('express').Router();
const { make } = require('../controllers/generic.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { adjustmentSchema } = require('../validators/modules.validator');
const c = make(require('../services/adjustment.service'));

router.get('/',           protect, c.list);
router.post('/',          protect, authorize('admin','warehouse_staff'), validate(adjustmentSchema), c.create);
router.get('/:id',        protect, c.getOne);
router.put('/:id',        protect, authorize('admin','warehouse_staff'), c.update);
router.post('/:id/apply', protect, authorize('admin','warehouse_staff'), c.action('apply'));

module.exports = router;