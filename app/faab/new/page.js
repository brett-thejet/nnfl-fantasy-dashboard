import { getContentfulClient } from '../../../src/contentfulClient'; // NOTE: correct 3-level path
import Image from 'next/image';

export const revalidate = 60;

async function fetchTeams() {
  const client = getContentfulClient();
  const res = await client.getEntries({ content_type: 'team', order: 'fields.name' });
  return res.items.map(t => ({
    id: t.sys.id,
    name: t.fields.name,
    slug: t.fields.slug,
    logo: t.fields.logo?.fields?.file?.url ? (t.fields.logo.fields.file.url.startsWith('http') ? t.fields.logo.fields.file.url : 'https:' + t.fields.logo.fields.file.url) : null
  }));
}

function TeamOption({ team }) {
  return (
    <option value={team.id}>
      {team.name}
    </option>
  );
}

function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{children}</label>
  );
}

export default async function NewFaabPage() {
  const teams = await fetchTeams();

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, -apple-system' }}>
      <h1 style={{ marginBottom: 16 }}>New FAAB Transaction</h1>
      <Form teams={teams} />
    </main>
  );
}

// Client component for the form
function Fieldset({ children }) {
  return <fieldset style={{ border: '1px solid #243', borderRadius: 12, padding: 16, marginBottom: 16 }}>{children}</fieldset>;
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>;
}

function Input({ id, ...props }) {
  return <input id={id} {...props} style={{ width: '100%', padding: 10, border: '1px solid #3a4963', borderRadius: 8, background: '#0b1020', color: '#e6f0ff' }} />;
}

function Select({ id, children, ...props }) {
  return <select id={id} {...props} style={{ width: '100%', padding: 10, border: '1px solid #3a4963', borderRadius: 8, background: '#0b1020', color: '#e6f0ff' }}>{children}</select>;
}

function Button(props) {
  return <button {...props} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #3a4963', background: '#182035', color: '#e6f0ff', cursor: 'pointer' }} />;
}

export const dynamic = 'force-dynamic';

function Result({ status }) {
  if (!status) return null;
  if (status.ok) return <p style={{ color: '#7CFC88' }}>Saved! Entry ID: {status.id}</p>;
  return <p style={{ color: '#ff8080' }}>Error: {status.error}</p>;
}

'use client';
import { useState } from 'react';

function Form({ teams }) {
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      teamId: form.get('teamId'),
      type: form.get('type'),
      amount: Number(form.get('amount')),
      description: form.get('description') || '',
      timestamp: form.get('timestamp') || new Date().toISOString()
    };

    try {
      const res = await fetch('/api/faab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      setStatus(json);
      if (json.ok) e.currentTarget.reset();
    } catch (err) {
      setStatus({ ok: false, error: err?.message || 'Network error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Fieldset>
        <Row>
          <div>
            <Label htmlFor="teamId">Team</Label>
            <Select id="teamId" name="teamId" required defaultValue="">
              <option value="" disabled>Choose a team</option>
              {teams.map(t => <TeamOption key={t.id} team={t} />)}
            </Select>
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select id="type" name="type" required defaultValue="spend">
              <option value="spend">spend</option>
              <option value="add">add</option>
            </Select>
          </div>
        </Row>
        <Row>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" min="0" step="1" required placeholder="e.g. 27" />
          </div>
          <div>
            <Label htmlFor="timestamp">Timestamp (optional)</Label>
            <Input id="timestamp" name="timestamp" type="datetime-local" />
          </div>
        </Row>
        <div style={{ marginTop: 12 }}>
          <Label htmlFor="description">Description (optional)</Label>
          <Input id="description" name="description" type="text" placeholder="e.g. Waiver claim for Player X" />
        </div>
      </Fieldset>
      <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Transaction'}</Button>
      <div style={{ marginTop: 12 }}><Result status={status} /></div>
    </form>
  );
}
