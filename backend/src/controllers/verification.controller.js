const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { auditLog } = require('../utils/logger');

function listPending(req, res) {
  const activities = db.prepare(`
    SELECT a.*, c.name AS category_name, u.name AS student_name, s.student_code
    FROM activities a
    JOIN activity_categories c ON c.id = a.category_id
    JOIN students s ON s.id = a.student_id
    JOIN users u ON u.id = s.id
    WHERE a.verification_status = 'pending'
    ORDER BY a.created_at ASC
  `).all();
  res.json({ activities });
}

function approve(req, res) {
  const { id } = req.params;
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  if (!activity) return res.status(404).json({ message: 'Activity not found.' });

  db.prepare(`
    UPDATE activities SET verification_status = 'approved', verified_by = ?, rejection_reason = NULL WHERE id = ?
  `).run(req.user.id, id);

  notify(activity.student_id, `Your activity "${activity.title}" has been verified.`);
  auditLog(req.user.id, 'approve_activity', 'activity', id, {});
  res.json({ message: 'Activity approved.' });
}

function reject(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  if (!activity) return res.status(404).json({ message: 'Activity not found.' });

  db.prepare(`
    UPDATE activities SET verification_status = 'rejected', verified_by = ?, rejection_reason = ? WHERE id = ?
  `).run(req.user.id, reason || 'Invalid or insufficient evidence', id);

  notify(activity.student_id, `Your activity "${activity.title}" was rejected. ${reason ? 'Reason: ' + reason : ''}`);
  auditLog(req.user.id, 'reject_activity', 'activity', id, { reason });
  res.json({ message: 'Activity rejected.' });
}

function notify(userId, message) {
  db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)').run(uuidv4(), userId, message);
}

module.exports = { listPending, approve, reject };
