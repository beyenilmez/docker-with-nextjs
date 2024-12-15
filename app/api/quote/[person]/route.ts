import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

// Utility to fetch random items
const getRandomItems = (arr: any[], count: number) => {
  if (!Array.isArray(arr)) {
    return [];
  }
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Utility to read JSON files
const readJsonFile = async (filePath: string) => {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const jsonData = JSON.parse(data);

    // Extract "quotes" array if the JSON file has a "quotes" key
    if (jsonData.quotes && Array.isArray(jsonData.quotes)) {
      return jsonData.quotes;
    }

    return []; // Return an empty array if "quotes" key is not found or invalid
  } catch (error) {
    return []; // Return an empty array if file reading/parsing fails
  }
};

export async function GET(req: Request, { params }: { params: { person: string } }) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "default"; // Default API call
  const count = parseInt(searchParams.get("count") || "1", 10); // Default count: 1
  const person = params.person;

  const basePath = path.join(process.cwd(), "public", person);

  try {
    if (!person) {
      return NextResponse.json({ error: "Person is required" }, { status: 400 });
    }

    const folderExists = await fs.stat(basePath).catch(() => false);
    if (!folderExists) {
      return NextResponse.json({ error: `No data found for person: ${person}` }, { status: 404 });
    }

    // Read quotes
    const quotesFilePath = path.join(basePath, "quotes.json");
    const quotes = await readJsonFile(quotesFilePath);

    // Read images
    const imagesFolderPath = path.join(basePath, "images");
    const imageFiles = await fs.readdir(imagesFolderPath).catch(() => []);
    const images = imageFiles.map((file) => `/${person}/images/${file}`);

    // Default behavior: Return `count` times the JSON object with `quote` and `image`
    if (type === "default") {
      const result = [];
      for (let i = 0; i < count; i++) {
        const randomQuote = getRandomItems(quotes, 1)[0] || "No quotes available";
        const randomImage = getRandomItems(images, 1)[0] || "No images available";
        result.push({ quote: randomQuote, image: randomImage });
      }
      return NextResponse.json(result);
    }

    // Handle specific requests for quotes
    if (type === "quote") {
      const selectedQuotes = getRandomItems(quotes, count);
      return NextResponse.json({ quotes: selectedQuotes });
    }

    // Handle specific requests for images
    if (type === "image") {
      const selectedImages = getRandomItems(images, count);
      return NextResponse.json({ images: selectedImages });
    }

    // Handle both quotes and images
    if (type === "both") {
      const selectedQuotes = getRandomItems(quotes, count);
      const selectedImages = getRandomItems(images, count);
      return NextResponse.json({ quotes: selectedQuotes, images: selectedImages });
    }

    return NextResponse.json({ error: "Invalid type or request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
