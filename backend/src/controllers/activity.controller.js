const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { auditLog } = require('../utils/logger');

function listCategories(req, res) {
  const categories = db.prepare('SELECT * FROM activity_categories ORDER BY name').all();
  res.json({ categories });
}

function createActivity(req, res) {
  const studentId = req.user.role === 'student' ? req.user.id : req.body.studentId;
  if (!studentId) return res.status(400).json({ message: 'studentId is required.' });

  const {
    categoryId, title, description, activityDate, academicYear,
    durationHours, role, achievement, detailsJson
  } = req.body;

  if (!categoryId || !title || !activityDate || !academicYear) {
    return res.status(400).json({ message: 'categoryId, title, activityDate and academicYear are required.' });
  }

  // Validate and stringify detailsJson if it's an object
  let detailsStr = null;
  if (detailsJson) {
    try {
      detailsStr = typeof detailsJson === 'string' ? detailsJson : JSON.stringify(detailsJson);
    } catch {
      return res.status(400).json({ message: 'Invalid detailsJson format.' });
    }
  }

  const id = uuidv4();
  const evidencePath = req.file ? `/uploads/${req.file.filename}` : null;

  db.prepare(`
    INSERT INTO activities (
      id, student_id, category_id, title, description, activity_date, academic_year,
      duration_hours, details_json, role, achievement, evidence_path, verification_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    id, studentId, categoryId, title, description || '',
    activityDate, academicYear, durationHours || 0,
    detailsStr, role || null, achievement || null, evidencePath
  );

  auditLog(req.user.id, 'create_activity', 'activity', id, { title });
  res.status(201).json({ message: 'Activity submitted for verification.', activityId: id });
}

function listMyActivities(req, res) {
  const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;
  if (!studentId) return res.status(400).json({ message: 'studentId is required.' });
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ message: 'Not authorized.' });
  }

  const activities = db.prepare(`
    SELECT a.*, c.name AS category_name
    FROM activities a JOIN activity_categories c ON c.id = a.category_id
    WHERE a.student_id = ?
    ORDER BY a.activity_date DESC
  `).all(studentId);

  // Parse details_json for each activity
  const parsed = activities.map(a => ({
    ...a,
    details: a.details_json ? (() => { try { return JSON.parse(a.details_json); } catch { return null; } })() : null
  }));

  res.json({ activities: parsed });
}

function getActivity(req, res) {
  const activity = db.prepare(`
    SELECT a.*, c.name AS category_name FROM activities a
    JOIN activity_categories c ON c.id = a.category_id WHERE a.id = ?
  `).get(req.params.id);
  if (!activity) return res.status(404).json({ message: 'Activity not found.' });
  if (req.user.role === 'student' && req.user.id !== activity.student_id) {
    return res.status(403).json({ message: 'Not authorized.' });
  }
  const details = activity.details_json ? (() => { try { return JSON.parse(activity.details_json); } catch { return null; } })() : null;
  res.json({ activity: { ...activity, details } });
}

function deleteActivity(req, res) {
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) return res.status(404).json({ message: 'Activity not found.' });
  if (req.user.role === 'student' && req.user.id !== activity.student_id) {
    return res.status(403).json({ message: 'Not authorized.' });
  }
  if (activity.verification_status === 'approved' && req.user.role === 'student') {
    return res.status(400).json({ message: 'Verified activities cannot be deleted by students.' });
  }
  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  auditLog(req.user.id, 'delete_activity', 'activity', req.params.id, {});
  res.json({ message: 'Activity deleted.' });
}

function syncBiometric(req, res) {
  const studentId = req.user.role === 'student' ? req.user.id : req.body.studentId;
  if (!studentId) return res.status(400).json({ message: 'studentId is required.' });

  // Find category IDs for simulation
  const libCat = db.prepare("SELECT id FROM activity_categories WHERE name = 'library'").get();
  const classCat = db.prepare("SELECT id FROM activity_categories WHERE name = 'classroom'").get();

  if (!libCat || !classCat) return res.status(500).json({ message: 'Required categories missing.' });

  const insert = db.prepare(`
    INSERT INTO activities (
      id, student_id, category_id, title, description, activity_date, academic_year,
      duration_hours, details_json, role, achievement, verification_status, verified_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'Completed', 'approved', 'system')
  `);

  const today = new Date().toISOString().split('T')[0];
  let newCount = 0;

  // Simulate inserting a library visit and a classroom attendance record dynamically
  db.transaction(() => {
    insert.run(uuidv4(), studentId, libCat.id, 'Automated Biometric Library Entry', 'Auto-synced via gate RFID', today, 4, 1.5, JSON.stringify({ visitPurpose: 'study', bookTitle: 'System Design Interview' }));
    insert.run(uuidv4(), studentId, classCat.id, 'Daily Class Attendance Sync', 'Auto-synced via classroom RFID', today, 4, 6, JSON.stringify({ attendancePercent: 100, subject: 'Cloud Computing' }));
    newCount += 2;
  })();

  auditLog(req.user.id, 'sync_biometric', 'activity', studentId, { recordsAdded: newCount });
  res.json({ message: `Successfully synced ${newCount} biometric records!`, recordsAdded: newCount });
}

function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can verify activities.' });
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  if (!activity) return res.status(404).json({ message: 'Activity not found.' });

  db.prepare('UPDATE activities SET verification_status = ?, verified_by = ? WHERE id = ?').run(status, req.user.id, id);
  
  auditLog(req.user.id, `activity_${status}`, 'activity', id, { status });
  res.json({ message: `Activity ${status} successfully.` });
}

module.exports = { listCategories, createActivity, listMyActivities, getActivity, deleteActivity, syncBiometric, updateStatus };
