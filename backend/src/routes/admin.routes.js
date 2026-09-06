const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const ctrl = require('../controllers/admin.controller');

router.get('/overview', requireAuth, roleGuard('admin'), ctrl.overview);
router.get('/pending-activities', requireAuth, roleGuard('admin'), ctrl.listPendingActivities);
router.get('/audit-logs', requireAuth, roleGuard('admin'), ctrl.auditTrail);

// Users
router.get('/users', requireAuth, roleGuard('admin'), ctrl.listUsers);
router.delete('/users/:id', requireAuth, roleGuard('admin'), ctrl.deleteUser);

// Categories
router.get('/categories', requireAuth, roleGuard('admin'), ctrl.listCategories);
router.post('/categories', requireAuth, roleGuard('admin'), ctrl.createCategory);
router.delete('/categories/:id', requireAuth, roleGuard('admin'), ctrl.deleteCategory);

// Events
router.get('/events', requireAuth, roleGuard('admin'), ctrl.listEvents);
router.post('/events', requireAuth, roleGuard('admin'), ctrl.createEvent);
router.delete('/events/:id', requireAuth, roleGuard('admin'), ctrl.deleteEvent);

// Settings
router.get('/settings', requireAuth, roleGuard('admin'), ctrl.getSettings);
router.put('/settings', requireAuth, roleGuard('admin'), ctrl.updateSetting);

module.exports = router;
