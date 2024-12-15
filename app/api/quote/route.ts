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
    return JSON.parse(data);
  } catch (error) {
    return {}; // Return an empty object if file reading/parsing fails
  }
};

// Utility to recursively get all files in a directory
const getAllFiles = async (dirPath: string): Promise<string[]> => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((entry) => {
        const fullPath = path.join(dirPath, entry.name);
        return entry.isDirectory() ? getAllFiles(fullPath) : fullPath;
      })
    );
    return files.flat();
  } catch {
    return [];
  }
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "default";
  const count = parseInt(searchParams.get("count") || "1", 10);
  const quoteCount = parseInt(searchParams.get("quoteCount") || count.toString(), 10);
  const imageCount = parseInt(searchParams.get("imageCount") || count.toString(), 10);

  try {
    const quotes: { quote: string; person: any }[] = [];
    const images: { image: string; person: any }[] = [];
    const allPersons: any[] = [];

    // Recursively find all person folders
    const personFolders = await fs.readdir(publicPath, { withFileTypes: true });
    const personDirs = personFolders.filter((entry) => entry.isDirectory());

    // Aggregate data from person.json, quotes.json, and images for each person
    for (const dir of personDirs) {
      const personId = dir.name;
      const personPath = path.join(publicPath, personId);
      const personJsonPath = path.join(personPath, "person.json");
      const quotesJsonPath = path.join(personPath, "quotes.json");
      const imagesPath = path.join(personPath, "images");

      // Read person metadata
      const personData = await readJsonFile(personJsonPath);
      if (!personData.id || !personData.name) {
        personData.id = personId;
        personData.name = `Unknown (${personId})`;
      }
      allPersons.push(personData);

      // Read quotes
      const personQuotes = await readJsonFile(quotesJsonPath);
      if (personQuotes.quotes) {
        personQuotes.quotes.forEach((quote: string) => quotes.push({ quote, person: personData }));
      }

      // Read images
      const personImages = await fs.readdir(imagesPath).catch(() => []);
      personImages.forEach((file) =>
        images.push({
          image: path.posix.join("/", personId, "images", file),
          person: personData,
        })
      );
    }

    // Default behavior: Return `count` random quote-image pairs
    if (type === "default") {
      const result = [];
      for (let i = 0; i < count; i++) {
        const randomQuote = getRandomItems(quotes, 1)[0] || { quote: "No quotes available" };
        const randomImage = getRandomItems(images, 1)[0] || { image: "No images available" };
        result.push({
          quote: randomQuote.quote,
          image: randomImage.image,
          person: randomQuote.person || randomImage.person,
        });
      }
      return NextResponse.json(result);
    }

    // Specific types: quote, image, or both
    if (type === "quote") {
      return NextResponse.json(
        getRandomItems(quotes, count).map((item) => ({
          quote: item.quote,
          person: item.person,
        }))
      );
    }
    if (type === "image") {
      return NextResponse.json(
        getRandomItems(images, count).map((item) => ({
          image: item.image,
          person: item.person,
        }))
      );
    }
    if (type === "both") {
      return NextResponse.json({
        quotes: getRandomItems(quotes, quoteCount).map((item) => ({
          quote: item.quote,
          person: item.person,
        })),
        images: getRandomItems(images, imageCount).map((item) => ({
          image: item.image,
          person: item.person,
        })),
      });
    }

    // Return metadata about all persons if requested
    if (type === "persons") {
      return NextResponse.json(allPersons);
    }

    return NextResponse.json({ error: "Invalid type or request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
