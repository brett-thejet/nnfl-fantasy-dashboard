// app/teams/[slug]/page.js
import { notFound } from 'next/navigation';
import client from '@/src/contentfulClient';

export const revalidate = 60; // ISR: refresh data every 60s

function buildLogoUrl(entry, assetsMap) {
  const l = entry.fields.logo;
  let url = null;

  if (l?.fields?.file?.url) {
    const u = l.fields.file.url;
    url = (u.startsWith('http') ? '' : 'https:') + u;
  } else if (l?.sys?.id && assetsMap[l.sys.id]?.fields?.file?.url) {
    const u = assetsMap[l.sys.id].fields.file.url;
    url = (u.startsWith('http') ? '' : 'https:') + u;
  }
  return url;
}

async function getTeamBySlug(slug) {
  const res = await client.getEntries({
    content_type: 'team',
    'fields.slug': slug,
    include: 1,
    limit: 1,
  });

  const t = res.items[0];
  if (!t) return null;

  const assets = {};
  (res.includes?.Asset || []).forEach(a => (assets[a.sys.id] = a));

  return {
    id: t.sys.id,
    name: t.fields.name,
    slug: t.fields.slug,
    logoUrl: buildLogoUrl(t, assets),
  };
}

// Prebuild all slugs at build time (and revalidate via ISR)
export async function generateStaticParams() {
  const res = await client.getEntries({
    content_type: 'team',
    select: 'fields.slug',
    limit: 1000,
  });

  return res.items
    .map(i => i.fields?.slug)
    .filter(Boolean)
    .map(slug => ({ slug }));
}

export default async function TeamPage({ params }) {
  const team = await getTeamBySlug(params.slug);
  if (!team) notFound();

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, -apple-system' }}>
      <a href="/teams" style={{ color: '#a8caff' }}>← Back to Teams</a>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 16 }}>
        {team.logoUrl ? (
          <img
            src={`${team.logoUrl}?w=200&h=200&fit=thumb&fm=webp&q=80`}
            alt={`${team.name} logo`}
            width={100}
            height={100}
            style={{ borderRadius: 12, objectFit: 'cover', background: '#111827' }}
          />
        ) : (
          <div style={{ width: 100, height: 100, borderRadius: 12, background: '#111827' }} />
        )}
        <div>
          <h1 style={{ margin: 0 }}>{team.name}</h1>
          <div style={{ color: '#9ca3af', fontSize: 14 }}>{team.slug}</div>
        </div>
      </div>

      {/* You can expand this section with standings, roster, schedule, etc. */}
      <section style={{ marginTop: 24, borderTop: '1px solid #243', paddingTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Team Details</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li><strong>Slug:</strong> {team.slug}</li>
          <li>
            <strong>Logo URL:</strong>{' '}
            <span style={{ color: '#9ca3af', wordBreak: 'break-all' }}>{team.logoUrl ?? '(none)'}</span>
          </li>
        </ul>
      </section>
    </main>
  );
}

