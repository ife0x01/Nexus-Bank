const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

// GET /api/transactions — own transactions (joins through accounts)
router.get('/', auth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT t.id, t.uuid, t.amount, t.type, t.merchant, t.category,
            t.description, t.status, t.created_at, a.account_number
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     WHERE a.user_id = $1
     ORDER BY t.created_at DESC LIMIT 50`,
    [req.user.userId]
  );
  res.json(rows);
});

// FLAG08 — GUID IDOR on transaction receipt
// UUIDs are visible in the transaction list for your own transactions
// but the receipt endpoint has no ownership check
router.get('/receipt/:uuid', auth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT t.id, t.uuid, t.amount, t.type, t.merchant, t.category,
            t.description, t.internal_note, t.status, t.created_at,
            a.account_number, u.full_name as account_holder
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     JOIN users u ON u.id = a.user_id
     WHERE t.uuid = $1`,
    [req.params.uuid]  // no ownership check
  );
  if (!rows.length) return res.status(404).json({ error: 'Receipt not found' });
  res.json(rows[0]);
});

// FLAG15 — Race condition: double-spend transfer
router.post('/transfer', auth, async (req, res) => {
  const { fromAccountId, toAccountId, amount, description } = req.body;
  if (!fromAccountId || !amount) return res.status(400).json({ error: 'fromAccountId and amount required' });

  try {
    // Step 1: verify ownership and read balance
    const { rows: accts } = await db.query(
      'SELECT id, balance, account_number FROM accounts WHERE id = $1 AND user_id = $2',
      [fromAccountId, req.user.userId]
    );
    if (!accts.length) return res.status(403).json({ error: 'Account not found or access denied' });
    const account = accts[0];

    if (parseFloat(account.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient funds', balance: account.balance });
    }

    // Artificial processing delay — creates race condition window
    await new Promise(r => setTimeout(r, 300));

    // Step 2: deduct (non-atomic with the check above)
    const newBalance = parseFloat(account.balance) - parseFloat(amount);
    await db.query('UPDATE accounts SET balance = $1 WHERE id = $2', [newBalance, fromAccountId]);

    // Record transaction
    const ref = 'NXB-' + Date.now();
    await db.query(
      `INSERT INTO transactions (account_id, amount, type, merchant, category, description, status)
       VALUES ($1, $2, 'debit', $3, 'transfer', $4, 'completed')`,
      [fromAccountId, -Math.abs(amount), toAccountId ? `Transfer to ${toAccountId}` : 'Wire Transfer', description || ref]
    );

    const flag = newBalance < 0 ? 'CTF{flag15_race_condition_double_spend}' : null;
    res.json({ success: true, reference: ref, new_balance: newBalance, ...(flag && { audit_ref: flag }) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Transfer failed' });
  }
});

module.exports = router;
