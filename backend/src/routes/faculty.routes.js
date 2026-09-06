const router = require('express').Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// GET /api/faculty/students (Get students in faculty's department)
router.get('/students', requireAuth, roleGuard('faculty'), (req, res) => {
  // In a real app, faculty might be tied to a department. 
  // For now, we'll just return all students since the demo faculty oversees everyone.
  const students = db.prepare(`
    SELECT s.id, u.name, u.email, s.student_code, s.department, s.batch, s.program 
    FROM students s
    JOIN users u ON u.id = s.id
    ORDER BY u.name ASC
  `).all();
  res.json({ students });
});

// POST /api/faculty/activities (Faculty directly logging an achievement)
router.post('/activities', requireAuth, roleGuard('faculty'), (req, res) => {
  const { student_id, title, category_id, activity_date, academic_year, duration_hours, description, role, achievement, details_json } = req.body;
  const id = require('uuid').v4();
  
  // Directly insert as 'approved' since faculty is logging it
  db.prepare(`
    INSERT INTO activities (
      id, student_id, title, category_id, activity_date, academic_year, 
      duration_hours, description, role, achievement, details_json, verification_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
  `).run(id, student_id, title, category_id, activity_date, academic_year, duration_hours, description, role, achievement, details_json);

  res.json({ success: true, activityId: id });
});

// GET /api/faculty/students/:id/profile (Get full profile for directory)
router.get('/students/:id/profile', requireAuth, roleGuard('faculty'), (req, res) => {
  const student = db.prepare('SELECT s.*, u.name, u.email FROM students s JOIN users u ON u.id = s.id WHERE s.id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Not found' });
  
  const assessments = db.prepare('SELECT * FROM ai_assessments WHERE student_id = ? ORDER BY academic_year DESC').all();
  res.json({ student, assessments: assessments.map(a => ({...a, scores: JSON.parse(a.strengths_json || '[]')})) }); // Simplification for demo
});

module.exports = router;
