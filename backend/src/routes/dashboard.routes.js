const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { get } = require('../controllers/dashboard.controller');

router.get('/', protect, get);
module.exports = router;