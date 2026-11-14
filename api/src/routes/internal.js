const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

// FLAG09 — Hidden internal endpoint (not in docs, not linked from UI)
// Discovered via directory brute-force: /api/v1/internal/export
router.get('/export', auth, async (req, res) => {
  const { rows: users }  = await db.query('SELECT id, full_name, email, role FROM users');
  const { rows: accounts } = await db.query('SELECT id, account_number, user_id, balance FROM accounts');
  const { rows: logs } = await db.query('SELECT * FROM audit_log ORDER BY created_at DESC');
  res.json({
    users, accounts, audit_logs: logs,
    system_ref: 'CTF{flag09_forced_browse_internal_export}'
  });
});

module.exports = router;
