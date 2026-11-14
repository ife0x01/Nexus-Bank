const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db     = require('../db');
const auth   = require('../middleware/auth');

// GET /api/profile — own profile
router.get('/', auth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, uuid, full_name, email, phone, address, dob, kyc_status, created_at FROM users WHERE id = $1',
    [req.user.userId]
  );
  res.json(rows[0] || {});
});

// FLAG07 — Mass assignment: userId injected from body
// PUT /api/profile — should only update the logged-in user, but accepts userId from body
router.put('/', auth, async (req, res) => {
  const { full_name, phone, address, userId } = req.body;
  const targetId = userId || req.user.userId;  // VULNERABLE: userId from body
  try {
    await db.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), address = COALESCE($3, address) WHERE id = $4',
      [full_name, phone, address, targetId]
    );
    const { rows } = await db.query(
      `SELECT id, full_name, email, phone, address, role, kyc_status,
              CASE WHEN role = 'admin' THEN 'CTF{flag07_mass_assignment_userid_inject}' ELSE NULL END as audit_ref
       FROM users WHERE id = $1`,
      [targetId]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});

// FLAG05 — Horizontal BAC on password change
// PUT /api/profile/password/:userId — no ownership check
router.put('/password/:userId', auth, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'password required' });
  try {
    const { rows } = await db.query('SELECT id, full_name, email FROM users WHERE id = $1', [req.params.userId]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.userId]);
    res.json({ message: `Password updated for account ${rows[0].email}`, compliance_ref: 'CTF{flag05_horizontal_bac_password_reset}' });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
