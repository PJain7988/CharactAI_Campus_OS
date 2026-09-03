const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { extractSkills, splitSkillTypes, matchResumeToJob } = require('../services/resumeMatch.service');
const { generateInterviewQuestions, nextDifficulty } = require('../services/questionEngine.service');
const { scoreAnswer, aggregateInterview, buildFeedback } = require('../services/interviewEvaluation.service');
const { computeCandidateScore, buildExplanation } = require('../services/recommendation.service');
const { DEFAULT_RECRUITMENT_WEIGHTS } = require('../config/constants');
const { auditLog } = require('../utils/logger');

/** POST /api/recruitment/jobs — company uploads a JD (Section 4) */
function createJob(req, res) {
  const { title, description, minCgpa, maxBacklogs, graduationYear, branches, shortlistSize, weights, companyName } = req.body;
  if (!title || !description) return res.status(400).json({ message: 'title and description are required.' });

  let company = db.prepare('SELECT * FROM companies WHERE recruiter_user_id = ?').get(req.user.id);
  if (!company) {
    const companyId = uuidv4();
    db.prepare('INSERT INTO companies (id, name, recruiter_user_id) VALUES (?, ?, ?)')
      .run(companyId, companyName || `${req.user.name}'s Company`, req.user.id);
    company = { id: companyId };
  }

  const allSkills = extractSkills(description);
  const { technical, soft } = splitSkillTypes(allSkills);

  const jobId = uuidv4();
  db.prepare(`
    INSERT INTO jobs (
      id, company_id, title, description, required_skills_json, soft_skills_json,
      min_cgpa, max_backlogs, graduation_year, branches_json, weights_json, shortlist_size
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    jobId, company.id, title, description, JSON.stringify(technical), JSON.stringify(soft),
    minCgpa || 0, maxBacklogs ?? 0, graduationYear || null, JSON.stringify(branches || []),
    JSON.stringify(weights || DEFAULT_RECRUITMENT_WEIGHTS), shortlistSize || 100
  );

  auditLog(req.user.id, 'create_job', 'job', jobId, { title, technical, soft });
  res.status(201).json({ jobId, requiredSkills: technical, softSkills: soft });
}

function listJobs(req, res) {
  const jobs = db.prepare(`
    SELECT j.*, c.name AS company_name FROM jobs j JOIN companies c ON c.id = j.company_id
    ORDER BY j.created_at DESC
  `).all().map(formatJob);
  res.json({ jobs });
}

function getJob(req, res) {
  const job = db.prepare(`
    SELECT j.*, c.name AS company_name FROM jobs j JOIN companies c ON c.id = j.company_id WHERE j.id = ?
  `).get(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found.' });
  res.json({ job: formatJob(job) });
}

/**
 * POST /api/recruitment/jobs/:id/run-matching
 * Runs the full eligibility -> resume/JD match -> shortlist pipeline (Sections 4-8).
 */
function runMatching(req, res) {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found.' });

  const requiredSkills = JSON.parse(job.required_skills_json || '[]');
  const branches = JSON.parse(job.branches_json || '[]');

  const candidates = db.prepare(`
    SELECT s.*, u.name, r.raw_text AS resume_text
    FROM students s
    JOIN users u ON u.id = s.id
    LEFT JOIN resumes r ON r.student_id = s.id
  `).all();

  const results = [];
  for (const c of candidates) {
    const eligible =
      (c.cgpa || 0) >= (job.min_cgpa || 0) &&
      (c.backlogs || 0) <= (job.max_backlogs ?? 999) &&
      (!job.graduation_year || c.graduation_year === job.graduation_year) &&
      (!branches.length || branches.includes(c.department));

    let matchScore = 0, matchedSkills = [], missingSkills = requiredSkills;
    if (c.resume_text) {
      const match = matchResumeToJob(c.resume_text, job.description, requiredSkills);
      matchScore = match.score;
      matchedSkills = match.matchedSkills;
      missingSkills = match.missingSkills;
    }

    const id = uuidv4();
    const stage = eligible ? 'screened' : 'rejected';
    db.prepare(`
      INSERT INTO candidate_matches (
        id, job_id, student_id, eligible, resume_match_score, matched_skills_json,
        missing_skills_json, stage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(job_id, student_id) DO UPDATE SET
        eligible = excluded.eligible,
        resume_match_score = excluded.resume_match_score,
        matched_skills_json = excluded.matched_skills_json,
        missing_skills_json = excluded.missing_skills_json,
        stage = excluded.stage
    `).run(id, job.id, c.id, eligible ? 1 : 0, matchScore, JSON.stringify(matchedSkills), JSON.stringify(missingSkills), stage);

    results.push({ studentId: c.id, name: c.name, eligible, matchScore, matchedSkills, missingSkills });
  }

  // Shortlist: top N eligible by match score
  const eligibleSorted = results.filter(r => r.eligible).sort((a, b) => b.matchScore - a.matchScore);
  const shortlisted = eligibleSorted.slice(0, job.shortlist_size);
  const shortlistIds = new Set(shortlisted.map(s => s.studentId));

  const updateStage = db.prepare(`UPDATE candidate_matches SET stage = 'shortlisted' WHERE job_id = ? AND student_id = ?`);
  shortlisted.forEach(s => updateStage.run(job.id, s.studentId));

  auditLog(req.user.id, 'run_matching', 'job', job.id, {
    totalCandidates: candidates.length, eligible: eligibleSorted.length, shortlisted: shortlisted.length
  });

  res.json({
    totalCandidates: candidates.length,
    eligibleCount: eligibleSorted.length,
    shortlistedCount: shortlisted.length,
    shortlisted: shortlisted.map(s => ({ studentId: s.studentId, name: s.name, matchScore: s.matchScore }))
  });
}

function getCandidates(req, res) {
  const { id } = req.params; // job id
  const { stage } = req.query;
  let query = `
    SELECT cm.*, u.name, s.cgpa, s.department
    FROM candidate_matches cm
    JOIN students s ON s.id = cm.student_id
    JOIN users u ON u.id = s.id
    WHERE cm.job_id = ?
  `;
  const params = [id];
  if (stage) { query += ' AND cm.stage = ?'; params.push(stage); }
  query += ' ORDER BY cm.overall_score DESC, cm.resume_match_score DESC';

  const rows = db.prepare(query).all(...params).map(formatCandidate);
  res.json({ candidates: rows });
}

/** GET /api/recruitment/jobs/:id/candidates/:studentId/explain — "Why recommended?" (Section 26) */
function explainCandidate(req, res) {
  const { id, studentId } = req.params;
  const cm = db.prepare('SELECT * FROM candidate_matches WHERE job_id = ? AND student_id = ?').get(id, studentId);
  if (!cm) return res.status(404).json({ message: 'No match record for this candidate/job.' });
  res.json({ explanation: JSON.parse(cm.explanation_json || '{}'), candidate: formatCandidate(cm) });
}

/** POST /api/recruitment/jobs/:id/candidates/:studentId/start-interview */
function startInterview(req, res) {
  const { id: jobId, studentId } = req.params;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found.' });

  const cm = db.prepare('SELECT * FROM candidate_matches WHERE job_id = ? AND student_id = ?').get(jobId, studentId);
  const matchedSkills = cm ? JSON.parse(cm.matched_skills_json || '[]') : [];
  const requiredSkills = JSON.parse(job.required_skills_json || '[]');

  const questions = generateInterviewQuestions(matchedSkills, requiredSkills);

  const interviewId = uuidv4();
  db.prepare(`
    INSERT INTO interviews (id, job_id, student_id, status, started_at) VALUES (?, ?, ?, 'pending', datetime('now'))
  `).run(interviewId, jobId, studentId);

  if (cm) db.prepare(`UPDATE candidate_matches SET interview_id = ? WHERE id = ?`).run(interviewId, cm.id);

  auditLog(req.user.id, 'start_interview', 'interview', interviewId, { jobId, studentId });
  res.status(201).json({ interviewId, questions });
}

/** POST /api/recruitment/interviews/:interviewId/answer */
function submitAnswer(req, res) {
  const { interviewId } = req.params;
  const { questionId, difficulty, slot, topic, answerText, sequence, expectedConcepts } = req.body;

  const { conceptHitRatio, score } = scoreAnswer(answerText, expectedConcepts);
  const wordCount = (answerText || '').trim().split(/\s+/).filter(Boolean).length;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO interview_answers (id, interview_id, question_id, slot, difficulty, answer_text, concept_hit_ratio, score, sequence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, interviewId, questionId, slot || null, difficulty, answerText, conceptHitRatio, score, sequence || 0);

  const suggestedNextDifficulty = nextDifficulty(difficulty, conceptHitRatio);

  res.json({ score, conceptHitRatio, suggestedNextDifficulty, slot, topic, wordCount });
}

/** POST /api/recruitment/interviews/:interviewId/complete */
function completeInterview(req, res) {
  const { interviewId } = req.params;
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(interviewId);
  if (!interview) return res.status(404).json({ message: 'Interview not found.' });

  const answers = db.prepare(`
    SELECT ia.*, qb.topic FROM interview_answers ia
    JOIN question_bank qb ON qb.id = ia.question_id
    WHERE ia.interview_id = ? ORDER BY ia.sequence
  `).all(interviewId);

  const enriched = answers.map(a => ({
    slot: a.slot,
    topic: a.topic,
    score: a.score,
    wordCount: (a.answer_text || '').trim().split(/\s+/).filter(Boolean).length
  }));

  const agg = aggregateInterview(enriched.length ? enriched : [{ slot: 'general', score: 0, wordCount: 0 }]);
  const strongest = enriched.slice().sort((a, b) => b.score - a.score)[0];
  const weakest = enriched.slice().sort((a, b) => a.score - b.score)[0];
  const feedback = buildFeedback(agg, strongest && strongest.topic, weakest && weakest.topic);

  db.prepare(`
    UPDATE interviews SET status = 'completed', technical_score = ?, problem_solving_score = ?,
      communication_score = ?, behavioral_score = ?, resume_knowledge_score = ?,
      overall_interview_score = ?, feedback_json = ?, completed_at = datetime('now')
    WHERE id = ?
  `).run(agg.technical, agg.problemSolving, agg.communication, agg.behavioral, agg.resumeKnowledge,
    agg.overall, JSON.stringify(feedback), interviewId);

  // Roll the interview result into the candidate_matches ranking
  const cm = db.prepare('SELECT * FROM candidate_matches WHERE interview_id = ?').get(interviewId);
  if (cm) {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(cm.student_id);
    const latestAssessment = db.prepare(`
      SELECT overall_score FROM ai_assessments WHERE student_id = ? ORDER BY generated_at DESC LIMIT 1
    `).get(cm.student_id);
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(cm.job_id);
    const weights = JSON.parse(job.weights_json || '{}');

    const overall = computeCandidateScore({
      resumeMatchScore: cm.resume_match_score,
      interviewOverallScore: agg.overall,
      problemSolvingScore: agg.problemSolving,
      cgpa: student.cgpa || 0,
      verifiedDevelopmentScore: latestAssessment ? latestAssessment.overall_score : 0,
      communicationScore: agg.communication,
      weights
    });

    const matchedSkills = JSON.parse(cm.matched_skills_json || '[]');
    const missingSkills = JSON.parse(cm.missing_skills_json || '[]');
    const explanation = buildExplanation({
      matchedSkills, missingSkills, interviewOverallScore: agg.overall,
      hackathons: 0, projects: 0, internships: 0
    });

    db.prepare(`
      UPDATE candidate_matches SET interview_score = ?, overall_score = ?, stage = 'interviewed', explanation_json = ?
      WHERE id = ?
    `).run(agg.overall, overall, JSON.stringify(explanation), cm.id);
  }

  res.json({ interviewId, scores: agg, feedback });
}

/** POST /api/recruitment/jobs/:id/finalize — marks top N as 'recommended' (human still decides hiring) */
function finalizeShortlist(req, res) {
  const { id } = req.params;
  const { topN } = req.body;
  const n = topN || 25;

  const interviewed = db.prepare(`
    SELECT * FROM candidate_matches WHERE job_id = ? AND stage = 'interviewed' ORDER BY overall_score DESC
  `).all(id);

  const top = interviewed.slice(0, n);
  const update = db.prepare(`UPDATE candidate_matches SET stage = 'recommended' WHERE id = ?`);
  top.forEach(c => update.run(c.id));

  auditLog(req.user.id, 'finalize_shortlist', 'job', id, { recommended: top.length });
  res.json({
    message: `Top ${top.length} candidates marked as recommended. Final hiring decision remains with the recruiter.`,
    recommended: top.map(formatCandidate)
  });
}

function uploadResume(req, res) {
  const studentId = req.user.role === 'student' ? req.user.id : req.body.studentId;
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Resume text is required.' });

  const skills = extractSkills(text);
  const existing = db.prepare('SELECT id FROM resumes WHERE student_id = ?').get(studentId);
  if (existing) {
    db.prepare('UPDATE resumes SET raw_text = ?, skills_json = ?, updated_at = datetime(\'now\') WHERE student_id = ?')
      .run(text, JSON.stringify(skills), studentId);
  } else {
    db.prepare('INSERT INTO resumes (id, student_id, raw_text, skills_json) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), studentId, text, JSON.stringify(skills));
  }
  res.json({ message: 'Resume saved.', extractedSkills: skills });
}

function formatJob(j) {
  return {
    id: j.id, title: j.title, description: j.description, companyName: j.company_name,
    requiredSkills: JSON.parse(j.required_skills_json || '[]'),
    softSkills: JSON.parse(j.soft_skills_json || '[]'),
    minCgpa: j.min_cgpa, maxBacklogs: j.max_backlogs, graduationYear: j.graduation_year,
    branches: JSON.parse(j.branches_json || '[]'), shortlistSize: j.shortlist_size,
    createdAt: j.created_at
  };
}

function formatCandidate(cm) {
  return {
    id: cm.id, studentId: cm.student_id, name: cm.name, cgpa: cm.cgpa, department: cm.department,
    eligible: !!cm.eligible, resumeMatchScore: cm.resume_match_score,
    matchedSkills: JSON.parse(cm.matched_skills_json || '[]'),
    missingSkills: JSON.parse(cm.missing_skills_json || '[]'),
    interviewScore: cm.interview_score, overallScore: cm.overall_score, stage: cm.stage,
    explanation: cm.explanation_json ? JSON.parse(cm.explanation_json) : null
  };
}

module.exports = {
  createJob, listJobs, getJob, runMatching, getCandidates, explainCandidate,
  startInterview, submitAnswer, completeInterview, finalizeShortlist, uploadResume
};
