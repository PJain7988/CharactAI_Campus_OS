const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const ctrl = require('../controllers/recruitment.controller');

router.post('/jobs', requireAuth, roleGuard('recruiter', 'admin'), ctrl.createJob);
router.get('/jobs', requireAuth, ctrl.listJobs);
router.get('/jobs/:id', requireAuth, ctrl.getJob);
router.post('/jobs/:id/run-matching', requireAuth, roleGuard('recruiter', 'admin'), ctrl.runMatching);
router.get('/jobs/:id/candidates', requireAuth, roleGuard('recruiter', 'admin', 'faculty'), ctrl.getCandidates);
router.get('/jobs/:id/candidates/:studentId/explain', requireAuth, ctrl.explainCandidate);
router.post('/jobs/:id/candidates/:studentId/start-interview', requireAuth, ctrl.startInterview);
router.post('/interviews/:interviewId/answer', requireAuth, ctrl.submitAnswer);
router.post('/interviews/:interviewId/complete', requireAuth, ctrl.completeInterview);
router.post('/jobs/:id/finalize', requireAuth, roleGuard('recruiter', 'admin'), ctrl.finalizeShortlist);
router.post('/rag-search', requireAuth, roleGuard('recruiter', 'admin', 'placement_officer'), ctrl.ragSearch);
router.post('/resume', requireAuth, roleGuard('student', 'admin'), ctrl.uploadResume);

module.exports = router;
