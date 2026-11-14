const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors());
app.use(express.json());

const FLAGS = [
  { id:1,  flag:'CTF{flag01_account_idor_sequential}',        title:'Account IDOR — Sequential ID',           difficulty:'easy',         category:'IDOR',        points:100, hint:'GET /api/accounts/:id has no ownership check. You are account 1 or 2. What happens when you request account 3, 4, 5?' },
  { id:2,  flag:'CTF{flag02_account_summary_param_tamper}',   title:'Account BAC via Query Param',             difficulty:'easy',         category:'BAC',         points:100, hint:'GET /api/accounts/summary?accountId= trusts the query parameter instead of your JWT. Try other account IDs.' },
  { id:3,  flag:'CTF{flag03_no_auth_admin_endpoint}',         title:'Admin Customers — No Auth',               difficulty:'easy',         category:'BAC Vertical',points:100, hint:'GET /api/admin/customers requires no authentication at all.' },
  { id:4,  flag:'CTF{flag04_statement_idor_no_ownership}',    title:'Statement Download IDOR',                 difficulty:'intermediate', category:'IDOR',        points:200, hint:'GET /api/statements/:id has no ownership check. Your statements are IDs 1-2. Try 3, 4, 5.' },
  { id:5,  flag:'CTF{flag05_horizontal_bac_password_reset}',  title:'Reset Any User Password',                 difficulty:'intermediate', category:'BAC Horizontal',points:200, hint:'PUT /api/profile/password/:userId has no ownership check. You can reset any user\'s password.' },
  { id:6,  flag:'CTF{flag06_jwt_role_tampered_no_sig_verify}',title:'JWT Role Tamper — No Sig Check',          difficulty:'intermediate', category:'JWT',         points:200, hint:'GET /api/admin/overview uses jwt.decode() not jwt.verify(). Modify the role claim in your token.' },
  { id:7,  flag:'CTF{flag07_mass_assignment_userid_inject}',  title:'Mass Assignment — userId Injection',      difficulty:'intermediate', category:'IDOR',        points:200, hint:'PUT /api/profile accepts a userId field in the body. Inject userId:5 to read the admin\'s profile.' },
  { id:8,  flag:'CTF{flag08_transaction_uuid_idor}',          title:'Transaction Receipt UUID IDOR',           difficulty:'advanced',     category:'IDOR',        points:300, hint:'GET /api/transactions/receipt/:uuid has no ownership check. UUIDs are visible in the transaction list for your own transactions — but so are other users\' UUIDs if you find the right endpoint.' },
  { id:9,  flag:'CTF{flag09_forced_browse_internal_export}',  title:'Forced Browsing — Internal Export',       difficulty:'advanced',     category:'BAC Vertical',points:300, hint:'There is an undocumented internal API endpoint. Not /api/admin. Try directory fuzzing under /api/v1/' },
  { id:10, flag:'CTF{flag10_weak_jwt_secret_cracked}',        title:'Weak JWT Secret — HS256 Cracked',         difficulty:'advanced',     category:'JWT',         points:300, hint:'Your legacyToken from login is signed with a weak HS256 secret. Crack it with hashcat + rockyou.txt, forge an admin token, hit GET /api/admin/audit-log.' },
  { id:11, flag:'CTF{flag11_statement_md5_indirect_ref}',     title:'MD5 Indirect Reference — Statements',     difficulty:'advanced',     category:'IDOR',        points:300, hint:'GET /api/statements/ref/:hash looks up statements by MD5(accountId). Compute md5("3") to access account 3\'s statements.' },
  { id:12, flag:'CTF{flag12_cors_null_origin_pii_leak}',      title:'CORS Null Origin — PII Disclosure',       difficulty:'advanced',     category:'CORS',        points:300, hint:'GET /api/admin/pii checks for Origin: null header. Send the request with that header to bypass the restriction.' },
  { id:13, flag:'CTF{flag13_jwt_alg_none_bypass}',            title:'JWT Algorithm Confusion — alg:none',      difficulty:'advanced',     category:'JWT',         points:300, hint:'The admin API at :8001 accepts JWTs with alg:none. Craft a token with no signature: base64({"alg":"none"}).base64({"role":"admin"}).' },
  { id:14, flag:'CTF{flag14_chained_idor_account_takeover}',  title:'Chained: IDOR → Reset → Takeover',        difficulty:'advanced',     category:'Chained',     points:300, hint:'4 steps: (1) IDOR /api/accounts/3 leaks email, (2) POST /api/auth/forgot-password returns reset_token, (3) reset password, (4) login + hit :8001/internal/account-takeover' },
  { id:15, flag:'CTF{flag15_race_condition_double_spend}',    title:'Race Condition — Double Spend',            difficulty:'advanced',     category:'Race Condition',points:300, hint:'POST /api/transactions/transfer has a 300ms delay between balance check and deduction. Send concurrent transfers > your balance.' },
];

const progress = {};

app.get('/', (_req, res) => res.json({ service: 'Nexus Bank CTF Scoreboard', flags: FLAGS.length, submit: 'POST /submit' }));

app.get('/flags', (_req, res) => res.json(FLAGS.map(({ flag: _f, ...r }) => r)));

app.post('/submit', (req, res) => {
  const { flag, session = 'default' } = req.body;
  if (!flag) return res.status(400).json({ error: 'flag required' });
  const match = FLAGS.find(f => f.flag === flag.trim());
  if (!match) return res.json({ correct: false, message: 'Incorrect — keep digging.' });
  if (!progress[session]) progress[session] = new Set();
  const already = progress[session].has(match.id);
  progress[session].add(match.id);
  res.json({
    correct: true, already,
    flagId: match.id, title: match.title,
    points: already ? 0 : match.points,
    message: already
      ? `Already captured: ${match.title}`
      : `[+${match.points}] ${match.title} — ${match.category}`,
  });
});

app.get('/progress/:session', (req, res) => {
  const found = [...(progress[req.params.session] || [])];
  const pts   = found.reduce((a, id) => a + (FLAGS.find(f => f.id === id)?.points || 0), 0);
  res.json({
    session: req.params.session,
    found: found.length, total: FLAGS.length,
    points: pts, max: FLAGS.reduce((a, f) => a + f.points, 0),
    flags: found.map(id => { const f = FLAGS.find(f => f.id === id); return { id: f.id, title: f.title, difficulty: f.difficulty, points: f.points }; })
  });
});

app.get('/hints/:id', (req, res) => {
  const f = FLAGS.find(f => f.id === parseInt(req.params.id));
  if (!f) return res.status(404).json({ error: 'Not found' });
  res.json({ id: f.id, title: f.title, hint: f.hint, endpoint: f.hint.match(/[A-Z]+\s+(\/[^\s.]+)/)?.[1] });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`[Scoreboard] :${PORT}`));
