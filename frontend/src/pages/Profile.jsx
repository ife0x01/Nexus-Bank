import React, { useState, useEffect } from 'react';
import { getStoredUser, getProfile, updateProfile, changePassword } from '../api';

export default function Profile() {
  const storedUser = getStoredUser();
  const [profile,   setProfile]  = useState(null);
  const [form,      setForm]     = useState({ full_name: '', phone: '', address: '' });
  const [pwForm,    setPwForm]   = useState({ password: '', confirm: '' });
  const [saving,    setSaving]   = useState(false);
  const [pwSaving,  setPwSaving] = useState(false);
  const [msg,       setMsg]      = useState('');
  const [pwMsg,     setPwMsg]    = useState('');
  const [error,     setError]    = useState('');

  useEffect(() => {
    getProfile().then(({ data }) => {
      setProfile(data);
      setForm({ full_name: data.full_name || '', phone: data.phone || '', address: data.address || '' });
    });
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true); setMsg(''); setError('');
    const { ok, data } = await updateProfile(form);
    setSaving(false);
    ok ? setMsg('Profile updated successfully.') : setError(data.error || 'Update failed');
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pwForm.password !== pwForm.confirm) return setPwMsg('error:Passwords do not match');
    if (pwForm.password.length < 8) return setPwMsg('error:Password must be at least 8 characters');
    setPwSaving(true); setPwMsg('');
    const { ok, data } = await changePassword(storedUser?.id, pwForm.password);
    setPwSaving(false);
    setPwMsg(ok ? 'success:Password changed successfully.' : `error:${data.error || 'Failed'}`);
    if (ok) setPwForm({ password: '', confirm: '' });
  }

  const initials = storedUser?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Account Settings</h1>
        <p className="page-sub">Manage your personal information and security</p>
      </div>

      {/* Profile header */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.4rem', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{profile?.full_name || storedUser?.name}</div>
          <div className="text-muted text-sm">{profile?.email || storedUser?.email}</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
            <span className="badge badge-green">{profile?.kyc_status || 'verified'}</span>
            <span className="badge badge-blue">{profile?.role || 'customer'}</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Personal info */}
        <div className="card">
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem' }}>Personal Information</h2>
          {msg   && <div className="alert alert-success">{msg}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={saveProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input value={profile?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="+1-555-000-0000" />
            </div>
            <div className="form-group">
              <label>Mailing Address</label>
              <textarea value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} rows={2} />
            </div>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </form>
        </div>

        {/* Security */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem' }}>Change Password</h2>
            {pwMsg && (
              <div className={`alert ${pwMsg.startsWith('error:') ? 'alert-error' : 'alert-success'}`}>
                {pwMsg.replace(/^(error|success):/, '')}
              </div>
            )}
            <form onSubmit={savePassword}>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={pwForm.password} onChange={e => setPwForm(p => ({...p, password: e.target.value}))} placeholder="••••••••••" />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} placeholder="••••••••••" />
              </div>
              <button className="btn btn-primary" disabled={pwSaving}>{pwSaving ? 'Updating…' : 'Update Password'}</button>
            </form>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Account Security</h2>
            {[
              { label: 'Two-Factor Authentication', status: 'Disabled', action: 'Enable', badge: 'badge-amber' },
              { label: 'Login Notifications',        status: 'Enabled',  action: 'Manage', badge: 'badge-green' },
              { label: 'Biometric Login',            status: 'Disabled', action: 'Set up', badge: 'badge-amber' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.label}</div>
                  <span className={`badge ${item.badge}`} style={{ marginTop: '0.25rem' }}>{item.status}</span>
                </div>
                <button className="btn btn-ghost btn-sm">{item.action}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
