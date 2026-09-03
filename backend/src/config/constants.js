// Development dimensions tracked across the platform
const DIMENSIONS = [
  'academic',       // Assignments, exams, presentations, papers
  'learning',       // Library visits, books read, online courses, seminars
  'classroom',      // Daily attendance, participation, lab engagement
  'technical',      // Projects, hackathons, certifications, internships
  'leadership',     // Club roles, organizing, mentoring, coordinating
  'teamwork',       // Group projects, hackathon teams, collaborative tasks
  'discipline',     // Attendance regularity, consistency, punctuality
  'creativity',     // Cultural, arts, design, ideation activities
  'sports',         // Sports practice, tournaments, fitness, game skills
  'events',         // College/inter-college/national event participation
  'social',         // Volunteering, NGO, community service
  'extracurricular' // Clubs, miscellaneous enrichment activities
];

// Default weights for the overall holistic development score.
// Institution admins can override these.
const DEFAULT_DIMENSION_WEIGHTS = {
  academic:        0.14,
  learning:        0.10,
  classroom:       0.10,
  technical:       0.13,
  leadership:      0.10,
  teamwork:        0.08,
  discipline:      0.09,
  creativity:      0.05,
  sports:          0.07,
  events:          0.06,
  social:          0.05,
  extracurricular: 0.03
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
