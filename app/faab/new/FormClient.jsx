'use client';

import { useState } from 'react';

export default function FormClient({ teams }) {
  const [teamId, setTeamId] = useState(teams?.[0]?.id ?? '');
  const [type, setType] = useState('spend');         // spend | add | adjust
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0,16)); // local datetime-local default
  const [status, setStatus] = useState({ state: 'idle' });

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ state: 'submitting' });
    try {
      const res = await fetch('/api/faab/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          type,
          amount: Number(amount),
          description: description || null,
          // Convert from local datetime-local to ISO, if provided
          timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      setStatus({ state: 'success' });
      setAmount('');
      setDescription('');
    } catch (err) {
      setStatus({ state: 'error', error: String(err.message || err) });
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>New FAAB Transaction</h1>

      {!teams?.length ? (
        <p style={{ color: '#ffb347' }}>
          No teams found. Create Team entries in Contentful first (content type ID: <code>team</code>).
        </p>
      ) : null}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Team</span>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} required>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="spend">Spend</option>
            <option value="add">Add</option>
            <option value="adjust">Adjust</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Amount</span>
          <input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="e.g. 15"
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Description (optional)</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Waiver for Player X"
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Timestamp (defaults to now)</span>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={!teamId || !amount || status.state === 'submitting'}
          style={{ padding: '8px 12px', borderRadius: 8 }}
        >
          {status.state === 'submitting' ? 'Submitting…' : 'Create Transaction'}
        </button>
      </form>

      {status.state === 'success' && (
        <p style={{ color: '#7CFC00', marginTop: 10 }}>✅ Transaction created!</p>
      )}
      {status.state === 'error' && (
        <p style={{ color: '#ff8080', marginTop: 10 }}>Error: {status.error}</p>
      )}
    </div>
  );
}
