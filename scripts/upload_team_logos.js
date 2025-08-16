// scripts/upload_team_logos.js
// Uploads team logo files from ./logos and links them to Team.logo
// Match is by filename (without extension) === Team.slug

const fs = require('fs');
const path = require('path');
const contentful = require('contentful-management');

const LOGOS_DIR = path.join(process.cwd(), 'logos');

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

function l(v) { return { 'en-US': v }; }

async function main() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const envId = process.env.CONTENTFUL_ENV_ID || 'master';
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  if (!spaceId || !token) throw new Error('Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN');

  if (!fs.existsSync(LOGOS_DIR)) throw new Error(`Logos folder not found at ${LOGOS_DIR}`);

  const files = fs.readdirSync(LOGOS_DIR).filter(f => MIME_BY_EXT[path.extname(f).toLowerCase()]);

  if (!files.length) { console.log('No images in ./logos'); return; }

  const client = contentful.createClient({ accessToken: token });
  const env = await (await client.getSpace(spaceId)).getEnvironment(envId);

  const results = { uploaded: 0, linked: 0, skipped: [], errors: [] };

  for (const file of files) {
    const filePath = path.join(LOGOS_DIR, file);
    const ext = path.extname(file).toLowerCase();
    const slug = path.basename(file, ext);
    const mime = MIME_BY_EXT[ext];

    try {
      const teamRes = await env.getEntries({ content_type: 'team', 'fields.slug': slug, limit: 1 });
      const team = teamRes.items[0];
      if (!team) { results.skipped.push(`${file} -> no team slug "${slug}"`); console.log(`⚠️  Skip ${file}: no team "${slug}"`); continue; }

      const upload = await env.createUpload({ file: fs.readFileSync(filePath) });

      const asset = await env.createAsset({
        fields: {
          title: l(`${(team.fields.name?.['en-US']) || slug} Logo`),
          description: l(`Logo for ${(team.fields.name?.['en-US']) || slug}`),
          file: l({
            fileName: file,
            contentType: mime,
            uploadFrom: { sys: { type: 'Link', linkType: 'Upload', id: upload.sys.id } }
          })
        }
      });

      const processed = await asset.processForAllLocales();
      const publishedAsset = processed.isPublished() ? processed : await processed.publish();
      results.uploaded++;

      // Link and ALWAYS publish the team so CDA sees the change
      team.fields.logo = l({ sys: { type: 'Link', linkType: 'Asset', id: publishedAsset.sys.id } });
      const updatedTeam = await team.update();
      await updatedTeam.publish(); // <-- always publish after update
      results.linked++;

      console.log(`✅ Linked ${file} → Team "${(team.fields.name?.['en-US']) || slug}"`);
    } catch (err) {
      console.error(`❌ Error ${file}:`, err.message);
      results.errors.push(`${file}: ${err.message}`);
    }
  }

  console.log('\n—— Summary ——');
  console.log(`Uploaded assets: ${results.uploaded}`);
  console.log(`Linked to teams: ${results.linked}`);
  if (results.skipped.length) console.log('Skipped:', results.skipped);
  if (results.errors.length)  console.log('Errors:', results.errors);
}

main().catch(e => { console.error('❌ Upload failed:', e.message); process.exit(1); });
