import { NextResponse } from "next/server";

export async function POST(req) {
  const { length = 5 } = await req.json();

  const systemPrompt =
    "You are a Wordle word picker. Always return one lowercase English word of the requested length only. The word can be slang, inappropriate, or funny — but it must be a real English word. No punctuation. No explanation.";
  const userPrompt = `Give me one simple, real English word that is exactly ${length} letters long. Slang, cuss words, or funny/inappropriate words are OK. No made-up or fake words. Return only the word in lowercase.`;

  try {
    let attempts = 0;
    const host = req.headers.get("host");
    const protocol = host.startsWith("localhost") ? "http" : "https";

    while (attempts < 5) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 10,
          temperature: 0.85,
        }),
      });

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content;
      const cleaned = raw?.replace(/[^a-zA-Z]/g, "").toUpperCase();

      console.log(`🧪 Attempt ${attempts + 1}: Raw GPT: ${raw}`);
      console.log(`✅ Cleaned: "${cleaned}" (Length: ${cleaned?.length})`);

      // Check length strictly
      if (!cleaned || cleaned.length !== length) {
        console.warn(`🚫 Invalid length: expected ${length}, got ${cleaned?.length}`);
        attempts++;
        continue;
      }

      // Validate using your /api/validate route
      const validateRes = await fetch(`${protocol}://${host}/api/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleaned }),
      });

      const { valid } = await validateRes.json();
      if (valid) {
        console.log("✅ Word validated and returned.");
        return NextResponse.json({ word: cleaned });
      } else {
        console.warn("❌ Word failed dictionary validation.");
      }

      attempts++;
    }

    throw new Error("Exceeded retries without valid word");
  } catch (error) {
    console.error("❌ Word generation failed:", error.message);
    return NextResponse.json(
      { error: "LLM failed to generate a valid word." },
      { status: 500 }
    );
  }
}
