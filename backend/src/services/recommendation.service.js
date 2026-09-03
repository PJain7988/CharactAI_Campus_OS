const { DEFAULT_RECRUITMENT_WEIGHTS } = require('../config/constants');

/**
 * Final candidate ranking (Section 22-26 of the recruitment brief).
 * Combines resume/JD match, interview performance, academics, and the
 * student's own verified holistic-development score — never resume/interview
 * alone (Section 7: "Don't use resume score alone").
 *
 * Every score is returned with an explanation object so the recruiter dashboard
 * can show "Why recommended?" / "Missing requirements" (Section 26).
 */
function computeCandidateScore({
  resumeMatchScore,      // 0-100
  interviewOverallScore, // 0-100
  problemSolvingScore,   // 0-100
  cgpa,                  // 0-10
  verifiedDevelopmentScore, // 0-100 (from ai_assessments.overall_score)
  communicationScore,    // 0-100
  weights = DEFAULT_RECRUITMENT_WEIGHTS
}) {
  const academicsNormalized = Math.min(100, (cgpa / 10) * 100);

  const overall =
    weights.resumeMatch * resumeMatchScore +
    weights.interview * interviewOverallScore +
    weights.problemSolving * problemSolvingScore +
    weights.academics * academicsNormalized +
    weights.verifiedDevelopment * (verifiedDevelopmentScore || 0) +
    weights.communication * (communicationScore || 0);

  return Math.round(overall * 10) / 10;
}

function buildExplanation({ matchedSkills, missingSkills, interviewOverallScore, hackathons, projects, internships }) {
  const positives = [];
  if (matchedSkills && matchedSkills.length) positives.push(`Strong ${matchedSkills.slice(0, 4).join(', ')} skill match`);
  if (projects) positives.push(`${projects} relevant verified project${projects === 1 ? '' : 's'}`);
  if (hackathons) positives.push(`${hackathons} hackathon${hackathons === 1 ? '' : 's'}`);
  if (internships) positives.push(`${internships} internship${internships === 1 ? '' : 's'}`);
  if (interviewOverallScore >= 75) positives.push('High interview performance');

  const gaps = (missingSkills || []).map(s => `Limited/no ${s} experience`);

  return { positives, gaps };
}

module.exports = { computeCandidateScore, buildExplanation };
