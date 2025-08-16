import { createClient } from "contentful";

// wrap in a function so we can call it where needed
export function getContentfulClient() {
  return createClient({
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
  });
}
