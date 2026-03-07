import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Token exchange URLs for each platform
const TOKEN_CONFIG: Record<string, {
  tokenUrl: string;
  useBasicAuth?: boolean; // Twitter requires Basic auth header
}> = {
  facebook: { tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token" },
  instagram: { tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token" },
  twitter: { tokenUrl: "https://api.twitter.com/2/oauth2/token", useBasicAuth: true },
  linkedin: { tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken" },
  youtube: { tokenUrl: "https://oauth2.googleapis.com/token" },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const config = TOKEN_CONFIG[platform];

  if (!config) {
    return new NextResponse(renderHTML("Error", `Unknown platform: ${platform}`, true), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return new NextResponse(
      renderHTML("Authorization Denied", `The platform returned an error: ${error}. Please try again.`, true),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (!code) {
    return new NextResponse(
      renderHTML("Missing Code", "No authorization code was received. Please try connecting again.", true),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    // Fetch stored credentials
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (!settings) throw new Error("Settings not found");

    const clientIdField = `${platform}ClientId` as keyof typeof settings;
    const clientSecretField = `${platform}ClientSecret` as keyof typeof settings;
    const clientId = settings[clientIdField] as string;
    const clientSecret = settings[clientSecretField] as string;

    if (!clientId || !clientSecret) {
      throw new Error(`Missing credentials for ${platform}`);
    }

    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/callback/${platform}`;

    // Exchange authorization code for access token
    const tokenBody: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    };

    // Twitter PKCE requires code_verifier
    if (platform === "twitter") {
      tokenBody.code_verifier = "challenge";
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    // Twitter uses Basic auth
    if (config.useBasicAuth) {
      headers["Authorization"] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
      delete tokenBody.client_id;
      delete tokenBody.client_secret;
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(tokenBody).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error(`[OAuth] Token exchange failed for ${platform}:`, tokenData);
      throw new Error(tokenData.error_description || tokenData.error || "Token exchange failed");
    }

    // Extract the access token (field name varies by platform)
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    if (!accessToken) {
      throw new Error("No access token in response");
    }

    // Save to database
    const updateData: Record<string, string> = {};
    const tokenField = `${platform}AccessToken` as string;
    updateData[tokenField] = accessToken;

    if (platform === "youtube" && refreshToken) {
      updateData["youtubeRefreshToken"] = refreshToken;
    }

    await prisma.settings.upsert({
      where: { id: "default" },
      update: updateData,
      create: { id: "default", ...updateData },
    });

    console.log(`[OAuth] Successfully connected ${platform}!`);

    // Return success HTML that auto-closes and notifies the parent window
    return new NextResponse(
      renderHTML(
        "Connected!",
        `Your ${platform.charAt(0).toUpperCase() + platform.slice(1)} account has been connected successfully. This window will close automatically.`,
        false
      ),
      { headers: { "Content-Type": "text/html" } }
    );

  } catch (err: any) {
    console.error(`[OAuth] Callback error for ${platform}:`, err);
    return new NextResponse(
      renderHTML("Connection Failed", err.message || "An unknown error occurred during authentication.", true),
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

// Renders a styled HTML page for the OAuth popup window
function renderHTML(title: string, message: string, isError: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${title} — Volts Calendar</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #08090c;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #0f1117;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 40px;
      max-width: 400px;
      text-align: center;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    p { color: #9ca3af; font-size: 14px; line-height: 1.6; }
    .error { color: #f87171; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isError ? "❌" : "✅"}</div>
    <h1>${title}</h1>
    <p${isError ? ' class="error"' : ""}>${message}</p>
  </div>
  <script>
    ${!isError ? `
      // Notify parent window and close after 2 seconds
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth-success', platform: '${title.includes("Connected") ? "connected" : ""}' }, '*');
      }
      setTimeout(() => window.close(), 2000);
    ` : `
      // Allow manual close after 5 seconds
      setTimeout(() => {
        document.querySelector('p').innerHTML += '<br><br><a href="#" onclick="window.close()" style="color: #60a5fa;">Close this window</a>';
      }, 1000);
    `}
  </script>
</body>
</html>`;
}
