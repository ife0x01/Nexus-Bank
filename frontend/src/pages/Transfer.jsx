import React, { useState, useEffect } from 'react';
import { getAccounts, getTransactions, transfer } from '../api';

function fmt(n) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n); }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }

const CAT_ICON = {
  food:'☕', shopping:'🛍', transport:'🚗', entertainment:'🎬',
  utilities:'💡', groceries:'🛒', income:'💰', transfer:'💸',
  travel:'✈️', investment:'📈', default:'💳'
};

export default function Transfer() {
  const [accounts, setAccounts]   = useState([]);
  const [txns,     setTxns]       = useState([]);
  const [form,     setForm]       = useState({ fromAccountId: '', toAccount: '', amount: '', description: '' });
  const [result,   setResult]     = useState(null);
  const [error,    setError]      = useState('');
  const [loading,  setLoading]    = useState(false);

  useEffect(() => {
    getAccounts().then(({ data }) => {
      const accts = data || [];
      setAccounts(accts);
      if (accts.length > 0) setForm(p => ({ ...p, fromAccountId: String(accts[0].id) }));
    });
    getTransactions().then(({ data }) => setTxns(data || []));
  }, []);

  async function handleTransfer(e) {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    const { ok, data } = await transfer({
      fromAccountId: parseInt(form.fromAccountId),
      toAccountId:   form.toAccount || null,
      amount:        parseFloat(form.amount),
      description:   form.description,
    });
    setLoading(false);
    if (!ok) return setError(data.error || 'Transfer failed');
    setResult(data);
    setForm(p => ({ ...p, toAccount: '', amount: '', description: '' }));
    getTransactions().then(({ data: d }) => setTxns(d || []));
    getAccounts().then(({ data: d }) => setAccounts(d || []));
  }

  const fromAccount = accounts.find(a => String(a.id) === form.fromAccountId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transfer Funds</h1>
        <p className="page-sub">Send money to another account or pay a bill</p>
      </div>

      <div className="grid-2">
        {/* Transfer form */}
        <div>
          <div className="card">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem' }}>New Transfer</h2>
            {error  && <div className="alert alert-error">{error}</div>}
            {result && (
              <div className="alert alert-success">
                Transfer successful — Ref: <span className="mono">{result.reference}</span>
                <br />New balance: {fmt(result.new_balance)}
              </div>
            )}
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label>From Account</label>
                <select value={form.fromAccountId} onChange={e => setForm(p => ({ ...p, fromAccountId: e.target.value }))}>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} — {a.account_number} ({fmt(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Recipient Account Number</label>
                <input
                  placeholder="e.g. 4820-2008-7341"
                  value={form.toAccount}
                  onChange={e => setForm(p => ({ ...p, toAccount: e.target.value }))}
                  className="mono"
                />
              </div>
              <div className="form-group">
                <label>Amount (USD)</label>
                <input
                  type="number" min="0.01" step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                />
                {fromAccount && (
                  <p className="text-muted text-sm" style={{ marginTop: '0.4rem' }}>
                    Available: {fmt(fromAccount.balance)}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  placeholder="e.g. Rent payment, Invoice #1234"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary btn-full" disabled={loading || !form.fromAccountId || !form.amount}>
                {loading ? 'Processing…' : '↗ Send Transfer'}
              </button>
            </form>
          </div>

          {/* Routing info */}
          <div className="card card-sm" style={{ marginTop: '1rem' }}>
            <div className="section-title">Wire Transfer Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Routing Number</span>
                <span className="mono">021000021</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Bank Name</span>
                <span>Nexus Bank NA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">SWIFT/BIC</span>
                <span className="mono">NXBKUS33</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="card">
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem' }}>Transaction History</h2>
          {txns.length === 0 ? (
            <p className="text-muted text-sm">No transactions yet.</p>
          ) : (
            <div className="tx-list">
              {txns.map(t => (
                <div className="tx-item" key={t.id}>
                  <div className={`tx-icon cat-${t.category || 'default'}`}>
                    {CAT_ICON[t.category] || CAT_ICON.default}
                  </div>
                  <div className="tx-info">
                    <div className="tx-merchant">{t.merchant}</div>
                    <div className="tx-desc">{t.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className={`tx-amount ${parseFloat(t.amount) >= 0 ? 'credit' : 'debit'}`}>
                      {parseFloat(t.amount) >= 0 ? '+' : ''}{fmt(t.amount)}
                    </div>
                    <div className="tx-date">{fmtDate(t.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
