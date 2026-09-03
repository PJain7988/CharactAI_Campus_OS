const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const ctrl = require('../controllers/admin.controller');

router.get('/overview', requireAuth, roleGuard('admin'), ctrl.overview);
router.get('/audit-logs', requireAuth, roleGuard('admin'), ctrl.auditTrail);

module.exports = router;
