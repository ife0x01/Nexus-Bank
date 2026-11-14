const express = require('express');
const cors    = require('cors');
const app     = express();

// FLAG12 — CORS null origin allowed
app.use(cors({
  origin: (origin, cb) => {
    const allowed = ['http://localhost:3000', 'null', null, undefined];
    allowed.includes(origin) ? cb(null, true) : cb(new Error('CORS blocked'));
  },
  credentials: true,
}));

app.use(express.json());

app.get('/', (_req, res) => res.json({ service: 'Nexus Bank API', version: '2.4.1', status: 'operational' }));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/accounts',     require('./routes/accounts'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/statements',   require('./routes/statements'));
app.use('/api/profile',      require('./routes/profile'));
app.use('/api/support',      require('./routes/support'));
app.use('/api/admin',        require('./routes/admin'));

// FLAG09 — hidden internal endpoint, not documented
app.use('/api/v1/internal',  require('./routes/internal'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`[Nexus Bank API] :${PORT}`));
