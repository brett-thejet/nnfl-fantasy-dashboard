import { getContentfulClient } from '../../../src/contentfulClient';
import FormClient from './FormClient';

export const dynamic = 'force-dynamic'; // ensure fresh fetch in Netlify builds
export const revalidate = 0;

async function getTeams() {
  const client = getContentfulClient();
  const res = await client.getEntries({
    content_type: 'team',
    select: ['sys.id', 'fields.name'].join(','),
    order: 'fields.name',
    limit: 1000,
  });
  return (res.items || []).map((item) => ({
    id: item.sys.id,
    name: item.fields?.name || 'Unnamed Team',
  }));
}

export default async function Page() {
  let teams = [];
  try {
    teams = await getTeams();
  } catch (e) {
    // Render a helpful error instead of crashing the page
    return (
      <main style={{ maxWidth: 720, margin: '2rem auto', padding: 16 }}>
        <h1>New FAAB Transaction</h1>
        <p style={{ color: '#ff8080' }}>
          Failed to load teams from Contentful. Check CDA env vars and content model.
        </p>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#111', padding: 12, borderRadius: 8 }}>
          {String(e)}
        </pre>
      </main>
    );
  }
  return <FormClient teams={teams} />;
}
