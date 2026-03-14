const router = require('express').Router();
const { make } = require('../controllers/generic.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { categorySchema } = require('../validators/modules.validator');
const c = make(require('../services/category.service'));

router.get('/',       protect, c.list);
router.post('/',      protect, authorize('admin','inventory_manager'), validate(categorySchema), c.create);
router.get('/:id',    protect, c.getOne);
router.put('/:id',    protect, authorize('admin','inventory_manager'), validate(categorySchema.partial()), c.update);
router.delete('/:id', protect, authorize('admin'), c.remove);

module.exports = router;