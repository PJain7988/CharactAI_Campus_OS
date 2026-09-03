const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const ctrl = require('../controllers/ai.controller');

router.post('/assessment/:studentId', requireAuth, roleGuard('student', 'faculty', 'admin'), ctrl.runAssessment);
router.get('/assessment/:studentId', requireAuth, ctrl.getLatestAssessment);
router.get('/insights/:studentId', requireAuth, ctrl.getInsights);
router.get('/recommendations/:studentId', requireAuth, ctrl.getRecommendations);
router.get('/growth/:studentId', requireAuth, ctrl.getGrowth);

module.exports = router;
