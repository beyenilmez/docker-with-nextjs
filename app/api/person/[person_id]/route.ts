import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const publicPath = path.join(process.cwd(), "public");

// Utility to fetch random items
const getRandomItems = (arr: any[], count: number, sortType: string, sortOrder: string) => {
  if (!Array.isArray(arr)) {
    return [];
  }

  // Randomly shuffle and select items
  const shuffled = arr.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  // Sort the selected items
  if (sortType === "length") {
    selected.sort((a, b) => {
      const comparison = a.length - b.length;
      return sortOrder === "asc" ? comparison : -comparison;
    });
  } else if (sortType === "alpha") {
    selected.sort((a, b) => {
      const comparison = a.localeCompare(b, undefined, { sensitivity: "base" });
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }

  return selected;
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

// Utility to fetch a random person ID
const getRandomPersonId = async (): Promise<string | null> => {
  try {
    const entries = await fs.readdir(publicPath, { withFileTypes: true });
    const personDirs = entries.filter((entry) => entry.isDirectory());
    if (personDirs.length === 0) return null;
    const randomDir = personDirs[Math.floor(Math.random() * personDirs.length)];
    return randomDir.name;
  } catch {
    return null;
  }
};
const getMatchingPersonId = async (keyword: string): Promise<string | null> => {
  try {
    const entries = await fs.readdir(publicPath, { withFileTypes: true });
    const personDirs = entries.filter((entry) => entry.isDirectory());

    for (const dir of personDirs) {
      const quotesPath = path.join(publicPath, dir.name, "quotes.json");
      const quotes = await readJsonFile(quotesPath).then((data) => data.quotes || []);
      if (quotes.some((quote: string) => quote.toLowerCase().includes(keyword.toLowerCase()))) {
        return dir.name; // Return the first matching person
      }
    }

    return null; // No matching person found
  } catch {
    return null;
  }
};

export async function GET(req: Request, { params }: { params: { person_id: string } }) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "default"; // Default behavior
  const count = parseInt(searchParams.get("count") || "1", 10); // Default count
  const includeQuotes = type === "combo" || searchParams.get("includeQuotes") !== "false"; // Default: include quotes
  const includeImages = type === "combo" || searchParams.get("includeImages") !== "false"; // Default: include images
  const searchKeyword = searchParams.get("search") || ""; // Keyword for search
  const sortType = searchParams.get("sort") || ""; // Sorting type
  const sortOrder = searchParams.get("order") || "asc"; // Sorting order (asc/desc)
  let personId = params.person_id;

  // Handle random person case with search
  if (personId === "random") {
    if (searchKeyword) {
      const matchingPersonId = await getMatchingPersonId(searchKeyword);
      if (!matchingPersonId) {
        return NextResponse.json({ error: `No persons found with keyword: ${searchKeyword}` }, { status: 404 });
      } else {
        personId = matchingPersonId;
      }
    } else {
      const newPersonId = await getRandomPersonId();
      if (!newPersonId) {
        return NextResponse.json({ error: "No persons available" }, { status: 404 });
      } else {
        personId = newPersonId;
      }
    }
  }

  const personPath = path.join(publicPath, personId);
  const personJsonPath = path.join(personPath, "person.json");
  const quotesJsonPath = path.join(personPath, "quotes.json");
  const imagesFolderPath = path.join(personPath, "images");

  try {
    // Ensure the person directory exists
    const folderExists = await fs.stat(personPath).catch(() => false);
    if (!folderExists) {
      return NextResponse.json({ error: `No data found for person: ${personId}` }, { status: 404 });
    }

    // Read person metadata
    const personData = await readJsonFile(personJsonPath);
    if (!personData.id || !personData.name) {
      personData.id = personId;
      personData.name = `Unknown (${personId})`;
    }

    // Read quotes
    let quotes = includeQuotes ? await readJsonFile(quotesJsonPath).then((data) => data.quotes || []) : [];

    // Apply search filter for quotes
    if (searchKeyword) {
      quotes = quotes.filter((quote: string) => quote.toLowerCase().includes(searchKeyword.toLowerCase()));
    }

    // Read images
    let images = includeImages
      ? await (
          await fs.readdir(imagesFolderPath).catch(() => [])
        ).map((file) => path.posix.join("/", personId, "images", file))
      : [];

    // Add dynamic metadata
    const totalQuotes = quotes.length;
    const totalImages = images.length;

    // Handle different types
    if (type === "default") {
      const response = {
        ...personData,
        totalQuotes,
        totalImages,
        quotes,
        images,
      };

      if (!includeImages) {
        delete response.totalImages;
        delete response.images;
      }
      if (!includeQuotes) {
        delete response.totalQuotes;
        delete response.quotes;
      }

      return NextResponse.json(response);
    }

    if (type === "combo") {
      const result = [];
      const generatedQuotes = getRandomItems(quotes, count, sortType, sortOrder).map((quote) => quote || null);

      for (const quote of generatedQuotes) {
        const image = getRandomItems(images, 1, sortType, sortOrder)[0] || null;
        result.push({ quote, image });
      }

      // Handle single combo case
      if (count === 1) {
        const singleCombo = result[0];
        return NextResponse.json({
          ...personData,
          totalQuotes,
          totalImages,
          quote: singleCombo.quote,
          image: singleCombo.image,
        });
      }

      return NextResponse.json({
        ...personData,
        totalQuotes,
        totalImages,
        combos: result,
      });
    }

    if (type === "quote") {
      if (count === 1) {
        return NextResponse.json({
          ...personData,
          totalQuotes,
          quote: getRandomItems(quotes, 1, sortType, sortOrder)[0],
        });
      }

      return NextResponse.json({
        ...personData,
        totalQuotes,
        quotes: getRandomItems(quotes, count, sortType, sortOrder),
      });
    }

    if (type === "image") {
      if (count === 1) {
        return NextResponse.json({
          ...personData,
          totalImages,
          image: getRandomItems(images, 1, sortType, sortOrder)[0],
        });
      }

      return NextResponse.json({
        ...personData,
        totalImages,
        images: getRandomItems(images, count, sortType, sortOrder),
      });
    }

    return NextResponse.json({ error: "Invalid type or request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
