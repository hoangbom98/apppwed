// @ts-nocheck
import { useState } from 'react';

/**
 * TicketForm — create a new support ticket.
 *
 * Props:
 *   apiClient    {function} required — pre-configured axios instance
 *   onCreated    {function} optional — callback(ticket) after creation
 *   className    {string}   optional
 */
export default function TicketForm({ apiClient, onCreated, className = '' }) {
  const CATEGORIES = [
    { value: 'general', label: 'General' },
    { value: 'account', label: 'Account' },
    { value: 'payment', label: 'Payment' },
    { value: 'technical', label: 'Technical' },
    { value: 'complaint', label: 'Complaint' },
  ];
  const PRIORITIES = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const [form, setForm] = useState({ subject: '', description: '', category: 'general', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) { setError('Subject is required'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await apiClient.post('/support/tickets', form);
      const ticket = res.data?.data || res.data;
      setSuccess(true);
      setForm({ subject: '', description: '', category: 'general', priority: 'medium' });
      if (onCreated) onCreated(ticket);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={className} style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
        <h3 style={{ margin: 0, color: '#1f2328' }}>Ticket submitted!</h3>
        <p style={{ color: '#57606a', fontSize: 14 }}>We'll get back to you as soon as possible.</p>
        <button onClick={() => setSuccess(false)} style={{ marginTop: 12, padding: '8px 20px', background: '#3b82d4', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={className} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>New Support Ticket</h3>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 13 }}>{error}</div>}

      <label style={labelStyle}>
        Subject *
        <input
          value={form.subject}
          onChange={(e) => set('subject', e.target.value)}
          placeholder="Briefly describe your issue"
          style={inputStyle}
          required
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={labelStyle}>
          Category
          <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inputStyle}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Priority
          <select value={form.priority} onChange={(e) => set('priority', e.target.value)} style={inputStyle}>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>

      <label style={labelStyle}>
        Description
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={5}
          placeholder="Please provide as much detail as possible…"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      <button type="submit" disabled={submitting} style={{ padding: '10px 20px', background: '#3b82d4', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
        {submitting ? 'Submitting…' : 'Submit Ticket'}
      </button>
    </form>
  );
}

const labelStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500, color: '#1f2328' };
const inputStyle = { marginTop: 2, padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' };
