import { getContentfulClient } from '../../../src/contentfulClient';
import FormClient from './FormClient';

export const revalidate = 60;

async function fetchTeams() {
  const client = getContentfulClient();
  const res = await client.getEntries({ content_type: 'team', order: 'fields.name' });
  return res.items.map(t => ({
    id: t.sys.id,
    name: t.fields.name,
    slug: t.fields.slug,
  }));
}

export default async function NewFaabPage() {
  const teams = await fetchTeams();

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, -apple-system' }}>
      <h1 style={{ marginBottom: 16 }}>New FAAB Transaction</h1>
      <FormClient teams={teams} />
    </main>
  );
}
