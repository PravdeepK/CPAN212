import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { word } = await req.json(); // Get the guessed word from request
    const filePath = path.join(process.cwd(), "data", "words_alpha.txt");

    const fileContents = fs.readFileSync(filePath, "utf8");
    const wordsList = new Set(
      fileContents
        .split("\n")
        .map((word) => word.trim().toUpperCase()) // Convert to uppercase
    );

    if (wordsList.has(word)) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false });
    }
  } catch (error) {
    console.error("Error validating word:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
