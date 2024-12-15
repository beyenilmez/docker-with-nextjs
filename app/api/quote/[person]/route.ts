import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const publicPath = path.join(process.cwd(), "public");

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
  const count = parseInt(searchParams.get("count") || "1", 10); // General fallback count
  const quoteCount = parseInt(searchParams.get("quoteCount") || count.toString(), 10); // Quote-specific count
  const imageCount = parseInt(searchParams.get("imageCount") || count.toString(), 10); // Image-specific count
  const person = params.person;

  const personPath = path.join(publicPath, person);
  const quotesFilePath = path.join(personPath, "quotes.json");
  const imagesFolderPath = path.join(personPath, "images");

  try {
    // Ensure the person directory exists
    const folderExists = await fs.stat(personPath).catch(() => false);
    if (!folderExists) {
      return NextResponse.json({ error: `No data found for person: ${person}` }, { status: 404 });
    }

    // Fetch quotes and images for the specific person
    const quotes = await readJsonFile(quotesFilePath);
    const imageFiles = await fs.readdir(imagesFolderPath).catch(() => []);
    const images = imageFiles.map((file) => path.posix.join("/", person, "images", file));

    // Default behavior: Return `count` random quote-image pairs
    if (type === "default") {
      const result = [];
      for (let i = 0; i < count; i++) {
        const randomQuote = getRandomItems(quotes, 1)[0] || "No quotes available";
        const randomImage = getRandomItems(images, 1)[0] || "No images available";
        result.push({ quote: randomQuote, image: randomImage });
      }
      return NextResponse.json(result);
    }

    // Specific types: quote, image, or both
    if (type === "quote") {
      return NextResponse.json({ quotes: getRandomItems(quotes, count) });
    }
    if (type === "image") {
      return NextResponse.json({ images: getRandomItems(images, count) });
    }
    if (type === "both") {
      return NextResponse.json({
        quotes: getRandomItems(quotes, quoteCount),
        images: getRandomItems(images, imageCount),
      });
    }

    return NextResponse.json({ error: "Invalid type or request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
