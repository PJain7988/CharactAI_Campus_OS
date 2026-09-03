/**
 * Evaluates a single interview answer against expected concepts (Section 20),
 * and aggregates a full interview into multi-dimensional scores (Section 17).
 *
 * This is intentionally transcript/content based, never appearance based
 * (Section 18: "Don't judge facial appearance").
 */

function normalize(text) {
  return (text || '').toLowerCase();
}

/** Simple concept-hit scoring: fraction of expected concepts mentioned in the answer. */
function scoreAnswer(answerText, expectedConcepts) {
  if (!expectedConcepts || expectedConcepts.length === 0) {
    // Open-ended (HR/behavioral) questions: score on length/substance as a proxy
    const words = normalize(answerText).split(/\s+/).filter(Boolean).length;
    const ratio = Math.min(1, words / 40);
    return { conceptHitRatio: ratio, score: Math.round(ratio * 100) };
  }

  const text = normalize(answerText);
  const hits = expectedConcepts.filter(c => text.includes(normalize(c)));
  const ratio = hits.length / expectedConcepts.length;
  return { conceptHitRatio: ratio, score: Math.round(ratio * 100), hits };
}

/**
 * Aggregates per-answer scores into the 5 dimensions shown in Section 17:
 * Technical, Problem Solving, Communication, Behavioral, Resume Knowledge.
 */
function aggregateInterview(answers /* [{slot, topic, score, wordCount}] */) {
  const bySlot = Object.fromEntries(answers.map(a => [a.slot, a]));

  const technical = avg([bySlot.technical_1, bySlot.technical_2, bySlot.jd_specific].filter(Boolean).map(a => a.score));
  const problemSolving = bySlot.problem_solving ? bySlot.problem_solving.score : avg(answers.map(a => a.score));
  const behavioral = bySlot.behavioral ? bySlot.behavioral.score : avg(answers.map(a => a.score));
  const resumeKnowledge = bySlot.resume ? bySlot.resume.score : avg(answers.map(a => a.score));

  // Communication proxy: consistency + moderate length across all answers (structure over length)
  const communication = Math.round(
    avg(answers.map(a => Math.min(100, 40 + (a.wordCount || 20) * 1.2)))
  );

  const overall = Math.round(
    0.35 * technical + 0.25 * problemSolving + 0.15 * communication +
    0.15 * behavioral + 0.10 * resumeKnowledge
  );

  return {
    technical: round1(technical),
    problemSolving: round1(problemSolving),
    communication: Math.min(100, round1(communication)),
    behavioral: round1(behavioral),
    resumeKnowledge: round1(resumeKnowledge),
    overall: round1(overall)
  };
}

function avg(nums) {
  const arr = nums.filter(n => typeof n === 'number' && !Number.isNaN(n));
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function round1(n) { return Math.round(n * 10) / 10; }

function buildFeedback(agg, strongestSlot, weakestSlot) {
  return {
    strengths: `Strong performance in ${strongestSlot || 'technical'} responses.`,
    weaknesses: `Needs deeper preparation around ${weakestSlot || 'core fundamentals'}.`,
    communication: agg.communication >= 70
      ? 'Answers were clear and well structured.'
      : 'Answers were relevant but could be structured more clearly (try problem → approach → result).',
    recommendation: 'Practice explaining technical concepts using a problem → approach → result structure.'
  };
}

module.exports = { scoreAnswer, aggregateInterview, buildFeedback };
