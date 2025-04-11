import { NextResponse } from "next/server";

export async function POST(req) {
  const { length = 5 } = await req.json();

  try {
    const prompt = `
Give me one uncommon but valid English word that is exactly ${length} letters long.
Do NOT return common or generic words like "apple" or "water".
No explanation, formatting, punctuation, or quotes.
Only return the word in lowercase.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a Wordle word picker. Always return one English word of the requested length only. No punctuation, no explanation.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 10,
        temperature: 0.85, // 🔥 slightly increased randomness
      }),
    });

    const data = await response.json();

    const raw = data?.choices?.[0]?.message?.content;
    const cleaned = raw?.replace(/[^a-zA-Z]/g, "").toUpperCase();

    console.log("🧪 Raw GPT:", raw);
    console.log(`✅ Cleaned: "${cleaned}" (Length: ${cleaned?.length})`);

    if (!cleaned || cleaned.length !== length) {
      throw new Error(`Word format mismatch. Got "${cleaned}"`);
    }

    return NextResponse.json({ word: cleaned });
  } catch (error) {
    console.error("❌ Word generation failed:", error.message);
    return NextResponse.json({ error: "LLM failed to generate a valid word." }, { status: 500 });
  }
}
