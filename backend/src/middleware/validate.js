const { body, param, query, validationResult } = require('express-validator');

// ── Helper: extract and format validation errors ──────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Rule Sets ─────────────────────────────────────────────────────────────────

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const activityRules = [
  body('categoryId').notEmpty().withMessage('Category is required'),
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),
  body('activityDate').isISO8601().withMessage('Valid date is required (YYYY-MM-DD)'),
  body('academicYear').isInt({ min: 1, max: 4 }).withMessage('Academic year must be 1–4'),
  body('durationHours').optional().isFloat({ min: 0, max: 5000 }).withMessage('Duration must be a positive number'),
  body('role').optional().trim().isLength({ max: 100 }).withMessage('Role too long'),
  body('achievement').optional().trim().isLength({ max: 100 }).withMessage('Achievement too long'),
];

const studentProfileRules = [
  body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
  body('backlogs').optional().isInt({ min: 0 }).withMessage('Backlogs must be a non-negative integer'),
];

const verificationRules = [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('remark').optional().trim().isLength({ max: 500 }),
];

const uuidParam = (paramName = 'id') => [
  param(paramName).isUUID().withMessage(`${paramName} must be a valid UUID`),
];

const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
];

module.exports = {
  validate,
  loginRules,
  activityRules,
  studentProfileRules,
  verificationRules,
  uuidParam,
  paginationRules,
};
