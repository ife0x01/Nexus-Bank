import React, { useState, useEffect } from 'react';
import { getTickets, createTicket } from '../api';

const STATUS_BADGE = { open: 'badge-blue', resolved: 'badge-green', in_progress: 'badge-amber' };

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [form,    setForm]    = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    const { data } = await getTickets();
    setTickets(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.subject.trim() || !form.message.trim()) return setError('Subject and message are required.');
    setSending(true);
    const { ok, data } = await createTicket(form);
    setSending(false);
    if (!ok) return setError(data.error || 'Failed to submit ticket');
    setSuccess('Your support request has been submitted. We\'ll respond within 1-2 business days.');
    setForm({ subject: '', message: '' });
    loadTickets();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Support Center</h1>
        <p className="page-sub">Get help with your account or report an issue</p>
      </div>

      <div className="grid-2">
        {/* New ticket */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem' }}>Submit a Request</h2>
            {success && <div className="alert alert-success">{success}</div>}
            {error   && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject</label>
                <input
                  placeholder="e.g. Unauthorized charge, Card issue, Transfer problem"
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  rows={5}
                  placeholder="Please describe your issue in detail, including any relevant dates, amounts, or reference numbers."
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary" disabled={sending}>
                {sending ? 'Submitting…' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* Contact info */}
          <div className="card card-sm">
            <div className="section-title" style={{ marginBottom: '0.75rem' }}>Other Ways to Reach Us</div>
            {[
              { icon: '📞', label: '24/7 Phone Support', value: '1-800-NEXUS-00' },
              { icon: '💬', label: 'Live Chat',          value: 'Available 8am–10pm ET' },
              { icon: '🏢', label: 'Branch Locator',     value: 'Find a branch near you' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>{c.icon}</span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{c.label}</div>
                  <div className="text-muted text-sm">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket history */}
        <div className="card">
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Your Requests</h2>
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💬</div>
              <p className="text-sm">No support requests yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tickets.map(t => (
                <div key={t.id} className="card card-sm" style={{ padding: '0.9rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{t.subject}</div>
                    <span className={`badge ${STATUS_BADGE[t.status] || 'badge-blue'}`}>{t.status?.replace('_',' ')}</span>
                  </div>
                  <p className="text-muted text-sm" style={{ marginBottom: '0.4rem' }}>{t.message.slice(0, 100)}{t.message.length > 100 ? '…' : ''}</p>
                  <p className="text-faint text-sm">
                    Ticket #{t.id} · {new Date(t.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
