const db = require('../config/db');

function getMyProfile(req, res) {
  const student = db.prepare(`
    SELECT s.*, u.name, u.email FROM students s JOIN users u ON u.id = s.id WHERE s.id = ?
  `).get(req.user.id);
  if (!student) return res.status(404).json({ message: 'Student profile not found.' });
  res.json({ student });
}

function updateMyProfile(req, res) {
  const { department, program, batch, cgpa, visibility } = req.body;
  db.prepare(`
    UPDATE students SET
      department = COALESCE(?, department),
      program = COALESCE(?, program),
      batch = COALESCE(?, batch),
      cgpa = COALESCE(?, cgpa),
      visibility = COALESCE(?, visibility)
    WHERE id = ?
  `).run(department, program, batch, cgpa, visibility, req.user.id);
  res.json({ message: 'Profile updated.' });
}

function getStudentById(req, res) {
  // Faculty/Admin/Recruiter can view any student; students can only view themselves.
  const { id } = req.params;
  if (req.user.role === 'student' && req.user.id !== id) {
    return res.status(403).json({ message: 'Not authorized to view this profile.' });
  }
  const student = db.prepare(`
    SELECT s.*, u.name, u.email FROM students s JOIN users u ON u.id = s.id WHERE s.id = ?
  `).get(id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });
  res.json({ student });
}

function listStudents(req, res) {
  const students = db.prepare(`
    SELECT s.id, s.student_code, s.department, s.program, s.batch, s.cgpa, u.name, u.email
    FROM students s JOIN users u ON u.id = s.id
    ORDER BY u.name
  `).all();
  res.json({ students });
}

/** Builds the year-wise activity timeline used on the student dashboard (Section 16). */
function getTimeline(req, res) {
  const { id } = req.params;
  if (req.user.role === 'student' && req.user.id !== id) {
    return res.status(403).json({ message: 'Not authorized.' });
  }
  const rows = db.prepare(`
    SELECT a.academic_year, c.name AS category, COUNT(*) AS count
    FROM activities a JOIN activity_categories c ON c.id = a.category_id
    WHERE a.student_id = ? AND a.verification_status = 'approved'
    GROUP BY a.academic_year, c.name
    ORDER BY a.academic_year
  `).all(id);

  const totals = db.prepare(`
    SELECT academic_year, COUNT(*) AS total
    FROM activities WHERE student_id = ? AND verification_status = 'approved'
    GROUP BY academic_year ORDER BY academic_year
  `).all(id);

  res.json({ byCategory: rows, totalsByYear: totals });
}

module.exports = { getMyProfile, updateMyProfile, getStudentById, listStudents, getTimeline };
