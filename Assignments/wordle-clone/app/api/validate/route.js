import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  const { word } = await request.json();

  if (!word || typeof word !== "string") {
    return new Response(JSON.stringify({ valid: false }), {
      status: 400,
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Is "${word}" a valid English word (real, slang, or informal)? Only respond "yes" or "no".`,
        },
      ],
      temperature: 0,
    });

    const verdict = response.choices[0].message.content.toLowerCase().trim();
    const isValid = verdict.startsWith("yes");

    return new Response(JSON.stringify({ valid: isValid }), {
      status: 200,
    });
  } catch (error) {
    console.error("GPT validation error:", error);
    return new Response(JSON.stringify({ valid: false }), {
      status: 500,
    });
  }
}
