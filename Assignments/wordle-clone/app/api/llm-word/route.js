import { NextResponse } from "next/server";

export async function POST(req) {
  const { length = 5 } = await req.json();

  try {
    const prompt = `Give me one valid English word that is exactly ${length} letters long. Return only the word, no punctuation.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful Wordle assistant. Only return clean, real English words of a specific length as requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 10,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const word = data.choices?.[0]?.message?.content?.trim()?.toUpperCase();

    return NextResponse.json({ result: word });
  } catch (error) {
    return NextResponse.json({ error: "LLM failed to generate word." }, { status: 500 });
  }
}
