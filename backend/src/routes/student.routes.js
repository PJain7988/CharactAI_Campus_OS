const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const ctrl = require('../controllers/student.controller');

router.get('/me', requireAuth, roleGuard('student'), ctrl.getMyProfile);
router.put('/me', requireAuth, roleGuard('student'), ctrl.updateMyProfile);
router.get('/', requireAuth, roleGuard('faculty', 'admin', 'recruiter'), ctrl.listStudents);
router.get('/:id', requireAuth, ctrl.getStudentById);
router.get('/:id/timeline', requireAuth, ctrl.getTimeline);

module.exports = router;
