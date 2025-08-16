// app/teams/page.js
import { createClient } from 'contentful';

export const revalidate = 60; // ISR: refresh data every 60s

function buildLogoUrl(entry, assetsMap) {
  const l = entry.fields.logo;
  let url = null;

  // Directly resolved
  if (l?.fields?.file?.url) {
    const u = l.fields.file.url;
    url = (u.startsWith('http') ? '' : 'https:') + u;
  }
  // Resolve via includes map
  else if (l?.sys?.id && assetsMap[l.sys.id]?.fields?.file?.url) {
    const u = assetsMap[l.sys.id].fields.file.url;
    url = (u.startsWith('http') ? '' : 'https:') + u;
  }

  return url;
}

async function fetchTeams() {
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_CDA_TOKEN,
    environment: 'master'
  });

  const res = await client.getEntries({
    content_type: 'team',
    include: 1,
    order: 'fields.name'
  });

  const assets = {};
  (res.includes?.Asset || []).forEach(a => (assets[a.sys.id] = a));

  return res.items.map(t => ({
    id: t.sys.id,
    name: t.fields.name,
    slug: t.fields.slug,
    logoUrl: buildLogoUrl(t, assets)
  }));
}

export default async function TeamsPage() {
  const teams = await fetchTeams();

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, -apple-system' }}>
      <h1 style={{ marginBottom: 16 }}>Teams</h1>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {teams.map(team => (
          <li key={team.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            {team.logoUrl ? (
              <img
                src={`${team.logoUrl}?w=96&h=96&fit=thumb&fm=webp&q=80`}
                alt={`${team.name} logo`}
                width="48"
                height="48"
                style={{ borderRadius: 8, objectFit: 'cover' }}
                decoding="async"
                loading="lazy"
              />
            ) : (
              <div style={{ width: 48, height: 48, background: '#f3f4f6', borderRadius: 8 }} />
            )}
            <div>
              <div style={{ fontWeight: 600 }}>{team.name}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{team.slug}</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

