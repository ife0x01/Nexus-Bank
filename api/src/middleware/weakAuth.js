const jwt = require('jsonwebtoken');

// ── VULNERABILITY: FLAG06 ────────────────────────────────────────────────────
// This "legacy" middleware calls jwt.decode() instead of jwt.verify().
// decode() DOES NOT check the signature — anyone can modify the payload
// (e.g. change role from "user" to "admin") and the server will trust it.
//
// To exploit:
//   1. Grab your JWT from login
//   2. Split by '.', base64-decode the middle segment (payload)
//   3. Change "role":"user" -> "role":"admin"
//   4. Re-encode (base64url) and reassemble: header.NEWPAYLOAD.oldsig
//   5. Send to any route using this middleware
//
// Fix: always use jwt.verify(token, secret) — never jwt.decode().
// ─────────────────────────────────────────────────────────────────────────────
module.exports = function weakAuthMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.slice(7);
  try {
    // BUG: decode does not verify signature
    const decoded = jwt.decode(token);
    if (!decoded) throw new Error('Invalid token format');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Could not parse token' });
  }
};
