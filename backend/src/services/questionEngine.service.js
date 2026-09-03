const db = require('../config/db');

/**
 * AI Mock Interview Question Engine (Sections 10-16 of the recruitment brief).
 *
 * Selects a personalized 6-8 question, ~7-minute interview from the question bank,
 * combining: JD requirements, resume/matched skills, and (for the adaptive flow)
 * the candidate's running performance. Topic weighting favours skills that are
 * BOTH in the resume and the JD (a genuinely relevant, personalized question set —
 * Section 13's "personalized project question" idea is approximated here by biasing
 * toward the candidate's strongest matched topics).
 */

const INTERVIEW_STRUCTURE = [
  { slot: 'introduction', topic: 'HR', difficulty: 'easy' },
  { slot: 'resume', topic: 'Resume', difficulty: 'easy' },
  { slot: 'technical_1', topic: null, difficulty: 'easy' },   // filled from matched skills
  { slot: 'technical_2', topic: null, difficulty: 'medium' },
  { slot: 'jd_specific', topic: null, difficulty: 'medium' },
  { slot: 'problem_solving', topic: 'DSA', difficulty: 'hard' },
  { slot: 'behavioral', topic: 'Behavioral', difficulty: 'medium' }
];

function pickQuestion(topic, difficulty, excludeIds) {
  const row = db.prepare(`
    SELECT * FROM question_bank
    WHERE topic = ? AND difficulty = ? AND id NOT IN (${excludeIds.map(() => '?').join(',') || "''"})
    ORDER BY RANDOM() LIMIT 1
  `).get(topic, difficulty, ...excludeIds);
  return row;
}

function pickAnyQuestion(topics, difficulty, excludeIds) {
  if (!topics.length) topics = ['HR'];
  const placeholders = topics.map(() => '?').join(',');
  const row = db.prepare(`
    SELECT * FROM question_bank
    WHERE topic IN (${placeholders}) AND difficulty = ? AND id NOT IN (${excludeIds.map(() => '?').join(',') || "''"})
    ORDER BY RANDOM() LIMIT 1
  `).get(...topics, difficulty, ...excludeIds);
  return row;
}

/**
 * @param {string[]} matchedSkills - skills present in both resume and JD (canonical form)
 * @param {string[]} requiredSkills - all required JD skills
 */
function generateInterviewQuestions(matchedSkills, requiredSkills) {
  const topicFromSkill = (skill) => {
    const map = {
      'c++': 'C++', dsa: 'DSA', java: 'Java', python: 'Python',
      javascript: 'JavaScript', react: 'React', 'node.js': 'Node.js',
      sql: 'SQL', dbms: 'DBMS', oop: 'OOP', 'rest apis': 'REST'
    };
    return map[skill] || null;
  };

  const strongTopics = matchedSkills.map(topicFromSkill).filter(Boolean);
  const jdTopics = requiredSkills.map(topicFromSkill).filter(Boolean);

  const used = [];
  const questions = [];

  for (const slot of INTERVIEW_STRUCTURE) {
    let topic = slot.topic;
    let picked = null;

    if (slot.slot === 'technical_1') {
      picked = pickAnyQuestion(strongTopics.length ? strongTopics : jdTopics, slot.difficulty, used);
    } else if (slot.slot === 'technical_2') {
      picked = pickAnyQuestion(strongTopics.length ? strongTopics : jdTopics, slot.difficulty, used);
    } else if (slot.slot === 'jd_specific') {
      picked = pickAnyQuestion(jdTopics, slot.difficulty, used);
    } else {
      picked = pickQuestion(topic, slot.difficulty, used);
    }

    if (picked) {
      used.push(picked.id);
      questions.push({
        slot: slot.slot,
        questionId: picked.id,
        topic: picked.topic,
        difficulty: picked.difficulty,
        question: picked.question,
        expectedConcepts: JSON.parse(picked.expected_concepts_json || '[]')
      });
    }
  }

  return questions;
}

/**
 * Adaptive follow-up: given the last answer's concept-hit-ratio, decide the next
 * difficulty (Section 16, "Adaptive Interview Difficulty").
 */
function nextDifficulty(currentDifficulty, conceptHitRatio) {
  const order = ['easy', 'medium', 'hard'];
  const idx = order.indexOf(currentDifficulty);
  if (conceptHitRatio >= 0.7 && idx < order.length - 1) return order[idx + 1];
  if (conceptHitRatio < 0.4 && idx > 0) return order[idx - 1];
  return currentDifficulty;
}

module.exports = { generateInterviewQuestions, nextDifficulty };
