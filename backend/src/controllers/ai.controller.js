const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { computeAssessment, saveAssessment, buildRecommendations } = require('../services/aiAssessment.service');
const { buildNarrative } = require('../services/narrative.service');
const { auditLog } = require('../utils/logger');

function checkAccess(req, studentId) {
  return req.user.role !== 'student' || req.user.id === studentId;
}

/** POST /api/ai/assessment/:studentId - run and persist a fresh assessment */
function runAssessment(req, res) {
  const { studentId } = req.params;
  if (!checkAccess(req, studentId)) return res.status(403).json({ message: 'Not authorized.' });

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  const assessment = computeAssessment(studentId);
  const assessmentId = saveAssessment(assessment);
  auditLog(req.user.id, 'generate_assessment', 'ai_assessment', assessmentId, { overall: assessment.overall });

  res.status(201).json({ assessmentId, assessment });
}

/** GET /api/ai/assessment/:studentId - latest saved assessment */
function getLatestAssessment(req, res) {
  const { studentId } = req.params;
  if (!checkAccess(req, studentId)) return res.status(403).json({ message: 'Not authorized.' });

  const row = db.prepare(`
    SELECT * FROM ai_assessments WHERE student_id = ? ORDER BY generated_at DESC LIMIT 1
  `).get(studentId);
  if (!row) return res.status(404).json({ message: 'No assessment generated yet.' });

  res.json({ assessment: formatAssessmentRow(row) });
}

/** GET /api/ai/insights/:studentId - explainable breakdown + narrative */
function getInsights(req, res) {
  const { studentId } = req.params;
  if (!checkAccess(req, studentId)) return res.status(403).json({ message: 'Not authorized.' });

  const assessment = computeAssessment(studentId);
  const narrative = buildNarrative(assessment, assessment.evidenceCounts);
  res.json({ assessment, narrative });
}

/** GET /api/ai/recommendations/:studentId */
function getRecommendations(req, res) {
  const { studentId } = req.params;
  if (!checkAccess(req, studentId)) return res.status(403).json({ message: 'Not authorized.' });

  const assessment = computeAssessment(studentId);
  const recs = buildRecommendations(assessment);
  res.json({ recommendations: recs, assessment: { scores: assessment.scores, overall: assessment.overall } });
}

/** GET /api/ai/growth/:studentId - year-wise development growth (Section 26) */
function getGrowth(req, res) {
  const { studentId } = req.params;
  if (!checkAccess(req, studentId)) return res.status(403).json({ message: 'Not authorized.' });

  const years = [1, 2, 3, 4];
  const growth = years.map(year => {
    const assessment = computeAssessment(studentId, { academicYear: year });
    return { year, overall: assessment.overall, scores: assessment.scores };
  });
  res.json({ growth });
}

function formatAssessmentRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    academicYear: row.academic_year,
    scores: {
      academic: row.academic_score, learning: row.learning_score, technical: row.technical_score,
      leadership: row.leadership_score, teamwork: row.teamwork_score, discipline: row.discipline_score,
      creativity: row.creativity_score, sports: row.sports_score, social: row.social_score,
      extracurricular: row.extracurricular_score
    },
    overall: row.overall_score,
    strengths: JSON.parse(row.strengths_json || '[]'),
    developmentAreas: JSON.parse(row.development_areas_json || '[]'),
    explanation: JSON.parse(row.explanation_json || '{}'),
    modelVersion: row.model_version,
    generatedAt: row.generated_at
  };
}

module.exports = { runAssessment, getLatestAssessment, getInsights, getRecommendations, getGrowth };
