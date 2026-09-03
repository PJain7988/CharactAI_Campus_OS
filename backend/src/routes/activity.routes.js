const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/activity.controller');

router.get('/categories', requireAuth, ctrl.listCategories);
router.post('/', requireAuth, roleGuard('student', 'faculty', 'admin'), upload.single('evidence'), ctrl.createActivity);
router.get('/', requireAuth, ctrl.listMyActivities);
router.get('/:id', requireAuth, ctrl.getActivity);
router.delete('/:id', requireAuth, ctrl.deleteActivity);

module.exports = router;
