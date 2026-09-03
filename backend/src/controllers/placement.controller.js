const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { auditLog } = require('../utils/logger');

function notify(userId, message) {
  db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)').run(uuidv4(), userId, message);
}

// ===================== Drives =====================

/** POST /api/placement/drives — placement officer/admin creates a drive with eligibility + round plan */
function createDrive(req, res) {
  const {
    companyName, title, description, driveDate, applicationDeadline, mode,
    roundsPlan, minCgpa, maxBacklogs, graduationYear, branches,
    packageMinLpa, packageMaxLpa, jobId
  } = req.body;

  if (!title || !companyName) {
    return res.status(400).json({ message: 'title and companyName are required.' });
  }

  // Reuse an existing company for this recruiter/officer, or create one
  let company = db.prepare('SELECT * FROM companies WHERE name = ?').get(companyName);
  if (!company) {
    const companyId = uuidv4();
    db.prepare('INSERT INTO companies (id, name, recruiter_user_id) VALUES (?, ?, ?)').run(companyId, companyName, req.user.id);
    company = { id: companyId };
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO placement_drives (
      id, company_id, job_id, title, description, drive_date, application_deadline, mode,
      rounds_plan_json, min_cgpa, max_backlogs, graduation_year, branches_json,
      package_min_lpa, package_max_lpa, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
  `).run(
    id, company.id, jobId || null, title, description || '', driveDate || null, applicationDeadline || null,
    mode || 'on-campus', JSON.stringify(roundsPlan || ['Aptitude', 'Technical', 'HR']),
    minCgpa || 0, maxBacklogs ?? 0, graduationYear || null, JSON.stringify(branches || []),
    packageMinLpa || null, packageMaxLpa || null, req.user.id
  );

  auditLog(req.user.id, 'create_drive', 'placement_drive', id, { title, companyName });
  res.status(201).json({ driveId: id, message: 'Placement drive created and opened for applications.' });
}

function listDrives(req, res) {
  const { status } = req.query;
  let query = `
    SELECT d.*, c.name AS company_name,
      (SELECT COUNT(*) FROM placement_applications a WHERE a.drive_id = d.id) AS application_count,
      (SELECT COUNT(*) FROM placement_offers o WHERE o.drive_id = d.id) AS offer_count
    FROM placement_drives d JOIN companies c ON c.id = d.company_id
  `;
  const params = [];
  if (status) { query += ' WHERE d.status = ?'; params.push(status); }
  query += ' ORDER BY d.created_at DESC';
  const drives = db.prepare(query).all(...params).map(formatDrive);
  res.json({ drives });
}

function getDrive(req, res) {
  const drive = db.prepare(`
    SELECT d.*, c.name AS company_name FROM placement_drives d JOIN companies c ON c.id = d.company_id WHERE d.id = ?
  `).get(req.params.id);
  if (!drive) return res.status(404).json({ message: 'Drive not found.' });
  res.json({ drive: formatDrive(drive) });
}

function updateDrive(req, res) {
  const { id } = req.params;
  const { status, description, applicationDeadline, driveDate } = req.body;
  const drive = db.prepare('SELECT * FROM placement_drives WHERE id = ?').get(id);
  if (!drive) return res.status(404).json({ message: 'Drive not found.' });

  db.prepare(`
    UPDATE placement_drives SET
      status = COALESCE(?, status),
      description = COALESCE(?, description),
      application_deadline = COALESCE(?, application_deadline),
      drive_date = COALESCE(?, drive_date)
    WHERE id = ?
  `).run(status, description, applicationDeadline, driveDate, id);

  auditLog(req.user.id, 'update_drive', 'placement_drive', id, { status });
  res.json({ message: 'Drive updated.' });
}

// ===================== Applications =====================

function isEligible(student, drive) {
  const branches = JSON.parse(drive.branches_json || '[]');
  return (
    (student.cgpa || 0) >= (drive.min_cgpa || 0) &&
    (student.backlogs || 0) <= (drive.max_backlogs ?? 999) &&
    (!drive.graduation_year || student.graduation_year === drive.graduation_year) &&
    (!branches.length || branches.includes(student.department))
  );
}

/** POST /api/placement/drives/:id/apply — student applies; eligibility is enforced server-side */
function applyToDrive(req, res) {
  const { id: driveId } = req.params;
  const studentId = req.user.id;

  const drive = db.prepare('SELECT * FROM placement_drives WHERE id = ?').get(driveId);
  if (!drive) return res.status(404).json({ message: 'Drive not found.' });
  if (drive.status !== 'open') return res.status(400).json({ message: 'This drive is not currently accepting applications.' });

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!isEligible(student, drive)) {
    return res.status(403).json({ message: 'You do not meet the eligibility criteria for this drive (CGPA, backlogs, batch, or branch).' });
  }

  const existing = db.prepare('SELECT id FROM placement_applications WHERE drive_id = ? AND student_id = ?').get(driveId, studentId);
  if (existing) return res.status(409).json({ message: 'You have already applied to this drive.' });

  const id = uuidv4();
  db.prepare(`INSERT INTO placement_applications (id, drive_id, student_id) VALUES (?, ?, ?)`).run(id, driveId, studentId);

  // Seed the round plan for this application from the drive's plan (Section: Aptitude/Technical/Interview tracking)
  const roundsPlan = JSON.parse(drive.rounds_plan_json || '[]');
  const insertRound = db.prepare(`
    INSERT INTO placement_rounds (id, application_id, round_name, round_type, sequence) VALUES (?, ?, ?, ?, ?)
  `);
  roundsPlan.forEach((roundName, idx) => {
    insertRound.run(uuidv4(), id, roundName, inferRoundType(roundName), idx + 1);
  });

  auditLog(studentId, 'apply_drive', 'placement_application', id, { driveId });
  res.status(201).json({ applicationId: id, message: 'Application submitted.', rounds: roundsPlan });
}

function inferRoundType(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('apti')) return 'aptitude';
  if (n.includes('tech')) return 'technical';
  if (n.includes('gd') || n.includes('group')) return 'group_discussion';
  if (n.includes('hr')) return 'hr';
  if (n.includes('manager')) return 'managerial';
  return 'other';
}

function listDriveApplications(req, res) {
  const { id: driveId } = req.params;
  const { status } = req.query;
  let query = `
    SELECT pa.*, u.name AS student_name, s.student_code, s.cgpa, s.department
    FROM placement_applications pa
    JOIN students s ON s.id = pa.student_id
    JOIN users u ON u.id = s.id
    WHERE pa.drive_id = ?
  `;
  const params = [driveId];
  if (status) { query += ' AND pa.status = ?'; params.push(status); }
  query += ' ORDER BY pa.applied_at ASC';

  const applications = db.prepare(query).all(...params).map(formatApplication);
  res.json({ applications });
}

function myApplications(req, res) {
  const applications = db.prepare(`
    SELECT pa.*, d.title AS drive_title, c.name AS company_name, d.package_min_lpa, d.package_max_lpa
    FROM placement_applications pa
    JOIN placement_drives d ON d.id = pa.drive_id
    JOIN companies c ON c.id = d.company_id
    WHERE pa.student_id = ?
    ORDER BY pa.applied_at DESC
  `).all(req.user.id);
  res.json({ applications });
}

/** PUT /api/placement/applications/:id/status — shortlist / reject / select / withdraw workflow */
function updateApplicationStatus(req, res) {
  const { id } = req.params;
  const { status, notes } = req.body;
  const valid = ['applied', 'shortlisted', 'in_process', 'rejected', 'selected', 'offer_extended', 'offer_accepted', 'offer_declined', 'withdrawn'];
  if (!valid.includes(status)) return res.status(400).json({ message: `status must be one of: ${valid.join(', ')}` });

  const application = db.prepare('SELECT * FROM placement_applications WHERE id = ?').get(id);
  if (!application) return res.status(404).json({ message: 'Application not found.' });

  if (req.user.role === 'student' && !(req.user.id === application.student_id && status === 'withdrawn')) {
    return res.status(403).json({ message: 'Students may only withdraw their own applications.' });
  }

  db.prepare('UPDATE placement_applications SET status = ?, notes = COALESCE(?, notes) WHERE id = ?').run(status, notes, id);
  notify(application.student_id, `Your application status has been updated to "${status.replace('_', ' ')}".`);
  auditLog(req.user.id, 'update_application_status', 'placement_application', id, { status });

  res.json({ message: 'Application status updated.' });
}

// ===================== Rounds (Aptitude / Technical / Interview tracking) =====================

function listApplicationRounds(req, res) {
  const { applicationId } = req.params;
  const rounds = db.prepare(`
    SELECT r.*, (
      SELECT json_group_array(json_object(
        'id', s.id, 'scheduledDate', s.scheduled_date, 'scheduledTime', s.scheduled_time,
        'mode', s.mode, 'locationOrLink', s.location_or_link, 'interviewerName', s.interviewer_name,
        'status', s.status
      )) FROM interview_schedules s WHERE s.round_id = r.id
    ) AS schedules_json
    FROM placement_rounds r WHERE r.application_id = ? ORDER BY r.sequence
  `).all(applicationId);

  res.json({ rounds: rounds.map(r => ({ ...formatRound(r), schedules: JSON.parse(r.schedules_json || '[]') })) });
}

/** PUT /api/placement/rounds/:id — record aptitude/technical/interview round outcome */
function updateRound(req, res) {
  const { id } = req.params;
  const { status, score, maxScore, remarks } = req.body;
  const round = db.prepare('SELECT * FROM placement_rounds WHERE id = ?').get(id);
  if (!round) return res.status(404).json({ message: 'Round not found.' });

  db.prepare(`
    UPDATE placement_rounds SET
      status = COALESCE(?, status), score = COALESCE(?, score), max_score = COALESCE(?, max_score),
      remarks = COALESCE(?, remarks), evaluated_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, score, maxScore, remarks, req.user.id, id);

  const application = db.prepare('SELECT * FROM placement_applications WHERE id = ?').get(round.application_id);
  if (status === 'cleared') {
    notify(application.student_id, `You cleared the "${round.round_name}" round. Good luck with the next step!`);
    db.prepare(`UPDATE placement_applications SET status = 'in_process' WHERE id = ?`).run(round.application_id);
  } else if (status === 'rejected') {
    notify(application.student_id, `You were not shortlisted after the "${round.round_name}" round.`);
    db.prepare(`UPDATE placement_applications SET status = 'rejected' WHERE id = ?`).run(round.application_id);
  }

  auditLog(req.user.id, 'update_round', 'placement_round', id, { status, score });
  res.json({ message: 'Round updated.' });
}

/** POST /api/placement/rounds/:id/schedule — interview scheduling */
function scheduleInterview(req, res) {
  const { id: roundId } = req.params;
  const { scheduledDate, scheduledTime, mode, locationOrLink, interviewerName, notes } = req.body;
  if (!scheduledDate || !scheduledTime) return res.status(400).json({ message: 'scheduledDate and scheduledTime are required.' });

  const round = db.prepare('SELECT * FROM placement_rounds WHERE id = ?').get(roundId);
  if (!round) return res.status(404).json({ message: 'Round not found.' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO interview_schedules (id, round_id, scheduled_date, scheduled_time, mode, location_or_link, interviewer_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, roundId, scheduledDate, scheduledTime, mode || 'online', locationOrLink || null, interviewerName || null, notes || null);

  db.prepare(`UPDATE placement_rounds SET status = 'scheduled', updated_at = datetime('now') WHERE id = ?`).run(roundId);

  const application = db.prepare('SELECT * FROM placement_applications WHERE id = ?').get(round.application_id);
  notify(application.student_id,
    `Your "${round.round_name}" round is scheduled for ${scheduledDate} at ${scheduledTime} (${mode || 'online'}).`);

  auditLog(req.user.id, 'schedule_interview', 'interview_schedule', id, { roundId });
  res.status(201).json({ scheduleId: id, message: 'Interview scheduled.' });
}

function updateSchedule(req, res) {
  const { id } = req.params;
  const { status, scheduledDate, scheduledTime, locationOrLink, notes } = req.body;
  const schedule = db.prepare('SELECT * FROM interview_schedules WHERE id = ?').get(id);
  if (!schedule) return res.status(404).json({ message: 'Schedule not found.' });

  db.prepare(`
    UPDATE interview_schedules SET
      status = COALESCE(?, status), scheduled_date = COALESCE(?, scheduled_date),
      scheduled_time = COALESCE(?, scheduled_time), location_or_link = COALESCE(?, location_or_link),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(status, scheduledDate, scheduledTime, locationOrLink, notes, id);

  auditLog(req.user.id, 'update_schedule', 'interview_schedule', id, { status });
  res.json({ message: 'Schedule updated.' });
}

// ===================== Offers =====================

/** POST /api/placement/applications/:id/offer — extend an offer */
function extendOffer(req, res) {
  const { id: applicationId } = req.params;
  const { designation, ctcLpa } = req.body;

  const application = db.prepare('SELECT * FROM placement_applications WHERE id = ?').get(applicationId);
  if (!application) return res.status(404).json({ message: 'Application not found.' });

  const existing = db.prepare('SELECT id FROM placement_offers WHERE application_id = ?').get(applicationId);
  if (existing) return res.status(409).json({ message: 'An offer already exists for this application.' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO placement_offers (id, application_id, student_id, drive_id, designation, ctc_lpa)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, applicationId, application.student_id, application.drive_id, designation || null, ctcLpa || null);

  db.prepare(`UPDATE placement_applications SET status = 'offer_extended' WHERE id = ?`).run(applicationId);
  notify(application.student_id, `Congratulations! You have received an offer${designation ? ` for ${designation}` : ''}.`);
  auditLog(req.user.id, 'extend_offer', 'placement_offer', id, { applicationId, ctcLpa });

  res.status(201).json({ offerId: id, message: 'Offer extended.' });
}

/** PUT /api/placement/offers/:id — student accepts/declines, or officer withdraws */
function respondToOffer(req, res) {
  const { id } = req.params;
  const { status } = req.body; // accepted | declined | withdrawn
  const offer = db.prepare('SELECT * FROM placement_offers WHERE id = ?').get(id);
  if (!offer) return res.status(404).json({ message: 'Offer not found.' });

  if (req.user.role === 'student' && req.user.id !== offer.student_id) {
    return res.status(403).json({ message: 'Not authorized.' });
  }

  db.prepare('UPDATE placement_offers SET status = ? WHERE id = ?').run(status, id);
  const appStatus = status === 'accepted' ? 'offer_accepted' : status === 'declined' ? 'offer_declined' : 'withdrawn';
  db.prepare('UPDATE placement_applications SET status = ? WHERE id = ?').run(appStatus, offer.application_id);

  auditLog(req.user.id, 'respond_offer', 'placement_offer', id, { status });
  res.json({ message: `Offer marked as ${status}.` });
}

function listOffers(req, res) {
  const { driveId } = req.query;
  let query = `
    SELECT o.*, u.name AS student_name, d.title AS drive_title, c.name AS company_name
    FROM placement_offers o
    JOIN students s ON s.id = o.student_id
    JOIN users u ON u.id = s.id
    JOIN placement_drives d ON d.id = o.drive_id
    JOIN companies c ON c.id = d.company_id
  `;
  const params = [];
  if (driveId) { query += ' WHERE o.drive_id = ?'; params.push(driveId); }
  query += ' ORDER BY o.offer_date DESC';
  res.json({ offers: db.prepare(query).all(...params) });
}

// ===================== Statistics & Reports =====================

/** GET /api/placement/stats/overview — headline placement statistics (Section: Placement statistics) */
function statsOverview(req, res) {
  const totalDrives = db.prepare('SELECT COUNT(*) AS c FROM placement_drives').get().c;
  const openDrives = db.prepare("SELECT COUNT(*) AS c FROM placement_drives WHERE status = 'open'").get().c;
  const totalApplications = db.prepare('SELECT COUNT(*) AS c FROM placement_applications').get().c;
  const totalOffers = db.prepare('SELECT COUNT(*) AS c FROM placement_offers').get().c;
  const acceptedOffers = db.prepare("SELECT COUNT(*) AS c FROM placement_offers WHERE status = 'accepted'").get().c;
  const avgCtc = db.prepare("SELECT AVG(ctc_lpa) AS a FROM placement_offers WHERE ctc_lpa IS NOT NULL").get().a;
  const highestCtc = db.prepare('SELECT MAX(ctc_lpa) AS m FROM placement_offers').get().m;

  const totalEligibleStudents = db.prepare('SELECT COUNT(*) AS c FROM students').get().c;
  const placedStudents = db.prepare("SELECT COUNT(DISTINCT student_id) AS c FROM placement_offers WHERE status = 'accepted'").get().c;

  res.json({
    totalDrives, openDrives, totalApplications, totalOffers, acceptedOffers,
    averageCtcLpa: avgCtc ? Math.round(avgCtc * 100) / 100 : null,
    highestCtcLpa: highestCtc,
    placementRate: totalEligibleStudents ? Math.round((placedStudents / totalEligibleStudents) * 1000) / 10 : 0,
    placedStudents,
    totalEligibleStudents
  });
}

/** GET /api/placement/stats/by-company */
function statsByCompany(req, res) {
  const rows = db.prepare(`
    SELECT c.name AS company, COUNT(DISTINCT pa.id) AS applications,
      COUNT(DISTINCT o.id) AS offers,
      ROUND(AVG(o.ctc_lpa), 2) AS avg_ctc
    FROM companies c
    JOIN placement_drives d ON d.company_id = c.id
    LEFT JOIN placement_applications pa ON pa.drive_id = d.id
    LEFT JOIN placement_offers o ON o.drive_id = d.id
    GROUP BY c.name ORDER BY offers DESC
  `).all();
  res.json({ byCompany: rows });
}

/** GET /api/placement/stats/by-department */
function statsByDepartment(req, res) {
  const rows = db.prepare(`
    SELECT s.department, COUNT(DISTINCT s.id) AS total_students,
      COUNT(DISTINCT CASE WHEN o.status = 'accepted' THEN s.id END) AS placed_students,
      ROUND(AVG(CASE WHEN o.status = 'accepted' THEN o.ctc_lpa END), 2) AS avg_ctc
    FROM students s
    LEFT JOIN placement_offers o ON o.student_id = s.id
    GROUP BY s.department
  `).all();
  res.json({ byDepartment: rows });
}

// ===================== formatters =====================

function formatDrive(d) {
  return {
    id: d.id, title: d.title, description: d.description, companyName: d.company_name,
    driveDate: d.drive_date, applicationDeadline: d.application_deadline, mode: d.mode,
    roundsPlan: JSON.parse(d.rounds_plan_json || '[]'),
    minCgpa: d.min_cgpa, maxBacklogs: d.max_backlogs, graduationYear: d.graduation_year,
    branches: JSON.parse(d.branches_json || '[]'),
    packageMinLpa: d.package_min_lpa, packageMaxLpa: d.package_max_lpa,
    status: d.status, createdAt: d.created_at,
    applicationCount: d.application_count, offerCount: d.offer_count
  };
}

function formatApplication(a) {
  return {
    id: a.id, driveId: a.drive_id, studentId: a.student_id, studentName: a.student_name,
    studentCode: a.student_code, cgpa: a.cgpa, department: a.department,
    status: a.status, appliedAt: a.applied_at, notes: a.notes,
    driveTitle: a.drive_title, companyName: a.company_name
  };
}

function formatRound(r) {
  return {
    id: r.id, applicationId: r.application_id, roundName: r.round_name, roundType: r.round_type,
    sequence: r.sequence, status: r.status, score: r.score, maxScore: r.max_score,
    remarks: r.remarks, updatedAt: r.updated_at
  };
}

module.exports = {
  createDrive, listDrives, getDrive, updateDrive,
  applyToDrive, listDriveApplications, myApplications, updateApplicationStatus,
  listApplicationRounds, updateRound, scheduleInterview, updateSchedule,
  extendOffer, respondToOffer, listOffers,
  statsOverview, statsByCompany, statsByDepartment
};
