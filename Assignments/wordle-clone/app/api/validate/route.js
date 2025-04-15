import { NextResponse } from "next/server";

const validatedWords = new Set();

export async function POST(req) {
  const { word } = await req.json();
  const upperWord = word?.toUpperCase();

  if (!upperWord || upperWord.length < 3) {
    return NextResponse.json({ valid: false });
  }

  // ✅ Check in-memory cache
  if (validatedWords.has(upperWord)) {
    return NextResponse.json({ valid: true });
  }

  try {
    const prompt = `Is "${word}" a real word in English? Reply "yes" if it is used in English — even slang, inappropriate, or cuss words are allowed. Reply "no" if it's completely made up or gibberish.`;

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
            content:
              "You are a dictionary validator. Reply only with 'yes' or 'no'. No explanation, no punctuation. Allow slang, inappropriate, funny, or cuss words. Reject only made-up words or gibberish.",
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

    console.log(`📖 Dictionary result: "${result}" for word "${word}"`);

    const isValid = typeof result === "string" && result.startsWith("yes");

    if (isValid) {
      validatedWords.add(upperWord); // ✅ Cache it
    }

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("❌ Validation error:", error.message);
    return NextResponse.json({ valid: false });
  }
}
