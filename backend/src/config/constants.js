// Development dimensions tracked across the platform
const DIMENSIONS = [
  'discipline',
  'consistency',
  'learning_orientation',
  'leadership',
  'teamwork',
  'technical_engagement',
  'academic_engagement',
  'community_participation',
  'creativity',
  'extracurricular_involvement',
  'personal_development'
];

// Default weights for the overall holistic development score.
// Institution admins can override these.
const DEFAULT_DIMENSION_WEIGHTS = {
  discipline:                  0.10,
  consistency:                 0.10,
  learning_orientation:        0.10,
  leadership:                  0.09,
  teamwork:                    0.09,
  technical_engagement:        0.12,
  academic_engagement:         0.12,
  community_participation:     0.07,
  creativity:                  0.06,
  extracurricular_involvement: 0.05,
  personal_development:        0.10
};

// Default recruitment scoring weights
const DEFAULT_RECRUITMENT_WEIGHTS = {
  resumeMatch:         0.25,
  interview:           0.30,
  problemSolving:      0.20,
  academics:           0.10,
  verifiedDevelopment: 0.10,
  communication:       0.05
};

const MODEL_VERSION = 'charactai-rules-engine-v2.0';

module.exports = {
  DIMENSIONS,
  DEFAULT_DIMENSION_WEIGHTS,
  DEFAULT_RECRUITMENT_WEIGHTS,
  MODEL_VERSION
};
