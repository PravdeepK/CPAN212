import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI with your secret key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { word } = await req.json();

    // Basic format check
    if (!word || typeof word !== "string") {
      return NextResponse.json({ valid: false, reason: "Invalid input" });
    }

    const trimmedWord = word.trim().toLowerCase();

    // Must be 3–10 characters
    if (trimmedWord.length < 3 || trimmedWord.length > 10) {
      return NextResponse.json({ valid: false, reason: "Length out of bounds" });
    }

    // Check moderation categories (ONLY hate/violence/sexual)
    const moderation = await openai.moderations.create({
      input: trimmedWord,
    });

    const result = moderation.results[0];

    const blocked =
      result.categories.hate ||
      result.categories.hate_threatening ||
      result.categories.sexual_minors ||
      result.categories.violence ||
      result.categories.violence_graphic;

    if (blocked) {
      return NextResponse.json({ valid: false, reason: "Blocked by moderation" });
    }

    // ✅ Accept the word
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Validation Error:", error);
    return NextResponse.json({ valid: false, reason: "Server error" });
  }
}
