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

    personDirs.sort(() => 0.5 - Math.random());

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
  const quoteCount = parseInt(searchParams.get("quote_count") || "1", 10); // Quote-specific count
  const imageCount = parseInt(searchParams.get("image_count") || "1", 10); // Image-specific count
  const includeQuotes = type === "combo" || searchParams.get("include_quotes") !== "false"; // Default: include quotes
  const includeImages = type === "combo" || searchParams.get("include_images") !== "false"; // Default: include images
  const quoteQuery = searchParams.get("quote_query") || ""; // Keyword for search
  const sortType = searchParams.get("sort") || ""; // Sorting type
  const sortOrder = searchParams.get("order") || "asc"; // Sorting order (asc/desc)
  let personId = params.person_id;

  if (personId === "all") {
    // Read the person directories
    const entries = await fs.readdir(publicPath, { withFileTypes: true });
    const personDirs = entries.filter((entry) => entry.isDirectory());

    personDirs.sort(() => 0.5 - Math.random());

    // Fetch data for all persons
    let responses: any[] = await Promise.all(
      personDirs.map(
        (dir) =>
          GET(req, { params: { person_id: dir.name, ...Object.fromEntries(searchParams) } })
            .then((response) => response.json())
            .catch(() => null) // Handle any errors gracefully
      )
    );

    // Filter responses based on quoteQuery
    if (quoteQuery) {
      responses = responses.filter((data) => {
        if (!data) return false; // Skip null responses
        return data.quote || (data.totalQuotes && data.totalQuotes > 0);
      });
    }

    return NextResponse.json(responses);
  }

  // Handle random person case with search
  if (personId === "random") {
    if (quoteQuery) {
      const matchingPersonId = await getMatchingPersonId(quoteQuery);
      if (!matchingPersonId) {
        return NextResponse.json({ error: `No persons found with keyword: ${quoteQuery}` }, { status: 404 });
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
    if (quoteQuery) {
      quotes = quotes.filter((quote: string) => quote.toLowerCase().includes(quoteQuery.toLowerCase()));
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

      if (quoteCount != 1) {
        response.quotes = getRandomItems(quotes, quoteCount, sortType, sortOrder) || null;
      }
      if (imageCount != 1) {
        response.images = getRandomItems(images, imageCount, sortType, sortOrder) || null;
      }

      return NextResponse.json(response);
    }

    if (type === "combo") {
      const result = [];
      const generatedQuotes = getRandomItems(quotes, quoteCount, sortType, sortOrder).map((quote) => quote || null);

      for (const quote of generatedQuotes) {
        const image = getRandomItems(images, 1, sortType, sortOrder)[0] || null;
        result.push({ quote, image });
      }

      // Handle single combo case
      if (quoteCount === 1) {
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
      if (quoteCount === 1) {
        return NextResponse.json({
          ...personData,
          totalQuotes,
          quote: getRandomItems(quotes, 1, sortType, sortOrder)[0],
        });
      }

      return NextResponse.json({
        ...personData,
        totalQuotes,
        quotes: getRandomItems(quotes, quoteCount, sortType, sortOrder),
      });
    }

    if (type === "image") {
      if (imageCount === 1) {
        return NextResponse.json({
          ...personData,
          totalImages,
          image: getRandomItems(images, 1, sortType, sortOrder)[0],
        });
      }

      return NextResponse.json({
        ...personData,
        totalImages,
        images: getRandomItems(images, imageCount, sortType, sortOrder),
      });
    }

    return NextResponse.json({ error: "Invalid type or request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
