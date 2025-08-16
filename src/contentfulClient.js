import { createClient } from "contentful";

/**
 * Returns a Contentful CDA client using server/env vars.
 * Works with either:
 * - CONTENTFUL_SPACE_ID / CONTENTFUL_CDA_TOKEN   (Netlify recommended)
 * - NEXT_PUBLIC_CONTENTFUL_SPACE_ID / NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN (fallback)
 */
export function getContentfulClient() {
  const space =
    process.env.CONTENTFUL_SPACE_ID ||
    process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;

  const accessToken =
    process.env.CONTENTFUL_CDA_TOKEN ||
    process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;

  if (!space || !accessToken) {
    throw new Error(
      `Contentful env vars missing at build time.
space: ${space ? "SET" : "MISSING"}
accessToken: ${accessToken ? "SET" : "MISSING"}
Expected either:
  - CONTENTFUL_SPACE_ID and CONTENTFUL_CDA_TOKEN (preferred)
  -or-
  - NEXT_PUBLIC_CONTENTFUL_SPACE_ID and NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN`
    );
  }

  return createClient({ space, accessToken });
}

// keep both named and default exports usable
export default getContentfulClient;
