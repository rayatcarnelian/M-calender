import { prisma } from "./prisma";

/**
 * Safely fetches settings from the database.
 * Returns null if the database is unavailable (e.g., on Vercel without a cloud DB).
 * API routes should fall back to environment variables when this returns null.
 */
export async function getSettings() {
  try {
    return await prisma.settings.findUnique({ where: { id: "default" } });
  } catch (e) {
    console.warn("[Settings] Database unavailable, falling back to env vars:", (e as Error).message);
    return null;
  }
}

/**
 * Maps common setting field names to their environment variable equivalents.
 */
export function getApiKeyFromEnv(keyName: string): string | undefined {
  const envMap: Record<string, string> = {
    groqApiKey: "GROQ_API_KEY",
    togetherApiKey: "TOGETHER_API_KEY",
    falApiKey: "FAL_API_KEY",
    pexelsApiKey: "PEXELS_API_KEY",
    elevenLabsApiKey: "ELEVENLABS_API_KEY",
    elevenLabsApiKey2: "ELEVENLABS_API_KEY_2",
    rapidApiKey: "RAPID_API_KEY",
    apifyApiKey: "APIFY_API_KEY",
    geminiApiKey: "GEMINI_API_KEY",
    youtubeApiKey: "YOUTUBE_API_KEY",
  };
  const envVar = envMap[keyName];
  return envVar ? process.env[envVar] : undefined;
}

/**
 * Gets an API key: first checks DB settings, then falls back to environment variable.
 */
export async function getApiKey(keyName: string): Promise<string | undefined> {
  const settings = await getSettings();
  const dbValue = settings ? (settings as any)[keyName] : undefined;
  return dbValue || getApiKeyFromEnv(keyName) || undefined;
}
