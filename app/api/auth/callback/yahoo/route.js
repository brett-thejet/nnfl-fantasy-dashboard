import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function exchangeCodeForTokens(code) {
  const cid = process.env.YAHOO_CLIENT_ID;
  const secret = process.env.YAHOO_CLIENT_SECRET;
  const redirect = process.env.YAHOO_REDIRECT_URI;
  if (!cid || !secret || !redirect) {
    return { error: "Missing Yahoo env vars" };
  }

  const basic = Buffer.from(`${cid}:${secret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirect,
  });

  const res = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const json = await res.json();
  if (!res.ok) {
    return { error: "Token exchange failed", details: json };
  }
  return json;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const err = searchParams.get("error");
  if (err) {
    return NextResponse.redirect(new URL(`/auth-error?msg=${encodeURIComponent(err)}`, req.url));
  }
  if (!code) {
    return NextResponse.json({ error: "Missing ?code" }, { status: 400 });
  }

  const tokens = await exchangeCodeForTokens(code);
  if (tokens.error) {
    return NextResponse.json(tokens, { status: 500 });
  }

  const c = cookies();
  const now = Date.now();
  const expiresAt = now + (tokens.expires_in ?? 3600) * 1000;

  // Store tokens in HTTP-only cookies
  c.set("yahoo_access_token", tokens.access_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  if (tokens.refresh_token) {
    c.set("yahoo_refresh_token", tokens.refresh_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  }
  c.set("yahoo_expires_at", String(expiresAt), { httpOnly: true, secure: true, sameSite: "lax", path: "/" });

  // Send user somewhere useful; change this if you have a leagues page
  return NextResponse.redirect(new URL("/api/leagues", req.url));
}
