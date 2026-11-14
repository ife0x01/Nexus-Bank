const API   = import.meta.env.VITE_API_URL       || 'http://localhost:8000';
const ADMIN = import.meta.env.VITE_ADMIN_API_URL  || 'http://localhost:8001';

export const getStoredUser  = () => JSON.parse(localStorage.getItem('user')  || 'null');
export const getToken       = () => localStorage.getItem('token');
export const getLegacyToken = () => localStorage.getItem('legacyToken');

function hdrs(extra = {}) {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

async function req(url, opts = {}) {
  const res  = await fetch(url, { headers: hdrs(), ...opts });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const login         = (email, password)      => req(`${API}/api/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe         = ()                      => req(`${API}/api/auth/me`);
export const forgotPassword = (email)               => req(`${API}/api/auth/forgot-password`, { method: 'POST', body: JSON.stringify({ email }) });
export const resetPassword  = (token, password)     => req(`${API}/api/auth/reset-password`,  { method: 'POST', body: JSON.stringify({ token, password }) });

// ── Accounts ─────────────────────────────────────────────────────────────────
export const getAccounts        = ()      => req(`${API}/api/accounts`);
export const getAccountById     = (id)    => req(`${API}/api/accounts/${id}`);
export const getAccountSummary  = (id)    => req(`${API}/api/accounts/summary?accountId=${id}`);
export const getAccountTxns     = (id)    => req(`${API}/api/accounts/${id}/transactions`);

// ── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions    = ()      => req(`${API}/api/transactions`);
export const getReceipt         = (uuid)  => req(`${API}/api/transactions/receipt/${uuid}`);
export const transfer           = (body)  => req(`${API}/api/transactions/transfer`, { method: 'POST', body: JSON.stringify(body) });

// ── Statements ───────────────────────────────────────────────────────────────
export const getStatements      = ()      => req(`${API}/api/statements`);
export const getStatement       = (id)    => req(`${API}/api/statements/${id}`);
export const getStatementByRef  = (hash)  => req(`${API}/api/statements/ref/${hash}`);

// ── Profile ──────────────────────────────────────────────────────────────────
export const getProfile         = ()      => req(`${API}/api/profile`);
export const updateProfile      = (body)  => req(`${API}/api/profile`, { method: 'PUT', body: JSON.stringify(body) });
export const changePassword     = (uid, password) => req(`${API}/api/profile/password/${uid}`, { method: 'PUT', body: JSON.stringify({ password }) });

// ── Support ──────────────────────────────────────────────────────────────────
export const getTickets         = ()      => req(`${API}/api/support`);
export const createTicket       = (body)  => req(`${API}/api/support`, { method: 'POST', body: JSON.stringify(body) });

// ── Admin (vulnerability targets) ────────────────────────────────────────────
export const adminCustomers     = ()      => req(`${API}/api/admin/customers`);
export const adminOverview      = (tok)   => req(`${API}/api/admin/overview`,   { headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' } });
export const adminAuditLog      = ()      => req(`${API}/api/admin/audit-log`,  { headers: { Authorization: `Bearer ${getLegacyToken()}`, 'Content-Type': 'application/json' } });
export const adminPii           = ()      => req(`${API}/api/admin/pii`,        { headers: { ...hdrs(), Origin: 'null' } });
export const internalExport     = ()      => req(`${API}/api/v1/internal/export`);

// ── Admin API :8001 (vulnerability targets) ───────────────────────────────────
export const riskReport         = (tok)   => req(`${ADMIN}/internal/risk-report`,      { headers: { Authorization: `Bearer ${tok}`,         'Content-Type': 'application/json' } });
export const accountTakeover    = (tok)   => req(`${ADMIN}/internal/account-takeover`, { headers: { Authorization: `Bearer ${tok}`,         'Content-Type': 'application/json' } });
