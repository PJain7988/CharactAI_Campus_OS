const db = require('../config/db');

function overview(req, res) {
  const totalStudents = db.prepare('SELECT COUNT(*) AS c FROM students').get().c;
  const verifiedActivities = db.prepare("SELECT COUNT(*) AS c FROM activities WHERE verification_status = 'approved'").get().c;
  const pendingActivities = db.prepare("SELECT COUNT(*) AS c FROM activities WHERE verification_status = 'pending'").get().c;
  const certificatesIssued = db.prepare('SELECT COUNT(*) AS c FROM certificates').get().c;
  const avgScore = db.prepare('SELECT AVG(overall_score) AS a FROM certificates').get().a;

  const byCategory = db.prepare(`
    SELECT c.name AS category, COUNT(*) AS count
    FROM activities a JOIN activity_categories c ON c.id = a.category_id
    WHERE a.verification_status = 'approved'
    GROUP BY c.name ORDER BY count DESC
  `).all();

  const byDepartment = db.prepare(`
    SELECT s.department, ROUND(AVG(cert.overall_score), 1) AS avg_score, COUNT(DISTINCT s.id) AS students
    FROM students s
    LEFT JOIN certificates cert ON cert.student_id = s.id
    GROUP BY s.department
  `).all();

  res.json({
    totalStudents,
    verifiedActivities,
    pendingActivities,
    certificatesIssued,
    averageDevelopmentScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
    activityByCategory: byCategory,
    departmentComparison: byDepartment
  });
}

function auditTrail(req, res) {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200').all();
  res.json({ logs: logs.map(l => ({ ...l, meta: JSON.parse(l.meta_json || '{}') })) });
}

function listPendingActivities(req, res) {
  const activities = db.prepare(`
    SELECT a.*, c.name AS category_name, s.department, u.name AS student_name
    FROM activities a 
    JOIN activity_categories c ON c.id = a.category_id
    JOIN students s ON s.id = a.student_id
    JOIN users u ON u.id = s.id
    WHERE a.verification_status = 'pending'
    ORDER BY a.activity_date ASC
  `).all();
  
  res.json({
    activities: activities.map(a => ({
      ...a,
      details: a.details_json ? (() => { try { return JSON.parse(a.details_json); } catch { return null; } })() : null
    }))
  });
}


// --- User Management ---
function listUsers(req, res) {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
}

function deleteUser(req, res) {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}

// --- Category Management ---
function listCategories(req, res) {
  const categories = db.prepare('SELECT * FROM activity_categories ORDER BY name ASC').all();
  res.json({ categories });
}

function createCategory(req, res) {
  const { name, description } = req.body;
  const id = require('uuid').v4();
  db.prepare('INSERT INTO activity_categories (id, name, description) VALUES (?, ?, ?)').run(id, name, description);
  res.json({ success: true, category: { id, name, description } });
}

function deleteCategory(req, res) {
  db.prepare('DELETE FROM activity_categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}

// --- Events Management ---
function listEvents(req, res) {
  const events = db.prepare(`
    SELECT e.*, c.name AS category_name 
    FROM global_events e 
    JOIN activity_categories c ON e.category_id = c.id 
    ORDER BY e.event_date DESC
  `).all();
  res.json({ events });
}

function createEvent(req, res) {
  const { title, description, event_date, location, category_id } = req.body;
  const id = require('uuid').v4();
  db.prepare('INSERT INTO global_events (id, title, description, event_date, location, category_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, title, description, event_date, location, category_id);
  res.json({ success: true, event: { id, title, description, event_date, location, category_id } });
}

function deleteEvent(req, res) {
  db.prepare('DELETE FROM global_events WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}

// --- Settings Management ---
function getSettings(req, res) {
  const settings = db.prepare('SELECT * FROM system_settings').all();
  const formatted = {};
  settings.forEach(s => formatted[s.key] = JSON.parse(s.value_json));
  res.json({ settings: formatted });
}

function updateSetting(req, res) {
  const { key, value } = req.body;
  db.prepare('INSERT INTO system_settings (key, value_json) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json')
    .run(key, JSON.stringify(value));
  res.json({ success: true });
}

module.exports = { 
  overview, auditTrail, listPendingActivities,
  listUsers, deleteUser,
  listCategories, createCategory, deleteCategory,
  listEvents, createEvent, deleteEvent,
  getSettings, updateSetting
};
