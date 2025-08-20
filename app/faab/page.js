// app/faab/page.js
import Link from "next/link";
import Image from "next/image";
import { getContentfulClient } from "@/src/contentfulClient";

export const revalidate = 60; // ISR: refresh FAAB every minute

function asUSD(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString()}`;
}

function computeBudgetSummary({ teams, transactions }) {
  // Build lookup by teamId
  const byTeam = new Map();

  // Seed with all teams (so teams with 0 txns still show)
  teams.forEach((t) => {
    byTeam.set(t.id, {
      team: t,
      starting: Number(t.startingFaab || 0),
      spent: 0,
      netChange: 0,
      txns: [],
    });
  });

  // Fold in transactions
  transactions.forEach((tx) => {
    const teamId = tx.team?.sys?.id || tx.teamId;
    if (!teamId) return;

    if (!byTeam.has(teamId)) {
      // team not in current list (edge case: orphaned txn) – create placeholder
      byTeam.set(teamId, {
        team: { id: teamId, name: "(Unknown team)", slug: "unknown", logoUrl: null, startingFaab: 0 },
        starting: 0,
        spent: 0,
        netChange: 0,
        txns: [],
      });
    }

    const bucket = byTeam.get(teamId);
    const amt = Number(tx.amount || 0);

    // Convention:
    //  - Negative amounts = spend (bids, fees) → increases "spent"
    //  - Positive amounts = refund/credit → reduces net spend
    if (amt < 0) bucket.spent += Math.abs(amt);
    bucket.netChange += amt; // netChange can be negative or positive
    bucket.txns.push(tx);
  });

  // Compute remaining = starting + netChange
  const rows = Array.from(byTeam.values()).map((r) => ({
    ...r,
    remaining: r.starting + r.netChange,
  }));

  // Sort by remaining desc
  rows.sort((a, b) => b.remaining - a.remaining);

  return rows;
}

async function fetchData() {
  const client = getContentfulClient();

  // 1) Teams (only the fields we need)
  const teamsRes = await client.getEntries({
    content_type: "team",
    select: [
      "fields.name",
      "fields.slug",
      "fields.logo",
      "fields.startingFaab",
    ].join(","),
    include: 1,
    order: "fields.name",
  });

  // Resolve team logo
  const assets = {};
  (teamsRes.includes?.Asset || []).forEach((a) => (assets[a.sys.id] = a));

  function logoUrlFrom(entry) {
    const l = entry.fields.logo;
    const f = l?.fields?.file ?? (l?.sys?.id ? assets[l.sys.id]?.fields?.file : null);
    const u = f?.url;
    return u ? (u.startsWith("http") ? u : `https:${u}`) : null;
  }

  const teams = teamsRes.items.map((t) => ({
    id: t.sys.id,
    name: t.fields.name,
    slug: t.fields.slug,
    startingFaab: t.fields.startingFaab ?? 0,
    logoUrl: logoUrlFrom(t),
  }));

  // 2) FAAB Transactions (with Team reference)
  const txRes = await client.getEntries({
    content_type: "faabTransaction",
    include: 2,
    order: "-fields.date", // newest first
  });

  const transactions = txRes.items.map((i) => ({
    id: i.sys.id,
    amount: i.fields.amount ?? 0,
    description: i.fields.description ?? "",
    date: i.fields.date ? new Date(i.fields.date) : null,
    team: i.fields.team, // reference
  }));

  return { teams, transactions };
}

export default async function FaabPage() {
  const { teams, transactions } = await fetchData();
  const rows = computeBudgetSummary({ teams, transactions });

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "system-ui, -apple-system" }}>
      <h1 style={{ marginBottom: 16 }}>FAAB</h1>

      {/* Summary table */}
      <section
        style={{
          background: "#151a30",
          border: "1px solid #243",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: "0 0 12px 0" }}>Budgets</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #243", padding: 8 }}>Team</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #243", padding: 8 }}>Starting</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #243", padding: 8 }}>Spent</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #243", padding: 8 }}>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ team, starting, spent, remaining }) => (
                <tr key={team.id}>
                  <td style={{ borderBottom: "1px solid #1e243b", padding: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {team.logoUrl ? (
                        <Image
                          src={`${team.logoUrl}?w=64&h=64&fit=thumb&fm=webp&q=80`}
                          alt={`${team.name} logo`}
                          width={28}
                          height={28}
                          style={{ borderRadius: 6, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: 28, height: 28, background: "#223", borderRadius: 6 }} />
                      )}
                      <Link href={`/teams/${team.slug}`} style={{ color: "#a8caff" }}>
                        {team.name}
                      </Link>
                    </div>
                  </td>
                  <td style={{ borderBottom: "1px solid #1e243b", padding: 8, textAlign: "right" }}>
                    {asUSD(starting)}
                  </td>
                  <td style={{ borderBottom: "1px solid #1e243b", padding: 8, textAlign: "right" }}>
                    {asUSD(spent)}
                  </td>
                  <td style={{ borderBottom: "1px solid #1e243b", padding: 8, textAlign: "right", fontWeight: 700 }}>
                    {asUSD(remaining)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>
          💡 Convention: **negative** transaction amounts are spends (bids/fees). **Positive** amounts are credits/refunds.
        </p>
      </section>

      {/* Transactions table */}
      <section
        style={{
          background: "#151a30",
          border: "1px solid #243",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h2 style={{ margin: "0 0 12px 0" }}>Transactions</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #243", padding: 8 }}>Date</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #243", padding: 8 }}>Team</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #243", padding: 8 }}>Description</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #243", padding: 8 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const teamRef = tx.team;
                const teamId = teamRef?.sys?.id;
                const team = teams.find((t) => t.id === teamId);
                return (
                  <tr key={tx.id}>
                    <td style={{ borderBottom: "1px solid #1e243b", padding: 8 }}>
                      {tx.date ? tx.date.toLocaleDateString() : ""}
                    </td>
                    <td style={{ borderBottom: "1px solid #1e243b", padding: 8 }}>
                      {team ? (
                        <Link href={`/teams/${team.slug}`} style={{ color: "#a8caff" }}>
                          {team.name}
                        </Link>
                      ) : (
                        "(Unknown team)"
                      )}
                    </td>
                    <td style={{ borderBottom: "1px solid #1e243b", padding: 8 }}>
                      {tx.description || "—"}
                    </td>
                    <td style={{ borderBottom: "1px solid #1e243b", padding: 8, textAlign: "right" }}>
                      {asUSD(tx.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 12 }}>
          ✍️ To add or adjust FAAB, create a <strong>FAAB Transaction</strong> entry in Contentful (choose team, set amount, date, description).
          The page will auto-update after publish (ISR within ~1 minute). We can add a secure write form later via a Netlify Function.
        </p>
      </section>
    </main>
  );
}
