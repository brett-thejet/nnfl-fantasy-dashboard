import { cookies } from "next/headers";

async function refreshAccessToken(refreshToken) {
  const cid = process.env.YAHOO_CLIENT_ID;
  const secret = process.env.YAHOO_CLIENT_SECRET;
  if (!cid || !secret) return null;

  const basic = Buffer.from(`${cid}:${secret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json;
}

async function fetchLeagues(accessToken) {
  // This endpoint returns your NFL leagues for the current game key
  const url = "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (res.status === 401) return { unauthorized: true };
  if (!res.ok) return { error: true, status: res.status, text: await res.text() };
  return { data: await res.json() };
}

export async function GET() {
  const c = cookies();
  let access = c.get("yahoo_access_token")?.value || "";
  const refresh = c.get("yahoo_refresh_token")?.value || "";
  const expiresAt = Number(c.get("yahoo_expires_at")?.value || "0");

  if (!access) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  // Refresh if expired or about to expire in <60s
  const now = Date.now();
  if (refresh && (isNaN(expiresAt) || expiresAt - now < 60_000)) {
    const newTok = await refreshAccessToken(refresh);
    if (newTok?.access_token) {
      access = newTok.access_token;
      const newExpires = now + (newTok.expires_in ?? 3600) * 1000;
      // Update cookies (httpOnly)
      c.set("yahoo_access_token", access, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
      c.set("yahoo_expires_at", String(newExpires), { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
      if (newTok.refresh_token) {
        c.set("yahoo_refresh_token", newTok.refresh_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
      }
    }
  }

  // Call Yahoo Fantasy and return JSON
  const result = await fetchLeagues(access);
  if (result.unauthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized; try signing in again." }), { status: 401 });
  }
  if (result.error) {
    return new Response(JSON.stringify({ error: "Yahoo API error", status: result.status, body: result.text }), { status: 502 });
  }
  return new Response(JSON.stringify(result.data), { status: 200, headers: { "Content-Type": "application/json" } });
}
