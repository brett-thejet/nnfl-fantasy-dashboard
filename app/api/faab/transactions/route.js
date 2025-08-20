import { NextResponse } from "next/server";
import contentfulManagement from "contentful-management";

export async function POST(req) {
  try {
    const body = await req.json();
    const { teamId, type, amount, description, transactionDate } = body || {};

    // Basic validation
    if (!teamId || !type || typeof amount !== "number" || Number.isNaN(amount)) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid fields (teamId, type, amount required)" },
        { status: 400 }
      );
    }
    if (!["debit", "credit"].includes(type)) {
      return NextResponse.json({ ok: false, error: "type must be 'debit' or 'credit'" }, { status: 400 });
    }

    // ENV required: CONTENTFUL_CMA_TOKEN, CONTENTFUL_SPACE_ID, (optional) CONTENTFUL_ENV
    const accessToken = process.env.CONTENTFUL_CMA_TOKEN;
    const spaceId = process.env.CONTENTFUL_SPACE_ID;
    const envId = process.env.CONTENTFUL_ENV || "master";

    if (!accessToken || !spaceId) {
      return NextResponse.json(
        { ok: false, error: "Server misconfigured: missing CONTENTFUL_CMA_TOKEN or CONTENTFUL_SPACE_ID" },
        { status: 500 }
      );
    }

    const mgmt = contentfulManagement.createClient({ accessToken });
    const space = await mgmt.getSpace(spaceId);
    const env = await space.getEnvironment(envId);

    const entry = await env.createEntry("faabTransaction", {
      fields: {
        team: {
          "en-US": {
            sys: { type: "Link", linkType: "Entry", id: teamId }
          }
        },
        type: { "en-US": type },
        amount: { "en-US": amount },
        description: { "en-US": description || "" },
        transactionDate: { "en-US": transactionDate || new Date().toISOString().slice(0, 10) } // YYYY-MM-DD
      }
    });

    const published = await entry.publish();

    return NextResponse.json({ ok: true, id: published.sys.id });
  } catch (err) {
    console.error("Create FAAB tx error:", err);
    return NextResponse.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}
