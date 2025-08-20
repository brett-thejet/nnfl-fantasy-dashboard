import contentfulManagement from 'contentful-management';

/**
 * Get a Contentful Management "environment" object.
 * Requires env vars:
 *   - CONTENTFUL_CMA_TOKEN
 *   - CONTENTFUL_SPACE_ID
 * Optional:
 *   - CONTENTFUL_ENVIRONMENT_ID (defaults to "master")
 */
export async function getCmaEnvironment() {
  const token = process.env.CONTENTFUL_CMA_TOKEN;
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const envId = process.env.CONTENTFUL_ENVIRONMENT_ID || 'master';

  if (!token) throw new Error('Missing env: CONTENTFUL_CMA_TOKEN');
  if (!spaceId) throw new Error('Missing env: CONTENTFUL_SPACE_ID');

  const client = contentfulManagement.createClient({ accessToken: token });
  const space = await client.getSpace(spaceId);
  return space.getEnvironment(envId);
}

/**
 * Create + publish a faabTransaction entry.
 * Fields expected in Contentful:
 *   - team (Entry link to Team)
 *   - transactionType ("spend" | "add")
 *   - amount (Number)
 *   - description (Text, optional)
 *   - timestamp (DateTime)
 */
export async function createFaabTransaction({ teamId, type, amount, description, timestamp }) {
  const env = await getCmaEnvironment();

  const fields = {
    team: {
      'en-US': { sys: { type: 'Link', linkType: 'Entry', id: teamId } }
    },
    transactionType: {
      'en-US': type
    },
    amount: {
      'en-US': amount
    },
    timestamp: {
      'en-US': timestamp || new Date().toISOString()
    }
  };
  if (description) {
    fields.description = { 'en-US': description };
  }

  const entry = await env.createEntry('faabTransaction', { fields });
  const published = await entry.publish();
  return published.sys.id;
}
