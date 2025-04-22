import { NextResponse } from "next/server";

// In‑memory list of words we've already returned this session
let usedWords = [];

export async function POST(req) {
  const { length = 5 } = await req.json();

  const systemPrompt = `
You are a Wordle word picker. Always return one lowercase English word of the requested length only.
Never return the word “funky”. Do not repeat any word you have already output in this session.
Track which words you've returned in this server process and always pick a fresh one.
No punctuation. No explanation.
`.trim();

  const userPrompt = `
Please give me one simple, real English word that is exactly ${length} letters long.
It must NOT be “funky” and must not match any of the following words you've returned before:
${usedWords.length ? usedWords.join(", ") : "(none so far)"}
Return only the word in lowercase.
`.trim();

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
    const raw = data.choices?.[0]?.message?.content || "";
    let word = raw.trim().replace(/[^a-zA-Z]/g, "").toLowerCase();

    // Guard: if it slipped through or is wrong length, fallback
    if (
      word === "funky" ||
      usedWords.includes(word) ||
      word.length !== length
    ) {
      console.warn(
        `Rejected word "${word}", falling back to "spicy".`
      );
      word = "spicy";
    }

    // Record and return
    usedWords.push(word);
    return NextResponse.json({ word });
  } catch (err) {
    console.error("Error fetching from OpenAI:", err);
    // Fallback
    const fallback = "spicy";
    usedWords.push(fallback);
    return NextResponse.json({ word: fallback });
  }
}
