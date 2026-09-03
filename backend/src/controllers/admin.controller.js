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

module.exports = { overview, auditTrail, listPendingActivities };
