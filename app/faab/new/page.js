'use client';

import { useEffect, useMemo, useState } from 'react';
import client from '@/src/contentfulClient';

async function fetchTeams() {
  const res = await client.getEntries({
    content_type: 'team',
    select: ['fields.name', 'fields.slug'],
    order: 'fields.name',
  });
  return (res.items || []).map(t => ({
    id: t.sys.id,
    name: t.fields.name,
    slug: t.fields.slug,
  }));
}

function toISOIfProvided(localDtString) {
  if (!localDtString) return undefined;
  const d = new Date(localDtString);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function NewFaabPage() {
  const [teams, setTeams] = useState([]);
  const [status, setStatus] = useState({ state: 'idle' });

  useEffect(() => {
    fetchTeams().then(setTeams).catch(() => setTeams([]));
  }, []);

  const defaultLocal = useMemo(() => {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}`;
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const teamId = form.get('teamId');
    const type = form.get('type');
    const amount = Number(form.get('amount'));
    const description = form.get('description') || undefined;
    const tsLocal = form.get('timestamp');
    const timestamp = toISOIfProvided(tsLocal);

    setStatus({ state: 'saving' });

    try {
      const res = await fetch('/api/faab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, type, amount, description, timestamp }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to save');
      setStatus({ state: 'saved', id: json.id });
      e.currentTarget.reset();
    } catch (err) {
      setStatus({ state: 'error', error: err.message });
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>New FAAB Transaction</h1>
      <p style={{ marginTop: 0, color: '#6b7280' }}>
        Create a Contentful <code>FaabTransaction</code>. Timestamp defaults to “now” if left blank.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, border: '1px solid #e5e7eb', padding: 16, borderRadius: 12 }}>
        <label>
          <div>Team</div>
          <select name="teamId" required defaultValue="">
            <option value="" disabled>Select a team…</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label>
          <div>Type</div>
          <select name="type" required defaultValue="spend">
            <option value="spend">spend</option>
            <option value="add">add</option>
          </select>
        </label>

        <label>
          <div>Amount</div>
          <input name="amount" type="number" min="0" step="1" required placeholder="e.g. 12" />
        </label>

        <label>
          <div>Description (optional)</div>
          <input name="description" type="text" placeholder="e.g. Waiver claim for WR" />
        </label>

        <label>
          <div>Timestamp (optional)</div>
          <input
            name="timestamp"
            type="datetime-local"
            defaultValue={defaultLocal}
          />
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Leave blank to use the server default (current time).
          </div>
        </label>

        <button
          type="submit"
          disabled={status.state === 'saving'}
          style={{ padding: '8px 12px', borderRadius: 8, background: '#111827', color: 'white', border: 0 }}
        >
          {status.state === 'saving' ? 'Saving…' : 'Create Transaction'}
        </button>
      </form>

      {status.state === 'saved' && (
        <p style={{ color: '#10b981', marginTop: 12 }}>
          Saved! Entry ID: <code>{status.id}</code>
        </p>
      )}
      {status.state === 'error' && (
        <p style={{ color: '#ef4444', marginTop: 12 }}>
          Error: {status.error}
        </p>
      )}
    </main>
  );
}
