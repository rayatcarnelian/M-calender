import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// OAuth 2.0 configuration for each platform
const OAUTH_CONFIG: Record<string, {
  authUrl: string;
  scopes: string;
  responseType: string;
  extraParams?: Record<string, string>;
}> = {
  facebook: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    scopes: "pages_manage_posts,pages_read_engagement,public_profile",
    responseType: "code",
  },
  instagram: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    scopes: "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
    responseType: "code",
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    scopes: "tweet.read tweet.write users.read offline.access",
    responseType: "code",
    extraParams: { code_challenge: "challenge", code_challenge_method: "plain" },
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    scopes: "openid profile w_member_social",
    responseType: "code",
  },
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
    responseType: "code",
    extraParams: { access_type: "offline", prompt: "consent" },
  },
};

// GET: Initiate OAuth flow — redirects the browser to the platform's login page
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const config = OAUTH_CONFIG[platform];

  if (!config) {
    return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
  }

  // Fetch the stored client ID for this platform
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  if (!settings) {
    return NextResponse.json({ error: "No settings found. Please set up your Client ID first." }, { status: 400 });
  }

  const clientIdField = `${platform === "youtube" ? "youtube" : platform}ClientId` as keyof typeof settings;
  const clientId = settings[clientIdField] as string | null;

  if (!clientId) {
    return NextResponse.json({
      error: `No Client ID found for ${platform}. Please enter your Client ID in the Integrations panel first.`,
    }, { status: 400 });
  }

  // Build the redirect URI (our callback endpoint)
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/${platform}`;

  // Build the auth URL with all required parameters
  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: config.responseType,
    scope: config.scopes,
    state: platform, // used to identify the platform in the callback
    ...(config.extraParams || {}),
  });

  const fullAuthUrl = `${config.authUrl}?${authParams.toString()}`;

  // Redirect the user's browser to the platform's login page
  return NextResponse.redirect(fullAuthUrl);
}
