import { NextResponse } from 'next/server';
import { createFaabTransaction } from '../../../src/contentfulMgmt';

export async function POST(request) {
  try {
    const { teamId, type, amount, description, timestamp } = await request.json();

    if (!teamId || !type || typeof amount !== 'number') {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: teamId, type, amount' },
        { status: 400 }
      );
    }

    const id = await createFaabTransaction({
      teamId,
      type,
      amount,
      description,
      timestamp
    });

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (err) {
    // Bubble up Contentful error text if present
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
