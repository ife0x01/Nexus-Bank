const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const db     = require('../db');
const auth   = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const { rows } = await db.query(
      'SELECT id, uuid, full_name, email, role, phone FROM users WHERE email = $1', [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const { rows: h } = await db.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
    if (!await bcrypt.compare(password, h[0].password_hash))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, uuid: user.uuid, email: user.email, name: user.full_name, role: user.role },
      process.env.JWT_SECRET, { expiresIn: '8h' }
    );
    const legacyToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_WEAK_SECRET, { expiresIn: '8h', algorithm: 'HS256' }
    );
    res.json({ token, legacyToken, user: { id: user.id, name: user.full_name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/me', auth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, uuid, full_name, email, phone, role, address, kyc_status, created_at FROM users WHERE id = $1',
    [req.user.userId]
  );
  res.json(rows[0] || {});
});

// FLAG14 step 2 — reset token returned in response
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const { rows } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    const token = crypto.randomBytes(24).toString('hex');
    await db.query('UPDATE users SET reset_token = $1 WHERE id = $2', [token, rows[0].id]);
    res.json({ message: 'Password reset initiated. Check your email.', reset_token: token });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'token and password required' });
  try {
    const { rows } = await db.query('SELECT id FROM users WHERE reset_token = $1', [token]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired token' });
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password_hash = $1, reset_token = NULL WHERE id = $2', [hash, rows[0].id]);
    res.json({ message: 'Password updated successfully.' });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
