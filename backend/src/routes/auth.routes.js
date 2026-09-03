const router = require('express').Router();
const { login, registerStudent, me } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', registerStudent);
router.get('/me', requireAuth, me);

module.exports = router;
