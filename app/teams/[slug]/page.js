// app/teams/[slug]/page.js
import Link from "next/link";
import { getContentfulClient } from "../../../src/contentfulClient";

export const revalidate = 60; // ISR

function buildLogoUrl(entry, assetsMap) {
  const l = entry.fields.logo;
  let url = null;

  if (l?.fields?.file?.url) {
    const u = l.fields.file.url;
    url = (u.startsWith("http") ? "" : "https:") + u;
  } else if (l?.sys?.id && assetsMap[l.sys.id]?.fields?.file?.url) {
    const u = assetsMap[l.sys.id].fields.file.url;
    url = (u.startsWith("http") ? "" : "https:") + u;
  }

  return url;
}

async function fetchTeamBySlug(slug) {
  const client = getContentfulClient();

  const res = await client.getEntries({
    content_type: "team",
    "fields.slug": slug,
    include: 1,
    limit: 1,
  });

  if (!res.items.length) return null;

  const t = res.items[0];
  const assets = {};
  (res.includes?.Asset || []).forEach((a) => (assets[a.sys.id] = a));

  return {
    id: t.sys.id,
    name: t.fields.name,
    slug: t.fields.slug,
    logoUrl: buildLogoUrl(t, assets),
  };
}

export default async function TeamDetailPage({ params }) {
  const team = await fetchTeamBySlug(params.slug);

  if (!team) {
    return (
      <main style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, -apple-system" }}>
        <p>Team not found.</p>
        <p><Link href="/teams" style={{ color: "#60a5fa" }}>← Back to Teams</Link></p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, -apple-system" }}>
      <p><Link href="/teams" style={{ color: "#60a5fa" }}>← Back to Teams</Link></p>
      <h1 style={{ margin: "12px 0" }}>{team.name}</h1>
      {team.logoUrl ? (
        <img
          src={`${team.logoUrl}?w=256&h=256&fit=thumb&fm=webp&q=80`}
          alt={`${team.name} logo`}
          width={128}
          height={128}
          style={{ borderRadius: 12, objectFit: "cover" }}
        />
      ) : (
        <div style={{ width: 128, height: 128, background: "#f3f4f6", borderRadius: 12 }} />
      )}
      <div style={{ marginTop: 12, color: "#6b7280" }}>slug: {team.slug}</div>
    </main>
  );
}

