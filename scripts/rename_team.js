/**
 * scripts/rename_team.js
 * Renames a Team (and its Manager) from OLD_NAME to NEW_NAME,
 * and sets the slug/handle to EXACT_SLUG.
 * References remain intact because IDs don't change.
 *
 * Usage:
 *   CONTENTFUL_SPACE_ID=xxxx CONTENTFUL_ENV_ID=master CONTENTFUL_MANAGEMENT_TOKEN=CFPAT_xxx \
 *   node scripts/rename_team.js
 */

const contentful = require('contentful-management');

const OLD_NAME = 'Sick Duckers';
const NEW_NAME = 'Slick Truckers';
const EXACT_SLUG = 'slickTruckers';

function l(v){ return { 'en-US': v }; }

async function run() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const envId = process.env.CONTENTFUL_ENV_ID || 'master';
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

  if (!spaceId || !token) {
    throw new Error('Missing env vars. Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN.');
  }

  const client = contentful.createClient({ accessToken: token });
  const space = await client.getSpace(spaceId);
  const env = await space.getEnvironment(envId);

  // --- TEAM: find by name, then update name + slug
  let teamRes = await env.getEntries({ content_type: 'team', 'fields.name': OLD_NAME, limit: 1 });
  let team = teamRes.items[0];
  if (!team) throw new Error(`Team not found with name "${OLD_NAME}".`);

  team.fields.name = l(NEW_NAME);
  team.fields.slug = l(EXACT_SLUG);
  team = await team.update();
  if (!team.isPublished()) await team.publish();
  console.log(`✅ Team updated → name="${NEW_NAME}", slug="${EXACT_SLUG}" (id=${team.sys.id})`);

  // --- MANAGER: try by displayName first; if not, try by prior handle guess
  let mgrRes = await env.getEntries({ content_type: 'manager', 'fields.displayName': OLD_NAME, limit: 1 });
  let mgr = mgrRes.items[0];

  if (!mgr) {
    // fallback: many seeds used a slugified handle "sick-duckers"
    const fallbackHandle = 'sick-duckers';
    mgrRes = await env.getEntries({ content_type: 'manager', 'fields.handle': fallbackHandle, limit: 1 });
    mgr = mgrRes.items[0];
  }

  if (mgr) {
    mgr.fields.displayName = l(NEW_NAME);
    mgr.fields.handle = l(EXACT_SLUG);
    mgr = await mgr.update();
    if (!mgr.isPublished()) await mgr.publish();
    console.log(`✅ Manager updated → displayName="${NEW_NAME}", handle="${EXACT_SLUG}" (id=${mgr.sys.id})`);
  } else {
    console.log('ℹ️ No matching Manager entry found—skipping manager update.');
  }

  console.log('\nDone. All relationships remain intact (IDs unchanged).');
}

run().catch(err => {
  console.error('❌ Rename failed:', err.message);
  process.exit(1);
});
