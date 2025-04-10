import { NextResponse } from "next/server";

export async function POST(req) {
  const { word } = await req.json();

  try {
    const prompt = `Is "${word}" a valid English word? Reply with just "yes" or "no".`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a dictionary validator. Reply ONLY with 'yes' or 'no'." },
          { role: "user", content: prompt },
        ],
        max_tokens: 3,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim().toLowerCase();

    return NextResponse.json({ valid: responseText === "yes" });
  } catch (error) {
    return NextResponse.json({ valid: false });
  }
}
