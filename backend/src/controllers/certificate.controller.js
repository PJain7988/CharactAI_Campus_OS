const db = require('../config/db');
const path = require('path');
const { computeAssessment, saveAssessment } = require('../services/aiAssessment.service');
const { buildNarrative } = require('../services/narrative.service');
const { generateCertificateCode, generateCertificatePdf, generateResumePdf } = require('../services/certificate.service');
const { auditLog } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

async function generate(req, res) {
  const { studentId } = req.params;
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ message: 'Not authorized.' });
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(studentId);
  if (!student || !user) return res.status(404).json({ message: 'Student not found.' });

  const certificateType = req.body.certificateType || 'Overall Holistic Development';

  const assessment = computeAssessment(studentId);
  saveAssessment(assessment);
  const narrative = buildNarrative(assessment, assessment.evidenceCounts);

  const certificateCode = generateCertificateCode(certificateType);
  const verifyBase = process.env.PUBLIC_VERIFY_BASE_URL || 'http://localhost:5173/verify';
  const verifyUrl = `${verifyBase}/${certificateCode}`;

  const filePath = await generateCertificatePdf({ student, user, assessment, narrative, certificateCode, verifyUrl, certificateType });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO certificates (id, certificate_code, student_id, overall_score, narrative, file_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, certificateCode, studentId, assessment.overall, narrative, filePath);

  auditLog(req.user.id, 'generate_certificate', 'certificate', id, { certificateCode });

  res.status(201).json({
    certificateId: id,
    certificateCode,
    verifyUrl,
    downloadUrl: `/api/certificates/${certificateCode}/download`,
    overallScore: assessment.overall
  });
}

async function generateResume(req, res) {
  const { studentId } = req.params;
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ message: 'Not authorized.' });
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(studentId);
  if (!student || !user) return res.status(404).json({ message: 'Student not found.' });

  const activities = db.prepare(`
    SELECT a.*, c.name as category_name
    FROM activities a
    JOIN activity_categories c ON c.id = a.category_id
    WHERE a.student_id = ?
    ORDER BY a.activity_date DESC
  `).all(studentId);

  const assessment = computeAssessment(studentId);

  try {
    const filePath = await generateResumePdf({ student, user, assessment, activities });
    const filename = path.basename(filePath);
    
    auditLog(req.user.id, 'generate_resume', 'student', studentId, { filename });
    
    res.status(201).json({
      message: 'Resume generated successfully',
      downloadUrl: `/api/certificates/resume/${filename}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate resume.' });
  }
}

function download(req, res) {
  const { code } = req.params;
  const cert = db.prepare('SELECT * FROM certificates WHERE certificate_code = ?').get(code);
  if (!cert) return res.status(404).json({ message: 'Certificate not found.' });
  res.download(path.resolve(cert.file_path), `${code}.pdf`);
}

function downloadResume(req, res) {
  const { filename } = req.params;
  const { certDir } = require('../services/certificate.service');
  res.download(path.resolve(certDir, filename), filename);
}

/** Public endpoint — no auth. Returns only privacy-safe fields (Section 29). */
function verify(req, res) {
  const { code } = req.params;
  const cert = db.prepare(`
    SELECT c.certificate_code, c.overall_score, c.issued_at, s.program, s.admission_year, s.graduation_year,
           u.name
    FROM certificates c
    JOIN students s ON s.id = c.student_id
    JOIN users u ON u.id = s.id
    WHERE c.certificate_code = ?
  `).get(code);

  if (!cert) return res.status(404).json({ verified: false, message: 'Certificate not found.' });

  res.json({
    verified: true,
    certificateId: cert.certificate_code,
    studentName: cert.name,
    program: cert.program,
    academicPeriod: `${cert.admission_year}-${cert.graduation_year}`,
    issuedYear: new Date(cert.issued_at).getFullYear(),
    overallScore: cert.overall_score
  });
}

function myCertificates(req, res) {
  const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;
  const certs = db.prepare('SELECT * FROM certificates WHERE student_id = ? ORDER BY issued_at DESC').all(studentId);
  res.json({ certificates: certs });
}

module.exports = { generate, generateResume, download, downloadResume, verify, myCertificates };
