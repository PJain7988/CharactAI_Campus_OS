/* eslint-disable no-console */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { hashPassword } = require('../utils/password');

const CATEGORIES = [
  { name: 'academic',   description: 'Assignments, exams, results, presentations, academic competitions' },
  { name: 'library',    description: 'Library visits — books read, research articles, reading sessions' },
  { name: 'classroom',  description: 'Daily class attendance, participation, lab sessions, Q&A' },
  { name: 'learning',   description: 'Certifications, workshops, online courses, seminars, webinars' },
  { name: 'technical',  description: 'Projects, hackathons, coding competitions, open source, internships' },
  { name: 'sports',     description: 'Sport practice, fitness training, tournaments, achievements' },
  { name: 'games',      description: 'Strategy games, chess, indoor games — skills development' },
  { name: 'events',     description: 'College/inter-college/national/international events with role' },
  { name: 'cultural',   description: 'Dance, music, drama, debate, photography, creative writing' },
  { name: 'leadership', description: 'Club coordinator, organizer, team lead, mentor, president roles' },
  { name: 'social',     description: 'Volunteering, NGO work, community service, campaigns' },
  { name: 'teamwork',   description: 'Team projects, group assignments, collaborative hackathon teams' },
];

const QUESTION_BANK = [
  // HR / introduction
  { topic: 'HR', difficulty: 'easy', question: 'Tell me about yourself.', expected: [] },
  { topic: 'HR', difficulty: 'easy', question: 'Why are you interested in this role?', expected: [] },
  { topic: 'HR', difficulty: 'medium', question: 'Where do you see yourself in three years?', expected: [] },
  // Resume-based
  { topic: 'Resume', difficulty: 'easy', question: 'Walk me through your most significant project.', expected: [] },
  { topic: 'Resume', difficulty: 'medium', question: 'What was the biggest technical challenge in your recent project and how did you solve it?', expected: [] },
  // DSA
  { topic: 'DSA', difficulty: 'easy', question: 'Explain the difference between a stack and a queue.', expected: ['lifo', 'fifo', 'push', 'pop'] },
  { topic: 'DSA', difficulty: 'easy', question: 'What is the time complexity of binary search?', expected: ['log n', 'logarithmic', 'sorted'] },
  { topic: 'DSA', difficulty: 'medium', question: 'How does a hash map achieve average O(1) lookup?', expected: ['hash function', 'bucket', 'collision'] },
  { topic: 'DSA', difficulty: 'hard', question: 'Design an LRU cache and explain its time complexity.', expected: ['hash map', 'doubly linked list', 'o(1)', 'eviction'] },
  { topic: 'DSA', difficulty: 'hard', question: 'How would you detect a cycle in a linked list?', expected: ['fast', 'slow', 'pointer', 'floyd'] },
  // C++
  { topic: 'C++', difficulty: 'easy', question: 'What is the difference between stack and heap memory in C++?', expected: ['stack', 'heap', 'allocation'] },
  { topic: 'C++', difficulty: 'medium', question: 'Explain virtual functions and polymorphism in C++.', expected: ['virtual', 'polymorphism', 'override', 'vtable'] },
  { topic: 'C++', difficulty: 'hard', question: 'What is the Rule of Three/Five in C++ and why does it matter?', expected: ['destructor', 'copy constructor', 'assignment operator'] },
  // OOP
  { topic: 'OOP', difficulty: 'easy', question: 'What are the four pillars of object-oriented programming?', expected: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction'] },
  { topic: 'OOP', difficulty: 'medium', question: 'What is the difference between composition and inheritance?', expected: ['composition', 'inheritance', 'has-a', 'is-a'] },
  // JavaScript
  { topic: 'JavaScript', difficulty: 'easy', question: 'What is the difference between let, const, and var?', expected: ['scope', 'hoisting', 'block'] },
  { topic: 'JavaScript', difficulty: 'medium', question: 'Explain closures in JavaScript with an example.', expected: ['closure', 'scope', 'lexical'] },
  { topic: 'JavaScript', difficulty: 'hard', question: 'How does the JavaScript event loop work?', expected: ['event loop', 'call stack', 'microtask', 'macrotask'] },
  // React
  { topic: 'React', difficulty: 'easy', question: 'What are React hooks and why were they introduced?', expected: ['hooks', 'state', 'functional component'] },
  { topic: 'React', difficulty: 'medium', question: 'Explain useEffect and its dependency array.', expected: ['useeffect', 'dependency', 'side effect'] },
  { topic: 'React', difficulty: 'hard', question: 'How would you optimize re-renders in a large React application?', expected: ['memo', 'usememo', 'usecallback', 'virtual dom'] },
  // Node.js
  { topic: 'Node.js', difficulty: 'easy', question: 'What is Node.js and how does it differ from browser JavaScript?', expected: ['runtime', 'v8', 'server'] },
  { topic: 'Node.js', difficulty: 'medium', question: 'How does the Node.js event loop handle asynchronous operations?', expected: ['event loop', 'non-blocking', 'callback', 'libuv'] },
  // SQL / DBMS
  { topic: 'SQL', difficulty: 'easy', question: 'What is the difference between PUT and PATCH in REST APIs?', expected: ['put', 'patch', 'replace', 'partial'] },
  { topic: 'SQL', difficulty: 'medium', question: 'What is the difference between INNER JOIN and LEFT JOIN?', expected: ['inner join', 'left join', 'unmatched rows'] },
  { topic: 'DBMS', difficulty: 'medium', question: 'When would you create a database index, and what is the trade-off?', expected: ['index', 'read performance', 'write overhead'] },
  { topic: 'DBMS', difficulty: 'hard', question: 'Explain database normalization and why it matters.', expected: ['normalization', 'redundancy', 'normal form'] },
  // REST
  { topic: 'REST', difficulty: 'medium', question: 'What makes an API RESTful?', expected: ['stateless', 'resource', 'http methods'] },
  // Behavioral
  { topic: 'Behavioral', difficulty: 'medium', question: 'Tell me about a challenge you faced while working in a team.', expected: [] },
  { topic: 'Behavioral', difficulty: 'medium', question: 'Describe a time you had to learn something new under a tight deadline.', expected: [] },
  { topic: 'Behavioral', difficulty: 'hard', question: 'Tell me about a time you disagreed with a teammate. How did you resolve it?', expected: [] }
];

// Year-wise activity plan with rich metadata for new categories
function buildActivityPlan() {
  const plan = [];
  const push = (year, category, title, role, achievement, date, durationHours, detailsJson) =>
    plan.push({
      year, category, title,
      role: role || null, achievement: achievement || null,
      date, durationHours: durationHours || 1,
      detailsJson: detailsJson || null
    });

  // Year 1 (~14 activities)
  // === USER EXACT 20 ACTIVITIES LIST ===
  push(1, 'classroom',  'Attending classes', null, 'Completed', '2023-08-10', 80, { attendancePercent: 95, participationType: 'Regular attendance' });
  push(1, 'academic',   'Studying', null, 'Completed', '2023-08-15', 50);
  push(1, 'library',    'Visiting the library', null, null, '2023-08-18', 2, { visitPurpose: 'study' });
  push(1, 'library',    'Reading books', null, null, '2023-08-20', 3, { bookTitle: 'Clean Code', pagesRead: 50 });
  push(1, 'technical',  'Participating in technical events', 'Participant', 'Participant', '2023-08-25');
  push(1, 'sports',     'Playing sports', 'Player', null, '2023-09-01', 10, { sport: 'Badminton' });
  push(1, 'leadership', 'Joining clubs', 'Member', null, '2023-09-05');
  push(1, 'cultural',   'Participating in cultural events', 'Participant', null, '2023-09-10');
  push(1, 'learning',   'Attending workshops', null, 'Completed', '2023-09-15');
  push(1, 'technical',  'Participating in hackathons', 'Participant', 'Finalist', '2023-09-20');
  push(1, 'social',     'Volunteering', 'Volunteer', null, '2023-09-25', 10, { organization: 'NGO' });
  push(1, 'events',     'Organizing events', 'Organizer', 'Completed', '2023-10-01');
  push(1, 'leadership', 'Taking leadership roles', 'Coordinator', null, '2023-10-05');
  push(1, 'technical',  'Working on projects', 'Developer', 'Completed', '2023-10-10');
  push(1, 'learning',   'Completing certifications', null, 'Completed', '2023-10-15');
  push(1, 'events',     'Participating in competitions', 'Competitor', 'Runner-up', '2023-10-20');
  push(1, 'teamwork',   'Helping peers', 'Mentor', null, '2023-10-25');
  push(1, 'learning',   'Attending seminars', null, 'Completed', '2023-10-30');
  push(1, 'technical',  'Doing internships', 'Intern', 'Completed', '2023-11-05', 160);
  push(1, 'academic',   'Conducting research', 'Researcher', 'Published', '2023-11-10');
  // =====================================

  push(1, 'academic', 'Semester 1 Assignments Completed', null, 'Completed', '2023-11-10');
  push(1, 'academic', 'Semester 1 Internal Assessment', null, 'Completed', '2023-12-05');
  // Library visits with book metadata
  push(1, 'library', 'Library Visit — Introduction to Algorithms (Cormen)', null, null, '2023-09-15', 2,
    { bookTitle: 'Introduction to Algorithms', author: 'Cormen et al.', topic: 'DSA', pagesRead: 120, visitPurpose: 'study' });
  push(1, 'library', 'Library Visit — The Pragmatic Programmer', null, null, '2023-10-05', 1.5,
    { bookTitle: 'The Pragmatic Programmer', author: 'David Thomas', topic: 'Software Engineering', pagesRead: 80, visitPurpose: 'personal growth' });
  push(1, 'library', 'Library Visit — DBMS Reference Reading', null, null, '2023-11-10', 1,
    { visitPurpose: 'study', topic: 'Database Management', pagesRead: 50 });
  // Classroom attendance logs
  push(1, 'classroom', 'Semester 1 — Regular Class Attendance (Aug–Nov 2023)', null, 'Completed', '2023-11-30', 80,
    { subject: 'Multiple', attendancePercent: 91, participationType: 'Regular attendance + lab sessions', totalClasses: 110, attended: 100 });
  push(1, 'classroom', 'Semester 2 — Regular Class Attendance (Jan–Apr 2024)', null, 'Completed', '2024-04-15', 80,
    { subject: 'Multiple', attendancePercent: 88, participationType: 'Q&A + assignments', totalClasses: 105, attended: 92 });
  push(1, 'learning', 'Introduction to Programming — Online Course (Coursera)', null, 'Completed', '2023-10-20');
  push(1, 'technical', 'First Python Mini Project', null, 'Completed', '2023-11-25');
  push(1, 'technical', 'College Coding Club Orientation Hackathon', 'Participant', 'Participant', '2023-12-15');
  push(1, 'cultural', 'Freshers Cultural Night — Dance Performance', 'Performer', null, '2023-09-05');
  // Sports with skills
  push(1, 'sports', 'Badminton Practice Sessions — Semester 1', 'Player', null, '2023-08-20', 40,
    { sport: 'Badminton', trainingType: 'Practice', skillsLearned: ['footwork', 'smash technique', 'serve'], coach: 'College Coach' });
  // Games / strategy
  push(1, 'games', 'Chess Club — Strategy Sessions', 'Participant', null, '2023-10-12', 6,
    { gameName: 'Chess', sessionsAttended: 6, skillsLearned: ['opening theory', 'endgame', 'tactics'], level: 'Beginner' });
  // Events
  push(1, 'events', 'College Annual Tech Fest — Visitor & Participant', 'Participant', null, '2023-11-18', 2,
    { eventName: 'Tech Fest 2023', eventLevel: 'College', role: 'Participant', outcome: 'Participated' });
  push(1, 'social', 'Campus Cleanliness Drive', 'Volunteer', null, '2023-10-02');
  push(1, 'teamwork', 'Group Assignment — Database Basics', 'Team Member', null, '2023-11-18');
  push(1, 'academic', 'Semester 2 Assignments Completed', null, 'Completed', '2024-03-10');
  push(1, 'learning', 'Web Development Basics Workshop', null, 'Completed', '2024-02-10');

  // Year 2 (~30 activities)
  push(2, 'academic', 'Semester 3 Assignments Completed', null, 'Completed', '2024-08-10');
  push(2, 'academic', 'Semester 3 Internal Assessment', null, 'Completed', '2024-09-05');
  push(2, 'academic', 'Semester 4 Assignments Completed', null, 'Completed', '2025-02-10');
  push(2, 'academic', 'Academic Paper Presentation - DBMS', null, 'Presented', '2024-10-12');
  for (let i = 0; i < 6; i++) push(2, 'learning', `Library Visits Batch ${i + 1}`, null, null, `2024-0${(i % 9) + 1}-15`, 30);
  push(2, 'learning', 'DSA Certification Course', null, 'Completed', '2024-09-20');
  push(2, 'learning', 'DBMS Workshop', null, 'Completed', '2024-11-05');
  push(2, 'technical', 'MERN Stack Mini Project', null, 'Completed', '2024-10-01');
  push(2, 'technical', 'Smart India Hackathon - College Round', 'Participant', 'Finalist', '2024-11-20');
  push(2, 'technical', 'Smart India Hackathon 2024', 'Team Member', 'Finalist', '2024-12-15');
  push(2, 'technical', 'Web Development Workshop - Advanced', null, 'Completed', '2025-01-10');
  push(2, 'technical', 'Open Source Contribution - Docs Fix', 'Contributor', null, '2025-02-14');
  push(2, 'cultural', 'Inter-College Debate Competition', 'Participant', 'Runner-up', '2024-09-28');
  push(2, 'cultural', 'Photography Club Exhibition', 'Participant', null, '2024-12-08');
  push(2, 'sports', 'Badminton Inter-Department Competition', 'Player', 'Semi-finalist', '2024-10-18');
  push(2, 'sports', 'Badminton Practice Sessions', 'Player', null, '2024-08-01', 60);
  push(2, 'leadership', 'Coding Club Joined - Core Member', 'Core Member', null, '2024-08-15');
  push(2, 'social', 'Blood Donation Camp', 'Volunteer', null, '2024-09-10');
  push(2, 'social', 'Teaching Underprivileged Students - Weekend Program', 'Volunteer', null, '2024-11-02', 15);
  push(2, 'teamwork', 'Hackathon Team - Smart India Hackathon', 'Team Member', null, '2024-11-20');
  push(2, 'teamwork', 'Group Project - Web App', 'Team Member', null, '2025-01-20');
  push(2, 'academic', 'Semester 4 Internal Assessment', null, 'Completed', '2025-03-01');
  push(2, 'learning', 'Technical Book Completed - Clean Code', null, 'Completed', '2025-01-25');
  push(2, 'cultural', 'Cultural Fest Volunteer Coordination', 'Volunteer', null, '2025-02-20');
  push(2, 'technical', 'Java Certification', null, 'Completed', '2025-03-15');
  push(2, 'academic', 'Academic Project Submission - DBMS', null, 'Completed', '2025-03-20');

  // Year 3 (~42 activities) - condensed generation
  const y3Base = [
    ['academic', 'Semester 5 Assignments Completed', null, 'Completed', '2025-08-10'],
    ['academic', 'Semester 5 Internal Assessment', null, 'Completed', '2025-09-05'],
    ['academic', 'Semester 6 Assignments Completed', null, 'Completed', '2026-02-10'],
    ['academic', 'Semester 6 Internal Assessment', null, 'Completed', '2026-03-01'],
    ['academic', 'Academic Paper Presentation - AI Systems', null, 'Presented', '2025-10-15'],
    ['technical', 'CharactAI Capstone Project - Phase 1', 'Team Lead', 'Completed', '2025-09-15'],
    ['technical', 'Summer Internship - Backend Development', 'Intern', 'Completed', '2025-06-01', 320],
    ['technical', 'National Hackathon 2025', 'Team Lead', 'Winner', '2025-10-25'],
    ['technical', 'Inter-College Hackathon', 'Participant', 'Finalist', '2025-11-15'],
    ['technical', 'Open Source Contribution - Feature PR', 'Contributor', 'Merged', '2025-12-01'],
    ['technical', 'Cloud Computing Certification (AWS)', null, 'Completed', '2026-01-10'],
    ['technical', 'Machine Learning Workshop', null, 'Completed', '2026-01-20'],
    ['technical', 'Competitive Programming Contest', 'Participant', 'Top 10%', '2025-09-08'],
    ['learning', 'Research Paper Reading Group', null, 'Completed', '2025-08-20'],
    ['learning', 'Advanced DSA Certification', null, 'Completed', '2025-09-25'],
    ['learning', 'System Design Workshop', null, 'Completed', '2025-11-10'],
    ['leadership', 'Technical Club Coordinator', 'Coordinator', null, '2025-08-01', 240],
    ['leadership', 'Hackathon Team Lead - National Hackathon', 'Team Lead', null, '2025-10-25'],
    ['leadership', 'Peer Mentoring Program - Juniors', 'Mentor', null, '2025-09-01', 40],
    ['social', 'Environmental Awareness Campaign', 'Organizer', null, '2025-10-05'],
    ['social', 'Community Teaching Program', 'Volunteer', null, '2025-11-20', 20],
    ['cultural', 'Tech Fest Cultural Night Coordination', 'Coordinator', null, '2025-12-10'],
    ['sports', 'Badminton University-Level Competition', 'Player', 'University Finalist', '2025-10-30'],
    ['sports', 'Badminton Practice Sessions', 'Player', null, '2025-08-15', 80],
    ['teamwork', 'Capstone Team Collaboration', 'Team Member', null, '2025-09-15'],
    ['teamwork', 'Hackathon Team - National Hackathon', 'Team Member', null, '2025-10-25']
  ];
  y3Base.forEach(([category, title, role, achievement, date, duration]) =>
    push(3, category, title, role, achievement, date, duration));
  for (let i = 0; i < 10; i++) push(3, 'learning', `Library Visits Batch ${i + 1}`, null, null, `2025-1${i % 2}-1${i % 9}`, 25);
  for (let i = 0; i < 6; i++) push(3, 'academic', `Academic Project Milestone ${i + 1}`, null, 'Completed', `2025-1${i % 2}-2${i % 9}`);

  // Year 4 (~51 activities) - condensed generation
  const y4Base = [
    ['academic', 'Semester 7 Assignments Completed', null, 'Completed', '2026-08-10'],
    ['academic', 'Semester 7 Internal Assessment', null, 'Completed', '2026-09-05'],
    ['academic', 'Major Project Proposal Defense', null, 'Approved', '2026-08-20'],
    ['academic', 'Major Project Mid Review', null, 'Completed', '2026-11-15'],
    ['technical', 'CharactAI Major Project - Full Stack Build', 'Team Lead', 'Ongoing', '2026-08-25', 400],
    ['technical', 'Final Internship - Full Stack Development', 'Intern', 'Completed', '2026-06-01', 320],
    ['technical', 'Smart India Hackathon 2026 (Final Year)', 'Team Lead', 'Winner', '2026-11-05'],
    ['technical', 'AI/ML Hackathon', 'Participant', 'Finalist', '2026-12-10'],
    ['technical', 'Advanced Cloud Certification', null, 'Completed', '2026-09-15'],
    ['technical', 'Open Source Contribution - Major Feature', 'Contributor', 'Merged', '2026-10-05'],
    ['technical', 'Competitive Programming Contest', 'Participant', 'Top 5%', '2026-09-20'],
    ['leadership', 'Technical Club President', 'President', null, '2026-08-01', 300],
    ['leadership', 'Event Organizer - Annual Tech Fest', 'Organizer', null, '2026-10-15'],
    ['leadership', 'Peer Mentoring Program - Juniors', 'Mentor', null, '2026-08-15', 50],
    ['leadership', 'Hackathon Team Lead - SIH 2026', 'Team Lead', null, '2026-11-05'],
    ['social', 'NGO Partnership Drive - Digital Literacy', 'Organizer', null, '2026-09-10'],
    ['social', 'Community Teaching Program', 'Volunteer', null, '2026-10-20', 25],
    ['cultural', 'Annual Fest Event Organization', 'Coordinator', null, '2026-10-15'],
    ['sports', 'Badminton University-Level Competition', 'Player', 'University Champion', '2026-09-25'],
    ['sports', 'Badminton Practice Sessions', 'Player', null, '2026-08-10', 60],
    ['teamwork', 'Major Project Team Collaboration', 'Team Lead', null, '2026-08-25'],
    ['teamwork', 'Hackathon Team - SIH 2026', 'Team Member', null, '2026-11-05']
  ];
  y4Base.forEach(([category, title, role, achievement, date, duration]) =>
    push(4, category, title, role, achievement, date, duration));
  for (let i = 0; i < 15; i++) push(4, 'learning', `Library Visits Batch ${i + 1}`, null, null, `2026-0${(i % 8) + 1}-1${i % 9}`, 25);
  for (let i = 0; i < 14; i++) push(4, 'academic', `Major Project Task ${i + 1}`, null, 'Completed', `2026-1${i % 2}-0${(i % 8) + 1}`);

  return plan;
}

const OTHER_RESUMES = [
  { name: 'Rahul Mehta', code: 'CS22B002', cgpa: 8.6, backlogs: 0,
    text: 'Skilled in Java, DSA, OOP, SQL, and Spring Boot. Built a banking backend with REST APIs. Strong problem solving and teamwork on 3 hackathons.' },
  { name: 'Ananya Rao', code: 'CS22B003', cgpa: 9.1, backlogs: 0,
    text: 'Experience with React, Node.js, MongoDB, and REST APIs. Built MERN e-commerce applications. Communication and leadership through club coordination.' },
  { name: 'Karan Verma', code: 'CS22B004', cgpa: 7.4, backlogs: 1,
    text: 'C++ and DSA focused competitive programmer. Familiar with git and basic SQL. Limited web development exposure.' },
  { name: 'Sneha Iyer', code: 'CS22B005', cgpa: 8.9, backlogs: 0,
    text: 'Full stack developer skilled in JavaScript, React, Node.js, Express, MongoDB, Docker and AWS. Led two hackathon teams and mentored juniors.' },
  { name: 'Vikram Singh', code: 'CS22B006', cgpa: 6.8, backlogs: 2,
    text: 'Basic knowledge of Python and machine learning. Currently learning DBMS and SQL. Participated in one college hackathon.' }
];

const SAMPLE_JD = `We are hiring a Trainee Software Engineer. Required skills: C++, DSA, OOP, DBMS, SQL,
JavaScript, React, Node.js, REST APIs, and MongoDB. Strong problem solving, communication and
teamwork skills are essential. Candidates should be comfortable working in an agile team, writing
clean code, and collaborating on full-stack web applications using the MERN stack.`;

async function seed() {
  console.log('Seeding CharactAI demo data...');

  const tx = db.transaction(() => {
    db.exec(`
      DELETE FROM interview_schedules; DELETE FROM placement_offers; DELETE FROM placement_rounds;
      DELETE FROM placement_applications; DELETE FROM placement_drives;
      DELETE FROM interview_answers; DELETE FROM interviews; DELETE FROM candidate_matches;
      DELETE FROM resumes; DELETE FROM jobs; DELETE FROM companies; DELETE FROM question_bank;
      DELETE FROM certificates; DELETE FROM ai_assessments; DELETE FROM notifications;
      DELETE FROM activities; DELETE FROM global_events; DELETE FROM activity_categories; DELETE FROM students;
      DELETE FROM audit_logs; DELETE FROM users; DELETE FROM system_settings;
    `);
  });
  tx();

  // Categories
  const categoryIds = {};
  const insertCategory = db.prepare('INSERT INTO activity_categories (id, name, description) VALUES (?, ?, ?)');
  CATEGORIES.forEach(c => {
    const id = uuidv4();
    categoryIds[c.name] = id;
    insertCategory.run(id, c.name, c.description);
  });

  // System Settings (AI Weights)
  const defaultWeights = {
    academic: 14, technical: 13, learning: 10, classroom: 10,
    leadership: 10, discipline: 9, teamwork: 8, sports: 7,
    events: 6, creativity: 5, social: 5, extracurricular: 3
  };
  db.prepare('INSERT INTO system_settings (key, value_json) VALUES (?, ?)').run('ai_dimension_weights', JSON.stringify(defaultWeights));

  // Sample Global Event
  db.prepare('INSERT INTO global_events (id, title, description, event_date, location, category_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(), 'Annual Tech Symposium 2026', 'College-wide tech fest', '2026-10-15', 'Main Auditorium', categoryIds['technical']
  );

  // Question bank
  const insertQ = db.prepare('INSERT INTO question_bank (id, topic, difficulty, question, expected_concepts_json) VALUES (?, ?, ?, ?, ?)');
  QUESTION_BANK.forEach(q => insertQ.run(uuidv4(), q.topic, q.difficulty, q.question, JSON.stringify(q.expected)));

  // Users
  const insertUser = db.prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)");
  const insertStudent = db.prepare(`
    INSERT INTO students (id, student_code, department, program, batch, admission_year, graduation_year, cgpa, backlogs, visibility)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'institution')
  `);

  const studentId = uuidv4();
  await insertUser.run(studentId, 'Priya Jain', 'priya.jain@charactai.edu', await hashPassword('Student@123'), 'student');
  insertStudent.run(studentId, 'CS23B001', 'CSE', 'B.Tech Computer Science & Engineering', '2023-2027', 2023, 2027, 9.2, 0);

  const facultyId = uuidv4();
  await insertUser.run(facultyId, 'Dr. Anil Sharma', 'faculty@charactai.edu', await hashPassword('Faculty@123'), 'faculty');

  const adminId = uuidv4();
  await insertUser.run(adminId, 'Institution Admin', 'admin@charactai.edu', await hashPassword('Admin@123'), 'admin');



  // Activities for Priya - most approved, a handful left pending for the faculty demo
  const insertActivity = db.prepare(`
    INSERT INTO activities (
      id, student_id, category_id, title, description, activity_date, academic_year,
      duration_hours, details_json, role, achievement, evidence_path, verification_status, verified_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `);

  const plan = buildActivityPlan();
  let pendingLeft = 5;
  plan.forEach((a, idx) => {
    const isPending = pendingLeft > 0 && idx % 17 === 0;
    if (isPending) pendingLeft -= 1;
    const status = isPending ? 'pending' : 'approved';
    const verifiedBy = isPending ? null : facultyId;
    const detailsStr = a.detailsJson ? JSON.stringify(a.detailsJson) : null;
    insertActivity.run(
      uuidv4(), studentId, categoryIds[a.category], a.title,
      `${a.title} recorded under ${a.category} activities.`, a.date, a.year,
      a.durationHours, detailsStr, a.role, a.achievement, status, verifiedBy
    );
  });

  console.log(`Inserted ${plan.length} activities for Priya Jain (student).`);


  console.log('\nDemo logins:');
  console.log('  Student:           priya.jain@charactai.edu / Student@123');
  console.log('  Faculty:           faculty@charactai.edu / Faculty@123');
  console.log('  Admin:             admin@charactai.edu / Admin@123');
  console.log('\nTip: from the Student dashboard, click "Run AI Assessment" then "Generate Certificate".');
  console.log('\nSeed complete.');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
