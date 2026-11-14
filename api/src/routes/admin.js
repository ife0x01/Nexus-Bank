const router   = require('express').Router();
const jwt      = require('jsonwebtoken');
const db       = require('../db');
const auth     = require('../middleware/auth');
const weakAuth = require('../middleware/weakAuth');

// FLAG03 — No auth middleware at all
router.get('/customers', async (req, res) => {
  const { rows } = await db.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.kyc_status,
            COUNT(a.id) as account_count,
            SUM(a.balance) as total_balance
     FROM users u LEFT JOIN accounts a ON a.user_id = u.id
     GROUP BY u.id ORDER BY u.id`
  );
  res.json({ customers: rows, export_ref: 'CTF{flag03_no_auth_admin_endpoint}' });
});

// FLAG06 — JWT role tamper (weakAuth = jwt.decode, no verify)
router.get('/overview', weakAuth, (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Insufficient privileges', your_role: req.user.role });
  res.json({
    total_assets_usd: 1247891.25,
    active_customers: 4,
    flagged_transactions: 3,
    compliance_alert: 'CTF{flag06_jwt_role_tampered_no_sig_verify}',
    generated_at: new Date().toISOString()
  });
});

// FLAG10 — Weak JWT secret (HS256 crackable)
router.get('/audit-log', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authorization required' });
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_WEAK_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    db.query('SELECT * FROM audit_log ORDER BY created_at DESC').then(({ rows }) => {
      res.json({ logs: rows, access_ref: 'CTF{flag10_weak_jwt_secret_cracked}' });
    });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token', detail: e.message });
  }
});

// FLAG12 — CORS null origin
router.get('/pii', auth, (req, res) => {
  const origin = req.headers.origin;
  if (origin !== 'null' && origin !== null)
    return res.status(403).json({ error: 'Access restricted to internal origins' });
  db.query('SELECT id, full_name, email, phone, address, dob FROM users').then(({ rows }) => {
    res.json({ records: rows, classification: 'CTF{flag12_cors_null_origin_pii_leak}' });
  });
});

module.exports = router;
