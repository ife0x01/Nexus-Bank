import React, { useState, useEffect } from 'react';
import { getAccounts, getAccountTxns } from '../api';

const CAT_ICON = {
  food:'☕', shopping:'🛍', transport:'🚗', entertainment:'🎬',
  utilities:'💡', groceries:'🛒', income:'💰', transfer:'💸',
  travel:'✈️', investment:'📈', default:'💳'
};
function fmt(n) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n); }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }

export default function Accounts() {
  const [accounts,  setAccounts]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [txns,      setTxns]      = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    getAccounts().then(({ data }) => {
      const accts = data || [];
      setAccounts(accts);
      setLoading(false);
      if (accts.length > 0) selectAccount(accts[0]);
    });
  }, []);

  async function selectAccount(acct) {
    setSelected(acct);
    setTxns([]);
    setTxLoading(true);
    const { data } = await getAccountTxns(acct.id);
    setTxns(data || []);
    setTxLoading(false);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Accounts</h1>
        <p className="page-sub">Manage your checking and savings accounts</p>
      </div>

      {loading ? <p className="text-muted">Loading…</p> : (
        <>
          {/* Account cards */}
          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            {accounts.map(a => (
              <div
                key={a.id}
                className={`account-card ${a.account_type === 'savings' ? 'savings' : ''}`}
                style={{ cursor: 'pointer', outline: selected?.id === a.id ? '2px solid rgba(59,130,246,0.6)' : 'none' }}
                onClick={() => selectAccount(a)}
              >
                <div>
                  <div className="account-type-badge">{a.account_type} account</div>
                  <div className="account-balance">{fmt(a.balance)}</div>
                  <div className="account-number">{a.account_number}</div>
                </div>
                <div className="account-meta">
                  <div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.15rem' }}>ROUTING</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.8 }}>{a.routing_number}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="card-chip">💳</div>
                    {a.network && <div className="card-network">{a.network}</div>}
                    {a.last_four && <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.7 }}>•••• {a.last_four}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Card details */}
          {selected && accounts.filter(a => a.last_four).map(a => a.id === selected.id ? (
            <div className="card" style={{ marginBottom: '1.5rem' }} key={a.id}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Card Details</h2>
              <div className="grid-2">
                {[
                  ['Card number',  `•••• •••• •••• ${a.last_four || '????'}`],
                  ['Card type',    a.card_type ? a.card_type.charAt(0).toUpperCase() + a.card_type.slice(1) : '—'],
                  ['Network',      a.network || '—'],
                  ['Expires',      a.expiry || '—'],
                  ['Status',       a.card_status || 'active'],
                  ['Currency',     a.currency || 'USD'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-muted text-sm">{label}</div>
                    <div style={{ fontWeight: 500, marginTop: '0.2rem', fontFamily: label === 'Card number' ? 'monospace' : 'inherit' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null)}

          {/* Transaction history */}
          {selected && (
            <div className="card">
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
                Transaction History — {selected.account_number}
              </h2>
              {txLoading ? (
                <p className="text-muted text-sm">Loading transactions…</p>
              ) : txns.length === 0 ? (
                <p className="text-muted text-sm">No transactions found.</p>
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
          )}
        </>
      )}
    </div>
  );
}
