import { NextResponse } from 'next/server';
import { createClient } from 'contentful-management';

function bad(msg, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

export async function POST(req) {
  try {
    const { teamId, type, amount, description, timestamp } = await req.json();

    if (!process.env.CONTENTFUL_CMA_TOKEN) return bad('Missing CONTENTFUL_CMA_TOKEN on server', 500);
    if (!process.env.CONTENTFUL_SPACE_ID) return bad('Missing CONTENTFUL_SPACE_ID on server', 500);

    if (!teamId) return bad('teamId is required');
    if (!['spend', 'add'].includes(type)) return bad('type must be "spend" or "add"');
    const amt = Number(amount);
    if (!Number.isFinite(amt)) return bad('amount must be a number');

    const cma = createClient({ accessToken: process.env.CONTENTFUL_CMA_TOKEN });
    const space = await cma.getSpace(process.env.CONTENTFUL_SPACE_ID);
    const env = await space.getEnvironment('master'); // change if your env is not 'master'

    const entry = await env.createEntry('faabTransaction', {
      fields: {
        team: {
          'en-US': {
            sys: { type: 'Link', linkType: 'Entry', id: teamId }
          }
        },
        type: { 'en-US': type },
        amount: { 'en-US': amt },
        description: { 'en-US': description || '' },
        timestamp: { 'en-US': timestamp || new Date().toISOString() }
      }
    });

    const published = await entry.publish();
    return NextResponse.json({ ok: true, id: published.sys.id });
  } catch (err) {
    console.error('FAAB POST error', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
