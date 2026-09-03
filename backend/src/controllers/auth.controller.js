const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { auditLog } = require('../utils/logger');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

  const token = signToken({ id: user.id, role: user.role, name: user.name, email: user.email });
  auditLog(user.id, 'login', 'user', user.id, {});

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

async function registerStudent(req, res) {
  const { name, email, password, department, program, batch, admissionYear, graduationYear, studentCode } = req.body;
  if (!name || !email || !password || !studentCode) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });

  const userId = uuidv4();
  const passwordHash = await hashPassword(password);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'student')
  `);
  const insertStudent = db.prepare(`
    INSERT INTO students (id, student_code, department, program, batch, admission_year, graduation_year)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    insertUser.run(userId, name, email.toLowerCase(), passwordHash);
    insertStudent.run(userId, studentCode, department || 'CSE', program || 'B.Tech', batch || '',
      admissionYear || new Date().getFullYear(), graduationYear || new Date().getFullYear() + 4);
  });
  tx();

  auditLog(userId, 'register', 'student', userId, {});
  const token = signToken({ id: userId, role: 'student', name, email: email.toLowerCase() });
  res.status(201).json({ token, user: { id: userId, name, email, role: 'student' } });
}

function me(req, res) {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
}

module.exports = { login, registerStudent, me };
