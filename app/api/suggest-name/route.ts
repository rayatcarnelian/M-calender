import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Industry-specific name suggestions (instant, no API key needed)
const NAME_SUGGESTIONS: Record<string, string[]> = {
  "AI & Technology": ["Nova Systems", "Apex AI Labs", "Synth Digital", "Cortex Studio", "Quantum Edge"],
  "Real Estate": ["Apex Properties", "Skyline Realty", "Urban Nest", "Prime Estate Co", "Horizon Homes"],
  "Finance & Trading": ["Vertex Capital", "Atlas Finance", "Pinnacle Trading", "Apex Markets", "Sterling Group"],
  "Marketing & Advertising": ["Volts Agency", "Prism Creative", "Signal Studio", "Flux Media", "Ember Agency"],
  "E-Commerce": ["Cartbloom", "ShelfSpace", "PixelShop", "LuxeLine", "VaultCommerce"],
  "Health & Fitness": ["Peak Performance", "Vital Core", "Elevate Fitness", "Pulse Wellness", "Iron Path"],
  "Education & Coaching": ["MindForge", "Catalyst Academy", "ElevatED", "Thrive Coaching", "BrightPath"],
  "Legal & Consulting": ["Apex Counsel", "Pinnacle Advisory", "Summit Legal", "Clarity Consulting", "Vanguard Law"],
  "SaaS / Software": ["LaunchPad SaaS", "CloudForge", "StackPilot", "Nimbus App", "CodeVault"],
  "Other": ["Volts Studio", "Apex Ventures", "NextWave Co", "Momentum Labs", "Spark Global"],
};

export async function POST(req: NextRequest) {
  try {
    const { industry } = await req.json();

    const suggestions = NAME_SUGGESTIONS[industry] || NAME_SUGGESTIONS["Other"];
    // Pick a random suggestion
    const randomName = suggestions[Math.floor(Math.random() * suggestions.length)] as string;

    // Fetch the stored API key
    let groqApiKey = process.env.GROQ_API_KEY;
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (settings?.groqApiKey) groqApiKey = settings.groqApiKey;
    } catch (e) {}

    // If Groq key is available, use AI for a truly unique name
    if (groqApiKey) {
      try {
        const Groq = (await import("groq-sdk")).default;
        const groq = new Groq({ apiKey: groqApiKey });
        
        const result = await groq.chat.completions.create({
          messages: [{ role: "user", content: `Suggest exactly 1 catchy, modern 2-3 word business name for a ${industry} company. Return ONLY the name, nothing else. No quotes, no explanation.` }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.8,
        });

        const aiName = result.choices[0]?.message?.content?.trim();
        if (aiName && aiName.length < 40) {
          return NextResponse.json({ name: aiName });
        }
      } catch (e) {
        console.error("Groq suggestion error:", e);
        // Fall through to random suggestion
      }
    }

    return NextResponse.json({ name: randomName });
  } catch (error) {
    console.error("Suggest name error:", error);
    return NextResponse.json({ name: "My Business" }, { status: 200 });
  }
}
