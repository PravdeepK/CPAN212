import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req) {
  const filePath = path.join(process.cwd(), "data", "words_alpha.txt");

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Word list file not found" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const lengthParam = searchParams.get("length");
    const wordLength = parseInt(lengthParam, 10);

    if (isNaN(wordLength) || wordLength < 3 || wordLength > 10) {
      return NextResponse.json({ error: "Invalid or missing word length" }, { status: 400 });
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const wordsList = fileContents
      .split("\n")
      .map((word) => word.trim().toUpperCase())
      .filter((word) => word.length === wordLength);

    if (wordsList.length === 0) {
      return NextResponse.json({ error: "No words available for this length" }, { status: 500 });
    }

    const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];
    return NextResponse.json({ word: randomWord });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
