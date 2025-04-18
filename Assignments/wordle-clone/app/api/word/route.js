import { NextResponse } from "next/server";

export async function POST(req) {
  const { length = 5 } = await req.json();

  const systemPrompt = `
You are a Wordle word picker. Always return one lowercase English word of the requested length only. 
The word can be slang, inappropriate, or funny — but it must be a real English word. No punctuation. No explanation.
`.trim();

  const userPrompt = `
Give me one simple, real English word that is exactly ${length} letters long. 
Slang, cuss words, or funny/inappropriate words are OK. No made-up or fake words. 
Return only the word in lowercase.
`.trim();

  const host = req.headers.get("host");
  const protocol = host.startsWith("localhost") ? "http" : "https";

  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
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
          temperature: 0.8,
        }),
      });

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content || "";
      const cleaned = raw.trim().replace(/[^a-zA-Z]/g, "").toLowerCase();

      console.log(`🧪 Attempt ${attempt}: "${raw}" ➝ "${cleaned}"`);

      if (!cleaned || cleaned.length !== length) {
        console.warn(`❌ Invalid word length: expected ${length}, got ${cleaned.length}`);
        continue;
      }

      // Validate using your local dictionary
      const validateRes = await fetch(`${protocol}://${host}/api/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleaned }),
      });

      const { valid } = await validateRes.json();

      if (valid) {
        console.log("✅ Word is valid. Returning:", cleaned);
        return NextResponse.json({ word: cleaned });
      } else {
        console.warn("❌ Rejected by dictionary validation:", cleaned);
      }
    } catch (err) {
      console.error(`⚠️ Error on attempt ${attempt}:`, err.message);
    }
  }

  // Fallback — return a hardcoded safe word if LLM fails
  const fallback = "spicy";
  console.warn(`🔥 Using fallback word: ${fallback}`);
  return NextResponse.json({ word: fallback });
}
