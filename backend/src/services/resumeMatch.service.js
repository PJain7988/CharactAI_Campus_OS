/**
 * Resume <-> Job Description matching.
 *
 * Implements Section 5 ("AI Resume-JD Matching") of the recruitment brief using a
 * dependency-free TF-IDF + cosine similarity model — a well-understood, explainable
 * baseline that the brief explicitly allows ("TF-IDF as a baseline"). The Python
 * ai-service shows how this would be upgraded to sentence-embedding based semantic
 * matching for production use.
 *
 * Skill extraction is keyword/alias based (Section 4/28: "AI extracts... Technical
 * Skills / Soft Skills"), which keeps the whole pipeline auditable — every match is
 * traceable to the exact terms found in both documents (Section 26, "Explainable
 * Recruitment AI").
 */

const SKILL_TAXONOMY = {
  'c++': ['c++', 'cpp'],
  'c': [' c programming', 'c language'],
  'java': ['java'],
  'python': ['python'],
  'javascript': ['javascript', 'js'],
  'typescript': ['typescript', 'ts'],
  'react': ['react', 'react.js', 'reactjs'],
  'node.js': ['node.js', 'nodejs', 'node'],
  'express': ['express', 'express.js'],
  'mongodb': ['mongodb', 'mongo'],
  'sql': ['sql', 'mysql', 'postgresql', 'postgres'],
  'dbms': ['dbms', 'database management'],
  'dsa': ['dsa', 'data structures', 'algorithms'],
  'oop': ['oop', 'object oriented', 'object-oriented'],
  'rest apis': ['rest api', 'rest apis', 'restful'],
  'git': ['git', 'github'],
  'docker': ['docker'],
  'aws': ['aws', 'amazon web services'],
  'machine learning': ['machine learning', 'ml '],
  'html/css': ['html', 'css'],
  'communication': ['communication'],
  'problem solving': ['problem solving', 'problem-solving'],
  'teamwork': ['teamwork', 'team work', 'collaboration'],
  'leadership': ['leadership']
};

const SOFT_SKILLS = new Set(['communication', 'problem solving', 'teamwork', 'leadership']);

function extractSkills(text) {
  const lower = ` ${text.toLowerCase()} `;
  const found = new Set();
  for (const [canonical, aliases] of Object.entries(SKILL_TAXONOMY)) {
    if (aliases.some(alias => lower.includes(alias))) found.add(canonical);
  }
  return [...found];
}

function splitSkillTypes(skills) {
  const technical = skills.filter(s => !SOFT_SKILLS.has(s));
  const soft = skills.filter(s => SOFT_SKILLS.has(s));
  return { technical, soft };
}

// ---- Lightweight TF-IDF + cosine similarity over the full resume/JD corpus ----

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function buildTfidfVectors(documents) {
  // documents: array of raw strings
  const tokenizedDocs = documents.map(tokenize);
  const df = new Map();
  tokenizedDocs.forEach(tokens => {
    new Set(tokens).forEach(t => df.set(t, (df.get(t) || 0) + 1));
  });
  const N = documents.length;

  return tokenizedDocs.map(tokens => {
    const tf = new Map();
    tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    const vec = new Map();
    tf.forEach((count, term) => {
      const idf = Math.log((N + 1) / ((df.get(term) || 1) + 1)) + 1;
      vec.set(term, (count / tokens.length) * idf);
    });
    return vec;
  });
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, magA = 0, magB = 0;
  vecA.forEach((val, key) => {
    magA += val * val;
    if (vecB.has(key)) dot += val * vecB.get(key);
  });
  vecB.forEach(val => { magB += val * val; });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Matches a single resume against a JD, returning a 0-100 score plus
 * explainable matched/missing skill lists.
 */
function matchResumeToJob(resumeText, jobDescriptionText, requiredSkills) {
  const [resumeVec, jdVec] = buildTfidfVectors([resumeText, jobDescriptionText]);
  const semanticSimilarity = cosineSimilarity(resumeVec, jdVec); // 0..1

  const resumeSkills = new Set(extractSkills(resumeText));
  const matchedSkills = requiredSkills.filter(s => resumeSkills.has(s));
  const missingSkills = requiredSkills.filter(s => !resumeSkills.has(s));
  const skillCoverage = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 0;

  // Blend: 60% explicit skill coverage (precise, explainable) + 40% semantic similarity
  const score = Math.round((0.6 * skillCoverage + 0.4 * semanticSimilarity) * 1000) / 10;

  return {
    score: Math.min(100, score),
    matchedSkills,
    missingSkills,
    semanticSimilarity: Math.round(semanticSimilarity * 1000) / 10
  };
}

module.exports = { extractSkills, splitSkillTypes, matchResumeToJob, tokenize, buildTfidfVectors, cosineSimilarity };
