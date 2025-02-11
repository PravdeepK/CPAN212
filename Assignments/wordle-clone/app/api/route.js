import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let wordsList = [];

const loadWords = () => {
  const filePath = path.join(process.cwd(), "data", "words_alpha.txt");
  const fileContents = fs.readFileSync(filePath, "utf8");
  wordsList = fileContents
    .split("\n")
    .map((word) => word.trim().toUpperCase()) // Convert to uppercase
    .filter((word) => word.length >= 3 && word.length <= 8); // Keep only 3-8 letter words
};

if (wordsList.length === 0) {
  loadWords();
}

export async function GET() {
  if (wordsList.length === 0) {
    return NextResponse.json({ error: "Word list is empty" }, { status: 500 });
  }

  const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];
  return NextResponse.json({ word: randomWord });
}
