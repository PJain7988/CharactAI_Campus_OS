const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const ctrl = require('../controllers/verification.controller');

router.get('/pending', requireAuth, roleGuard('faculty', 'admin'), ctrl.listPending);
router.put('/:id/approve', requireAuth, roleGuard('faculty', 'admin'), ctrl.approve);
router.put('/:id/reject', requireAuth, roleGuard('faculty', 'admin'), ctrl.reject);

module.exports = router;
