import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { word } = await req.json();
    const filePath = path.join(process.cwd(), "data", "words_alpha.txt");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Word list file not found" }, { status: 500 });
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const wordsList = new Set(
      fileContents.split("\n").map((w) => w.trim().toUpperCase())
    );

    if (wordsList.has(word)) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false });
    }
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
