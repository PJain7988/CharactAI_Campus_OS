const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const ctrl = require('../controllers/placement.controller');

const OFFICER = roleGuard('placement_officer', 'admin');
const OFFICER_OR_RECRUITER = roleGuard('placement_officer', 'admin', 'recruiter');

// Drives
router.post('/drives', requireAuth, OFFICER_OR_RECRUITER, ctrl.createDrive);
router.get('/drives', requireAuth, ctrl.listDrives);
router.get('/drives/:id', requireAuth, ctrl.getDrive);
router.put('/drives/:id', requireAuth, OFFICER_OR_RECRUITER, ctrl.updateDrive);

// Applications
router.post('/drives/:id/apply', requireAuth, roleGuard('student'), ctrl.applyToDrive);
router.get('/drives/:id/applications', requireAuth, OFFICER_OR_RECRUITER, ctrl.listDriveApplications);
router.get('/applications/mine', requireAuth, roleGuard('student'), ctrl.myApplications);
router.put('/applications/:id/status', requireAuth, ctrl.updateApplicationStatus);

// Rounds (aptitude / technical / interview tracking)
router.get('/applications/:applicationId/rounds', requireAuth, ctrl.listApplicationRounds);
router.put('/rounds/:id', requireAuth, OFFICER_OR_RECRUITER, ctrl.updateRound);
router.post('/rounds/:id/schedule', requireAuth, OFFICER_OR_RECRUITER, ctrl.scheduleInterview);
router.put('/schedules/:id', requireAuth, OFFICER_OR_RECRUITER, ctrl.updateSchedule);

// Offers
router.post('/applications/:id/offer', requireAuth, OFFICER_OR_RECRUITER, ctrl.extendOffer);
router.put('/offers/:id', requireAuth, ctrl.respondToOffer);
router.get('/offers', requireAuth, OFFICER_OR_RECRUITER, ctrl.listOffers);

// Statistics & reports
router.get('/stats/overview', requireAuth, OFFICER, ctrl.statsOverview);
router.get('/stats/by-company', requireAuth, OFFICER, ctrl.statsByCompany);
router.get('/stats/by-department', requireAuth, OFFICER, ctrl.statsByDepartment);

module.exports = router;
