import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "words_alpha.txt");

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Word list file not found" }, { status: 500 });
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const wordsList = fileContents
      .split("\n")
      .map((word) => word.trim().toUpperCase())
      .filter((word) => word.length === 5);

    if (wordsList.length === 0) {
      return NextResponse.json({ error: "No words available" }, { status: 500 });
    }

    const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];
    return NextResponse.json({ word: randomWord });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
