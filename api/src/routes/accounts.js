const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

// GET /api/accounts — own accounts only (correct)
router.get('/', auth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT a.id, a.uuid, a.account_number, a.routing_number, a.account_type,
            a.balance, a.currency, a.status, a.created_at,
            c.last_four, c.card_type, c.network, c.expiry, c.status as card_status
     FROM accounts a
     LEFT JOIN cards c ON c.account_id = a.id
     WHERE a.user_id = $1 ORDER BY a.id`,
    [req.user.userId]
  );
  res.json(rows);
});

// FLAG01 — Sequential IDOR
// GET /api/accounts/:id — no ownership check
// Logged in as john → fetch /api/accounts/3 → sarah's account + compliance internal_ref
router.get('/:id(\\d+)', auth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT a.id, a.uuid, a.account_number, a.routing_number, a.account_type,
            a.balance, a.currency, a.status, a.internal_ref, a.created_at,
            u.full_name as owner_name, u.email as owner_email
     FROM accounts a JOIN users u ON u.id = a.user_id
     WHERE a.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Account not found' });
  res.json(rows[0]);
});

// FLAG02 — BAC via query param
// GET /api/accounts/summary?accountId=X — uses query param instead of JWT
router.get('/summary', auth, async (req, res) => {
  const accountId = req.query.accountId;
  if (!accountId) return res.status(400).json({ error: 'accountId required' });
  const { rows } = await db.query(
    `SELECT a.id, a.account_number, a.account_type, a.balance, a.currency,
            u.full_name, u.email, u.phone, u.address,
            'CTF{flag02_account_summary_param_tamper}' as compliance_ref
     FROM accounts a JOIN users u ON u.id = a.user_id
     WHERE a.id = $1`,
    [accountId]  // no ownership check
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// GET /api/accounts/:id/transactions — IDOR on transaction history
router.get('/:id(\\d+)/transactions', auth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT t.id, t.uuid, t.amount, t.type, t.merchant, t.category,
            t.description, t.status, t.created_at
     FROM transactions t WHERE t.account_id = $1 ORDER BY t.created_at DESC`,
    [req.params.id]  // no ownership check — IDOR
  );
  res.json(rows);
});

module.exports = router;
