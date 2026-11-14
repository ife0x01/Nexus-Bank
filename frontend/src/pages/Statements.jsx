import React, { useState, useEffect } from 'react';
import { getStatements, getStatement } from '../api';

export default function Statements() {
  const [statements, setStatements] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [detail,     setDetail]     = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    getStatements().then(({ data }) => {
      setStatements(data || []);
      setLoading(false);
    });
  }, []);

  async function viewStatement(s) {
    setSelected(s);
    setDetail(null);
    const { data } = await getStatement(s.id);
    setDetail(data);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Statements</h1>
        <p className="page-sub">Download and view your monthly account statements</p>
      </div>

      <div className="grid-2">
        {/* Statement list */}
        <div className="card">
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Available Statements</h2>
          {loading ? (
            <p className="text-muted text-sm">Loading…</p>
          ) : statements.length === 0 ? (
            <p className="text-muted text-sm">No statements available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {statements.map(s => (
                <div
                  key={s.id}
                  className="card card-sm card-hover"
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderColor: selected?.id === s.id ? 'var(--blue)' : 'var(--border)'
                  }}
                  onClick={() => viewStatement(s)}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                      {new Date(s.period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-muted text-sm">
                      {s.account_type?.charAt(0).toUpperCase() + s.account_type?.slice(1)} — {s.account_number}
                    </div>
                  </div>
                  <div style={{ display: 'flex', align: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-green">Available</span>
                    <span style={{ color: 'var(--blue)', fontSize: '0.8rem' }}>View →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statement detail */}
        <div className="card">
          {!detail && !selected ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</div>
              <p>Select a statement to view details</p>
            </div>
          ) : !detail ? (
            <p className="text-muted text-sm">Loading statement…</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>
                    {new Date(detail.period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Statement
                  </h2>
                  <p className="text-muted text-sm">{detail.full_name} — {detail.account_number}</p>
                </div>
                <span className="badge badge-green">{detail.account_type}</span>
              </div>

              <div style={{ background: 'var(--elevated)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div className="section-title" style={{ marginBottom: '0.75rem' }}>Summary</div>
                {detail.summary?.split('|').map(line => (
                  <div key={line} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                    <span className="text-muted">{line.split(':')[0]?.trim()}</span>
                    <span style={{ fontWeight: 500 }}>{line.split(':')[1]?.trim()}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary btn-sm">⬇ Download PDF</button>
                <button className="btn btn-ghost btn-sm">✉ Email Statement</button>
              </div>

              <p className="text-muted text-sm" style={{ marginTop: '1rem' }}>
                Statement ID: <span className="mono">{detail.uuid?.slice(0,8)}…</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
