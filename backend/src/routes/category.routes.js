const router = require('express').Router();
const { make } = require('../controllers/generic.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const c = make(require('../services/category.service'));

router.get('/',       protect, c.list);
router.post('/',      protect, authorize('admin','inventory_manager'), c.create);
router.get('/:id',    protect, c.getOne);
router.put('/:id',    protect, authorize('admin','inventory_manager'), c.update);
router.delete('/:id', protect, authorize('admin'), c.remove);
module.exports = router;