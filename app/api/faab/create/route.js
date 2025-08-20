export const runtime = 'nodejs';        // use Node, not Edge
export const dynamic = 'force-dynamic'; // avoid caching

function badRequest(message, extras = {}) {
  return new Response(JSON.stringify({ ok: false, message, ...extras }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Robust loader: supports both ESM and CJS shapes
async function getCreateClient() {
  const mod = await import('contentful-management');
  const createClient =
    mod?.createClient ??
    mod?.default?.createClient ??
    null;
  if (!createClient) {
    throw new Error(
      'contentful-management.createClient not found. Check that "contentful-management" is installed and in dependencies.'
    );
  }
  return createClient;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { teamId, type, amount, description, timestamp } = body || {};

    if (!teamId) return badRequest('Missing teamId');
    if (!type) return badRequest('Missing type (one of: spend, add, adjust)');
    if (typeof amount !== 'number' || Number.isNaN(amount)) return badRequest('Amount must be a number');

    const token   = process.env.CONTENTFUL_CMA_TOKEN;
    const spaceId = process.env.CONTENTFUL_SPACE_ID;
    const envId   = process.env.CONTENTFUL_ENVIRONMENT || 'master';

    if (!token || !spaceId) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Missing CONTENTFUL_CMA_TOKEN or CONTENTFUL_SPACE_ID in env' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const createClient = await getCreateClient();
    const cma   = createClient({ accessToken: token });
    const space = await cma.getSpace(spaceId);
    const env   = await space.getEnvironment(envId);

    // Field IDs must match your Contentful model exactly
    const entry = await env.createEntry('faabTransaction', {
      fields: {
        team: { 'en-US': { sys: { type: 'Link', linkType: 'Entry', id: teamId } } },
        transactionType: { 'en-US': String(type) }, // <- your field ID (NOT "type")
        amount: { 'en-US': Number(amount) },
        description: { 'en-US': description ? String(description) : '' },
        timestamp: { 'en-US': timestamp ? new Date(timestamp).toISOString() : new Date().toISOString() },
      },
    });

    const published = await entry.publish();

    return new Response(JSON.stringify({ ok: true, id: published.sys.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err?.message || String(err);
    return new Response(JSON.stringify({ ok: false, message: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
