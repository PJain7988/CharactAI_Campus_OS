/**
 * Template-based narrative generation (Section 24: "LLM Integration").
 *
 * The brief is explicit that an LLM should generate the *prose*, never the
 * *scores* — "ML/Rules -> Evidence-based assessment -> LLM -> Professional
 * narrative". This module is a deterministic, dependency-free stand-in for
 * that LLM call, built from the same structured evidence an LLM prompt would
 * receive. Swap `buildNarrative` for a real LLM API call (see
 * docs/ARCHITECTURE.md § LLM Integration) without touching anything upstream —
 * the scoring pipeline stays identical either way.
 */
function buildNarrative(assessment, evidenceCounts) {
  const top = assessment.strengths;
  const focus = assessment.developmentAreas.filter(d => assessment.scores[d] < 70);

  const strengthPhrase = top.length
    ? `demonstrated consistent engagement across ${top.join(', ')} activities`
    : 'begun building a verified activity record';

  const evidenceBits = [];
  if (evidenceCounts.learning) evidenceBits.push(`${evidenceCounts.learning} verified learning activities`);
  if (evidenceCounts.technical) evidenceBits.push(`${evidenceCounts.technical} technical activities`);
  if (evidenceCounts.leadership) evidenceBits.push(`${evidenceCounts.leadership} leadership activities`);
  if (evidenceCounts.social) evidenceBits.push(`${evidenceCounts.social} community activities`);

  const evidenceSentence = evidenceBits.length
    ? ` This is supported by ${evidenceBits.join(', ')}, all verified by faculty.`
    : '';

  const focusSentence = focus.length
    ? ` Continued growth in ${focus.join(' and ')} is recommended going forward.`
    : ' The student maintains balanced engagement across development dimensions.';

  return (
    `The student ${strengthPhrase} throughout the academic program.` +
    `${evidenceSentence}` +
    `${focusSentence}`
  );
}

module.exports = { buildNarrative };
