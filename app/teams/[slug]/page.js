import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentfulClient } from "../../../src/contentfulClient";

export const revalidate = 60; // ISR: refresh every 60s

function buildLogoUrl(entry, assetsMap) {
  const l = entry?.fields?.logo;
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

async function fetchAllSlugs() {
  const client = getContentfulClient();
  const res = await client.getEntries({
    content_type: "team",
    select: "fields.slug",
    limit: 1000,
  });
  return res.items
    .map((i) => i?.fields?.slug)
    .filter(Boolean)
    .map((slug) => ({ slug }));
}

async function fetchTeamBySlug(slug) {
  const client = getContentfulClient();
  const res = await client.getEntries({
    content_type: "team",
    "fields.slug": slug,
    include: 2,
    limit: 1,
  });

  if (!res.items?.length) return null;

  const team = res.items[0];
  const assets = {};
  (res.includes?.Asset || []).forEach((a) => (assets[a.sys.id] = a));

  return {
    id: team.sys.id,
    name: team.fields.name,
    slug: team.fields.slug,
    logoUrl: buildLogoUrl(team, assets),
  };
}

// Prebuild static routes for all current team slugs
export async function generateStaticParams() {
  return await fetchAllSlugs();
}

export default async function TeamPage({ params }) {
  const { slug } = params;
  const team = await fetchTeamBySlug(slug);

  if (!team) return notFound();

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, -apple-system" }}>
      <nav style={{ marginBottom: 16 }}>
        <Link href="/teams" style={{ color: "#a8caff", textDecoration: "none" }}>← Back to Teams</Link>
      </nav>

      <header style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        {team.logoUrl ? (
          <Image
            src={`${team.logoUrl}?w=256&h=256&fit=thumb&fm=webp&q=85`}
            alt={`${team.name} logo`}
            width={96}
            height={96}
            style={{ borderRadius: 12, objectFit: "cover" }}
            priority
          />
        ) : (
          <div style={{ width: 96, height: 96, background: "#f3f4f6", borderRadius: 12 }} />
        )}
        <div>
          <h1 style={{ margin: 0 }}>{team.name}</h1>
          <div style={{ color: "#6b7280" }}>{team.slug}</div>
        </div>
      </header>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>About this team</h2>
        <p>Team detail page is live. You can extend this with roster, record, FAAB, and more fields from Contentful.</p>
      </section>
    </main>
  );
}
