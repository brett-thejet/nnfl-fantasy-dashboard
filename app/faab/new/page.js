// app/faab/new/page.js (server component)
import { getContentfulClient } from "../../src/contentfulClient";
import NewFaabForm from "./NewFaabForm";

export const revalidate = 0; // always fresh when you open the form

async function fetchTeams() {
  const client = getContentfulClient();
  const res = await client.getEntries({ content_type: "team", order: "fields.name", limit: 1000 });
  return res.items.map((t) => ({
    id: t.sys.id,
    name: t.fields.name,
  }));
}

export default async function NewFaabPage() {
  const teams = await fetchTeams();

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto", fontFamily: "system-ui, -apple-system", color: "#e6f0ff" }}>
      <h1 style={{ margin: "8px 0 16px" }}>New FAAB Transaction</h1>
      <p style={{ marginBottom: 16, color: "#a8caff" }}>
        Create a transaction (debit = spend, credit = refund/adjust). Publishing happens automatically.
      </p>
      <NewFaabForm teams={teams} />
      <div style={{ marginTop: 24 }}>
        <a href="/faab" style={{ color: "#a8caff" }}>← Back to FAAB page</a>
      </div>
    </main>
  );
}
