import { NextResponse } from "next/server";

const validatedWords = new Set();

export async function POST(req) {
  const { word } = await req.json();
  const upperWord = word.toUpperCase();

  // ✅ Check in-memory cache first
  if (validatedWords.has(upperWord)) {
    return NextResponse.json({ valid: true });
  }

  try {
    const prompt = `Is "${word}" a valid English word? Only reply "yes" or "no".`;

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
            content: "You are a dictionary validator. Reply only with 'yes' or 'no'. No explanation or punctuation.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 3,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    const result = raw?.trim()?.toLowerCase();

    console.log("🧪 Validator LLM result:", result);

    const isValid = typeof result === "string" && result.startsWith("yes");

    if (isValid) {
      validatedWords.add(upperWord); // ✅ Cache result
    }

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("❌ Validation failed:", error.message);
    return NextResponse.json({ valid: false });
  }
}
