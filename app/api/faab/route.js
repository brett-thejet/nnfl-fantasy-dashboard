import { NextResponse } from 'next/server';
import contentfulManagement from 'contentful-management';

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;
const CMA_TOKEN = process.env.CONTENTFUL_CMA_TOKEN;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || 'master';
const LOCALE = 'en-US';
const CONTENT_TYPE_ID = 'faabTransaction';

function pickFieldId(fields, candidates) {
  const set = new Set(fields.map(f => f.id));
  for (const id of candidates) {
    if (set.has(id)) return id;
  }
  return null;
}

export async function POST(req) {
  try {
    if (!SPACE_ID || !CMA_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'Missing Contentful env vars (CONTENTFUL_SPACE_ID, CONTENTFUL_CMA_TOKEN)' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { teamId, type, amount, description, timestamp } = body || {};

    if (!teamId || !amount || !Number.isFinite(Number(amount))) {
      return NextResponse.json(
        { ok: false, error: 'teamId and numeric amount are required' },
        { status: 400 }
      );
    }

    // Create CMA client
    const client = contentfulManagement.createClient({ accessToken: CMA_TOKEN });
    const space = await client.getSpace(SPACE_ID);
    const env = await space.getEnvironment(ENV_ID);

    // Introspect the content type to find actual field IDs
    const ct = await env.getContentType(CONTENT_TYPE_ID);
    const fields = ct.fields || [];

    const teamFieldId = pickFieldId(fields, ['team', 'teams', 'ownerTeam']);
    const typeFieldId = pickFieldId(fields, ['type', 'transactionType', 'faabType']);
    const amountFieldId = pickFieldId(fields, ['amount', 'faabAmount']);
    const descFieldId = pickFieldId(fields, ['description', 'note', 'details']);
    const tsFieldId = pickFieldId(fields, ['timestamp', 'date', 'createdAt']);

    if (!teamFieldId) {
      return NextResponse.json(
        { ok: false, error: `No suitable Team reference field found on "${CONTENT_TYPE_ID}". Tried team/teams/ownerTeam.` },
        { status: 422 }
      );
    }
    if (!amountFieldId) {
      return NextResponse.json(
        { ok: false, error: `No numeric amount field found on "${CONTENT_TYPE_ID}". Tried amount/faabAmount.` },
        { status: 422 }
      );
    }
    if (!typeFieldId) {
      return NextResponse.json(
        { ok: false, error: `No type field found on "${CONTENT_TYPE_ID}". Tried type/transactionType/faabType.` },
        { status: 422 }
      );
    }

    // Build payload with server-side defaults
    const nowIso = new Date().toISOString();
    const fieldsPayload = {
      [teamFieldId]: {
        [LOCALE]: {
          sys: { type: 'Link', linkType: 'Entry', id: String(teamId) }
        }
      },
      [typeFieldId]: {
        [LOCALE]: String(type || 'spend')
      },
      [amountFieldId]: {
        [LOCALE]: Number(amount)
      }
    };

    if (descFieldId && description) {
      fieldsPayload[descFieldId] = { [LOCALE]: String(description) };
    }
    if (tsFieldId) {
      fieldsPayload[tsFieldId] = { [LOCALE]: String(timestamp || nowIso) };
    }

    // Create & publish entry
    const entry = await env.createEntry(CONTENT_TYPE_ID, { fields: fieldsPayload });
    const published = await entry.publish();

    return NextResponse.json({ ok: true, id: published.sys.id });
  } catch (err) {
    const status = err?.status || 500;
    const msg = err?.message || 'Unknown error';
    return NextResponse.json(
      { ok: false, error: msg, raw: err?.response?.data || null },
      { status }
    );
  }
}
