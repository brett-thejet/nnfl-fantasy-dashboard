import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const redirect = process.env.YAHOO_REDIRECT_URI; // must be https and match Yahoo app
  if (!clientId || !redirect) {
    return NextResponse.json({ error: "Missing env YAHOO_CLIENT_ID or YAHOO_REDIRECT_URI" }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: "code",
    scope: "fspt-r",
  });

  return NextResponse.redirect("https://api.login.yahoo.com/oauth2/request_auth?" + params.toString());
}
