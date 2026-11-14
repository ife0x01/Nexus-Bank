import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser, getAccounts, getTransactions } from '../api';

const CAT_ICON = {
  food:'☕', shopping:'🛍', transport:'🚗', entertainment:'🎬',
  utilities:'💡', groceries:'🛒', income:'💰', transfer:'💸',
  travel:'✈️', investment:'📈', default:'💳'
};

function fmt(n) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n); }
function fmtDate(d) {
  const now = new Date(), dt = new Date(d), diff = (now - dt) / 86400000;
  if (diff < 1) return 'Today';
  if (diff < 2) return 'Yesterday';
  return dt.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

export default function Dashboard() {
  const user = getStoredUser();
  const [accounts, setAccounts]   = useState([]);
  const [txns, setTxns]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    Promise.all([getAccounts(), getTransactions()]).then(([a, t]) => {
      setAccounts(a.data || []);
      setTxns((t.data || []).slice(0, 8));
      setLoading(false);
    });
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0);
  const checking = accounts.find(a => a.account_type === 'checking');
  const savings  = accounts.find(a => a.account_type === 'savings');

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-sub">{new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
          </div>
          <Link to="/transfer">
            <button className="btn btn-primary">↗ New Transfer</button>
          </Link>
        </div>
      </div>

      {/* Total balance stat */}
      <div className="stat-grid">
        <div className="stat-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg,#1a3a6e,#0f2548)', borderColor: '#2a4a80' }}>
          <div className="stat-label" style={{ color: 'rgba(240,244,255,0.6)' }}>Total Balance</div>
          <div className="stat-value" style={{ fontSize: '2.2rem' }}>{loading ? '—' : fmt(totalBalance)}</div>
          <div className="stat-change pos">↑ Across all accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Checking</div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{checking ? fmt(checking.balance) : '—'}</div>
          <div className="text-muted text-sm" style={{ marginTop: '0.3rem' }}>{checking?.account_number || ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Savings</div>
          <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--green)' }}>{savings ? fmt(savings.balance) : '—'}</div>
          <div className="text-muted text-sm" style={{ marginTop: '0.3rem' }}>{savings?.account_number || ''}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Transfer', icon: '↗', to: '/transfer', color: '#3b82f6' },
          { label: 'Accounts', icon: '💳', to: '/accounts', color: '#10b981' },
          { label: 'Statements', icon: '📄', to: '/statements', color: '#f59e0b' },
          { label: 'Support', icon: '💬', to: '/support', color: '#8b5cf6' },
        ].map(a => (
          <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
            <div className="card card-sm" style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              cursor: 'pointer', minWidth: '130px',
              borderColor: 'var(--border)', transition: 'border-color .15s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ fontSize: '1.1rem' }}>{a.icon}</span>
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Transactions</h2>
          <Link to="/transfer" style={{ fontSize: '0.8rem', color: 'var(--blue)' }}>View all</Link>
        </div>
        {loading ? (
          <p className="text-muted text-sm">Loading transactions…</p>
        ) : txns.length === 0 ? (
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
                <div className="tx-date">{fmtDate(t.created_at)}</div>
                <div className={`tx-amount ${parseFloat(t.amount) >= 0 ? 'credit' : 'debit'}`}>
                  {parseFloat(t.amount) >= 0 ? '+' : ''}{fmt(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
