import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { ok, data } = await login(form.email, form.password);
    setLoading(false);
    if (!ok) return setError(data.error || 'Sign in failed. Please check your credentials.');
    localStorage.setItem('token',       data.token);
    localStorage.setItem('legacyToken', data.legacyToken);
    localStorage.setItem('user',        JSON.stringify(data.user));
    navigate('/');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🏦</div>
          <div className="login-title">Nexus Bank</div>
          <div className="login-sub">Sign in to your account</div>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                autoFocus
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            Forgot your password? <span style={{ color: 'var(--blue)', cursor: 'pointer' }}>Contact support</span>
          </p>
        </div>

        {/* Dev credentials table — remove in production */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="section-title" style={{ marginBottom: '0.6rem' }}>Demo Accounts</div>
          <table className="data-table">
            <thead><tr><th>Email</th><th>Password</th></tr></thead>
            <tbody>
              {[
                ['john.smith@gmail.com',  'Banking@123'],
                ['sarah.jones@gmail.com', 'Banking@456'],
                ['mike.chen@gmail.com',   'Banking@789'],
                ['emma.wilson@gmail.com', 'Banking@321'],
              ].map(([e, p]) => (
                <tr key={e} style={{ cursor: 'pointer' }} onClick={() => setForm({ email: e, password: p })}>
                  <td className="mono" style={{ fontSize: '0.78rem' }}>{e}</td>
                  <td className="mono" style={{ fontSize: '0.78rem' }}>{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>Click a row to auto-fill</p>
        </div>
      </div>
    </div>
  );
}
