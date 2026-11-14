const router = require('express').Router();
const crypto = require('crypto');
const db     = require('../db');
const auth   = require('../middleware/auth');

// GET /api/statements — own statements only
router.get('/', auth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT s.id, s.uuid, s.period, s.created_at, a.account_number, a.account_type
     FROM statements s JOIN accounts a ON a.id = s.account_id
     WHERE a.user_id = $1 ORDER BY s.period DESC`,
    [req.user.userId]
  );
  res.json(rows);
});

// FLAG04 — IDOR on statement download
// GET /api/statements/:id — no ownership check
router.get('/:id(\\d+)', auth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT s.id, s.uuid, s.period, s.summary, s.created_at,
            a.account_number, a.account_type, u.full_name
     FROM statements s
     JOIN accounts a ON a.id = s.account_id
     JOIN users u ON u.id = a.user_id
     WHERE s.id = $1`,
    [req.params.id]  // no ownership check
  );
  if (!rows.length) return res.status(404).json({ error: 'Statement not found' });
  res.json(rows[0]);
});

// FLAG11 — Indirect hash reference
// GET /api/statements/ref/:hash — hash is MD5(accountId)
router.get('/ref/:hash', auth, async (req, res) => {
  const { hash } = req.params;
  const { rows: accounts } = await db.query('SELECT id FROM accounts');
  let matchedId = null;
  for (const a of accounts) {
    if (crypto.createHash('md5').update(String(a.id)).digest('hex') === hash) {
      matchedId = a.id; break;
    }
  }
  if (!matchedId) return res.status(404).json({ error: 'No statements found for that reference' });
  const { rows } = await db.query(
    `SELECT s.id, s.uuid, s.period, s.summary, s.created_at,
            a.account_number, a.account_type, u.full_name
     FROM statements s JOIN accounts a ON a.id = s.account_id
     JOIN users u ON u.id = a.user_id
     WHERE s.account_id = $1`,
    [matchedId]
  );
  res.json({
    statements: rows,
    resolved_account: matchedId,
    compliance_ref: 'CTF{flag11_statement_md5_indirect_ref}'
  });
});

module.exports = router;
