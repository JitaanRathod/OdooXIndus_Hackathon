const router = require('express').Router();
const { make } = require('../controllers/generic.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const c = make(require('../services/warehouse.service'));

router.get('/',       protect, c.list);
router.post('/',      protect, authorize('admin'), c.create);
router.get('/:id',    protect, c.getOne);
router.put('/:id',    protect, authorize('admin'), c.update);
router.delete('/:id', protect, authorize('admin'), c.remove);
module.exports = router;