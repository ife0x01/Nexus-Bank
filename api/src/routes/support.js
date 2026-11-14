const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, subject, message, status, created_at FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.userId]
  );
  res.json(rows);
});

router.post('/', auth, async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'subject and message required' });
  const { rows } = await db.query(
    'INSERT INTO support_tickets (user_id, subject, message) VALUES ($1, $2, $3) RETURNING *',
    [req.user.userId, subject, message]
  );
  res.status(201).json(rows[0]);
});

module.exports = router;
