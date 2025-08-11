export async function GET() {
  return new Response(JSON.stringify({
    YAHOO_CLIENT_ID: process.env.YAHOO_CLIENT_ID || "❌ Missing",
    YAHOO_CLIENT_SECRET: process.env.YAHOO_CLIENT_SECRET ? "✅ Exists" : "❌ Missing"
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
