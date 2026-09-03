const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const ctrl = require('../controllers/certificate.controller');

router.post('/:studentId/generate', requireAuth, roleGuard('student', 'admin'), ctrl.generate);
router.get('/mine', requireAuth, ctrl.myCertificates);
router.get('/:code/download', ctrl.download); // link is only shared with the owner; kept simple for the demo
router.get('/verify/:code', ctrl.verify);       // fully public

module.exports = router;
