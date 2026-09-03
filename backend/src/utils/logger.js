const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

/**
 * Every AI-influenced or high-impact action (verification, score generation,
 * certificate issuance, recruitment ranking) is written to an audit log.
 * This is required by the brief's "Security / Audit logs" and
 * "Bias & Fairness Module" requirements — recommendations must be traceable.
 */
function auditLog(actorId, action, entity, entityId, meta = {}) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, actor_id, action, entity, entity_id, meta_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(uuidv4(), actorId || null, action, entity, entityId || null, JSON.stringify(meta));
}

module.exports = { auditLog };
