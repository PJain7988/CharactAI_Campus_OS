const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { DIMENSIONS, DEFAULT_DIMENSION_WEIGHTS, MODEL_VERSION } = require('../config/constants');

/**
 * AI Development Assessment Engine  v2.0
 * ----------------------------------------
 * Converts ALL verified student activities into per-dimension scores (0-100),
 * a weighted overall score, and an explainable breakdown per dimension.
 *
 * New in v2: classroom attendance, library depth (books + hours), sports skill
 * tracking, event participation by level/role, and games strategy dimensions.
 */

// Category → dimension(s) mapping.
// A single activity category can boost multiple dimensions.
const CATEGORY_DIMENSION_MAP = {
  academic:       ['academic_engagement', 'consistency'],
  learning:       ['learning_orientation', 'personal_development'],
  library:        ['learning_orientation', 'consistency'],
  classroom:      ['discipline', 'consistency', 'academic_engagement'],
  technical:      ['technical_engagement', 'creativity'],
  sports:         ['discipline', 'teamwork', 'personal_development'],
  games:          ['creativity', 'personal_development'],
  cultural:       ['creativity', 'extracurricular_involvement'],
  leadership:     ['leadership', 'personal_development'],
  events:         ['extracurricular_involvement', 'learning_orientation'],
  social:         ['community_participation', 'teamwork'],
  teamwork:       ['teamwork', 'leadership'],
};

// Saturation points — how many verified activities approach near-max sub-score.
const SATURATION = {
  discipline:                   80,
  consistency:                  100,
  learning_orientation:         20,
  leadership:                   10,
  teamwork:                     15,
  technical_engagement:         15,
  academic_engagement:          30,
  community_participation:      12,
  creativity:                   15,
  extracurricular_involvement:  15,
  personal_development:         20,
};

function diminishingReturnsScore(count, saturationPoint, ceiling = 100) {
  if (count <= 0) return 0;
  const raw = ceiling * (1 - Math.exp(-count / saturationPoint));
  return Math.min(ceiling, Math.round(raw * 10) / 10);
}

function bonusForAchievement(achievement) {
  if (!achievement) return 0;
  const a = achievement.toLowerCase();
  if (a.includes('winner') || a.includes('1st') || a.includes('gold') || a.includes('champion')) return 10;
  if (a.includes('finalist') || a.includes('runner') || a.includes('silver')) return 6;
  if (a.includes('completed') || a.includes('approved') || a.includes('presented')) return 2;
  if (a.includes('participant')) return 1;
  return 2;
}

function bonusForRole(role) {
  if (!role) return 0;
  const r = role.toLowerCase();
  if (r.includes('lead') || r.includes('coordinator') || r.includes('organizer') || r.includes('captain') || r.includes('president')) return 7;
  if (r.includes('mentor') || r.includes('speaker')) return 6;
  if (r.includes('core') || r.includes('volunteer')) return 2;
  return 0;
}

// Extra bonus for high-level events
function bonusForEventLevel(detailsJson) {
  try {
    const d = typeof detailsJson === 'string' ? JSON.parse(detailsJson) : detailsJson;
    if (!d || !d.eventLevel) return 0;
    const level = d.eventLevel.toLowerCase();
    if (level.includes('international')) return 12;
    if (level.includes('national')) return 9;
    if (level.includes('state')) return 6;
    if (level.includes('inter')) return 4;   // inter-college
    return 0;
  } catch { return 0; }
}

// Extra weight for books read (depth of learning)
function bonusForBooksRead(detailsJson) {
  try {
    const d = typeof detailsJson === 'string' ? JSON.parse(detailsJson) : detailsJson;
    if (!d) return 0;
    if (d.bookTitle) return 3;              // library visit with specific book
    if (d.visitPurpose === 'study') return 1;
    return 0;
  } catch { return 0; }
}

/**
 * Core assessment computation.
 */
function computeAssessment(studentId, opts = {}) {
  const weights = opts.weights || DEFAULT_DIMENSION_WEIGHTS;
  const yearFilter = opts.academicYear ? 'AND a.academic_year = ?' : '';
  const params = opts.academicYear ? [studentId, opts.academicYear] : [studentId];

  const activities = db.prepare(`
    SELECT a.*, c.name AS category_name
    FROM activities a
    JOIN activity_categories c ON c.id = a.category_id
    WHERE a.student_id = ? AND a.verification_status = 'approved' ${yearFilter}
  `).all(...params);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);

  // Initialize evidence buckets
  const ev = {};
  DIMENSIONS.forEach(d => { ev[d] = { count: 0, bonus: 0, samples: [], books: 0, certs: 0, roles: 0, projects: 0 }; });

  for (const act of activities) {
    const dims = CATEGORY_DIMENSION_MAP[act.category_name] || [];
    let bonus = bonusForAchievement(act.achievement) + bonusForRole(act.role);

    // Category-specific bonuses & tracking
    if (act.category_name === 'events') bonus += bonusForEventLevel(act.details_json);
    
    let booksInAct = 0;
    if (['library', 'learning'].includes(act.category_name)) {
      bonus += bonusForBooksRead(act.details_json);
      try {
        const d = JSON.parse(act.details_json || '{}');
        if (d.bookTitle) booksInAct = 1;
      } catch {}
    }

    const isCert = act.title.toLowerCase().includes('certificat');
    const isProject = act.title.toLowerCase().includes('project') || act.title.toLowerCase().includes('hackathon');
    const hasRole = act.role && act.role.toLowerCase() !== 'participant';

    for (const dim of dims) {
      if (!ev[dim]) continue;
      ev[dim].count += 1;
      ev[dim].bonus += bonus;
      ev[dim].books += booksInAct;
      if (isCert) ev[dim].certs += 1;
      if (isProject) ev[dim].projects += 1;
      if (hasRole) ev[dim].roles += 1;
      if (ev[dim].samples.length < 5) ev[dim].samples.push(act.title);
    }
  }

  // Build scores + explanations
  const scores = {};
  const explanation = {};

  for (const dim of DIMENSIONS) {
    const e = ev[dim];
    const base = diminishingReturnsScore(e.count, SATURATION[dim]);
    const withBonus = Math.min(100, Math.round((base + e.bonus) * 10) / 10);
    scores[dim] = withBonus;

    if (e.count === 0) {
      explanation[dim] = `No verified ${dim} activities recorded yet.`;
    } else {
      const parts = [`${e.count} verified ${dim.replace(/_/g, ' ')}-related activit${e.count === 1 ? 'y' : 'ies'}`];
      if (e.books > 0) parts.push(`${e.books} books/research materials read`);
      if (e.certs > 0) parts.push(`${e.certs} certifications completed`);
      if (e.projects > 0) parts.push(`${e.projects} projects/hackathons`);
      if (e.roles > 0) parts.push(`${e.roles} leadership or core team roles`);

      const dimName = dim.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      explanation[dim] =
        `${dimName} score of ${withBonus}/100 ` +
        `was influenced by ${parts.join(', ')}.` +
        (e.samples.length ? ` Key examples include: ${e.samples.slice(0, 3).join(', ')}.` : '');
    }
  }

  // CGPA contribution to academic_engagement score
  if (student && student.cgpa) {
    const cgpaBonus = Math.round((student.cgpa / 10) * 15);
    scores.academic_engagement = Math.min(100, Math.round((scores.academic_engagement || 0) + cgpaBonus));
    explanation.academic_engagement += ` CGPA of ${student.cgpa} added ${cgpaBonus} bonus points.`;
  }

  const overall = Math.round(
    DIMENSIONS.reduce((sum, dim) => sum + (scores[dim] || 0) * (weights[dim] || 0), 0) * 10
  ) / 10;

  const ranked = DIMENSIONS.map(d => ({ dim: d, score: scores[d] })).sort((a, b) => b.score - a.score);
  const strengths = ranked.slice(0, 3).filter(r => r.score > 0).map(r => r.dim);
  const developmentAreas = ranked.slice(-3).map(r => r.dim);

  // Determine Archetype (Clustering Simulation)
  let archetype = 'Balanced Achiever';
  if (strengths.includes('technical_engagement') && strengths.includes('learning_orientation')) archetype = 'Technical Innovator';
  else if (strengths.includes('leadership') || strengths.includes('community_participation')) archetype = 'Community Leader';
  else if (strengths.includes('academic_engagement') && scores.academic_engagement > 80) archetype = 'Academic Scholar';
  else if (strengths.includes('extracurricular_involvement') || strengths.includes('creativity')) archetype = 'Creative All-Rounder';
  else if (scores.personal_development > 75) archetype = 'Growth Oriented';

  return {
    studentId,
    academicYear: opts.academicYear || 0,
    scores, overall, strengths, developmentAreas, explanation, archetype,
    modelVersion: MODEL_VERSION,
    evidenceCounts: Object.fromEntries(DIMENSIONS.map(d => [d, ev[d].count]))
  };
}

function saveAssessment(assessment) {
  const id = uuidv4();
  // Build dynamic column insertion that handles both old and new dimensions
  db.prepare(`
    INSERT INTO ai_assessments (
      id, student_id, academic_year,
      discipline_score, consistency_score, learning_orientation_score,
      leadership_score, teamwork_score, technical_engagement_score,
      academic_engagement_score, community_participation_score, creativity_score,
      extracurricular_involvement_score, personal_development_score,
      overall_score, strengths_json, development_areas_json, explanation_json, model_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, assessment.studentId, assessment.academicYear,
    assessment.scores.discipline, assessment.scores.consistency, assessment.scores.learning_orientation,
    assessment.scores.leadership, assessment.scores.teamwork, assessment.scores.technical_engagement,
    assessment.scores.academic_engagement, assessment.scores.community_participation, assessment.scores.creativity,
    assessment.scores.extracurricular_involvement, assessment.scores.personal_development,
    assessment.overall,
    JSON.stringify(assessment.strengths), JSON.stringify(assessment.developmentAreas),
    JSON.stringify(assessment.explanation), assessment.modelVersion
  );
  return id;
}

function buildRecommendations(assessment) {
  const suggestions = {
    discipline:                  'Improve attendance consistency and ensure timely submission of assignments and activities.',
    consistency:                 'Maintain a steady pace of activity logging across all categories rather than bursting.',
    learning_orientation:        'Increase library visits, read more books, or finish a new online certification.',
    leadership:                  'Take up a club coordinator or event-organizer role to build management skills.',
    teamwork:                    'Join a team-based project or a hackathon with a multi-person team.',
    technical_engagement:        'Contribute to an open-source project, write technical blogs, or join a hackathon.',
    academic_engagement:         'Aim for consistent assignment submissions and high marks in internal assessments.',
    community_participation:     'Volunteer for a community initiative, NGO campaign, or campus social service drive.',
    creativity:                  'Participate in a cultural, design, arts, or photography event this semester.',
    extracurricular_involvement: 'Diversify participation across clubs, non-technical workshops, and inter-college events.',
    personal_development:        'Focus on individual sports, soft-skills training, or independent learning initiatives.'
  };

  const developmentSuggestions = assessment.developmentAreas
    .filter(dim => assessment.scores[dim] < 70)
    .map(dim => ({ dimension: dim, score: assessment.scores[dim], suggestion: suggestions[dim] }));

  const narrative = assessment.strengths.length
    ? `The student demonstrates strong ${assessment.strengths.join(', ')} engagement. ` +
      (developmentSuggestions.length
        ? `Increasing participation in ${developmentSuggestions.map(s => s.dimension).join(', ')} would provide a more balanced development profile.`
        : `Continued consistency across all dimensions is recommended.`)
    : `Not enough verified activity yet to identify clear strengths — start logging activities and get them verified by your faculty.`;

  return { narrative, developmentSuggestions };
}

module.exports = { computeAssessment, saveAssessment, buildRecommendations };
