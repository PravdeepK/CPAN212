import { NextResponse } from "next/server";

export async function POST(req) {
  const { length = 5 } = await req.json();

  const systemPrompt =
    "You are a Wordle word picker. Always return one lowercase English word of the requested length only. The word can be slang, cuss words, inappropriate, or funny words — but it must be a real word in English. Avoid made-up words or gibberish.";

  const userPrompt = `Give me one simple English word that is exactly ${length} letters long. 
It can be slang, funny, inappropriate, or a cuss word. 
Avoid uncommon or super hard words. 
NO explanations. NO punctuation. Only return the word in lowercase.`;

  try {
    let attempts = 0;
    const host = req.headers.get("host");
    const protocol = host.startsWith("localhost") ? "http" : "https";

    while (attempts < 5) {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
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
        }
      );

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content;
      const cleaned = raw?.replace(/[^a-zA-Z]/g, "").toUpperCase();

      console.log(`🧪 Attempt ${attempts + 1}: Raw GPT: ${raw}`);
      console.log(`✅ Cleaned: "${cleaned}" (Length: ${cleaned?.length})`);

      if (cleaned && cleaned.length === length) {
        const validateRes = await fetch(`${protocol}://${host}/api/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: cleaned }),
        });

        const { valid } = await validateRes.json();
        if (valid) {
          console.log("✅ Word validated successfully.");
          return NextResponse.json({ word: cleaned });
        } else {
          console.warn("🚫 Word failed dictionary validation.");
        }
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
