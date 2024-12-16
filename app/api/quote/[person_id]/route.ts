import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "path";
import { GET as getRandomPerson } from "../../person/[person_id]/route";

export async function GET(req: NextRequest, { params }: { params: { person_id: string } }) {
  try {
    if (params.person_id === "all") {
      return new NextResponse("Invalid person ID", { status: 400 });
    }

    // Step 1: Fetch and parse query parameters
    const url = new URL(req.url);
    const sizeParam = url.searchParams.get("size") || "800x500";
    const rawColor = url.searchParams.get("color") || "FFFFFF"; // Default white
    const textColor = `#${rawColor}`; // Add "#" prefix

    // Padding Parameters
    const generalPadding = parseInt(url.searchParams.get("p") || "70");
    const px = parseInt(url.searchParams.get("px") || String(generalPadding));
    const py = parseInt(url.searchParams.get("py") || String(generalPadding));
    const pt = parseInt(url.searchParams.get("pt") || String(py));
    const pb = parseInt(url.searchParams.get("pb") || String(py));
    const pl = parseInt(url.searchParams.get("pl") || String(px));
    const pr = parseInt(url.searchParams.get("pr") || String(px));

    // Text Size Scaling Factor
    const textSizeScale = parseFloat(url.searchParams.get("text_size") || "1");

    const quoteText = url.searchParams.get("quote") || "";
    const authorText = url.searchParams.get("author") || "";
    let imageName = url.searchParams.get("image") || "";
    if (params.person_id === "random" && !(imageName.startsWith("http://") || imageName.startsWith("https://"))) {
      imageName = "";
    }

    const showDate = url.searchParams.has("date") ? url.searchParams.get("date") === "true" : true;
    const birthDateText = url.searchParams.get("birthdate") || "";
    const deathDateText = url.searchParams.get("deathdate") || "";

    const format = url.searchParams.get("format") || "jpeg";
    if (format !== "png" && format !== "jpeg" && format !== "webp" && format !== "avif") {
      return new NextResponse("Unsupported format", { status: 400 });
    }

    const [canvasWidth, canvasHeight] = sizeParam.split("x").map(Number);

    // Step 2: Fetch the quote and image data
    url.searchParams.set("type", "combo");
    url.searchParams.set("count", "1");
    const modifiedRequest = new NextRequest(url.toString(), { method: req.method, headers: req.headers });

    const response = await getRandomPerson(modifiedRequest, { params: { person_id: params.person_id } });
    const data =
      params.person_id === "custom"
        ? {
            quote: quoteText,
            image: imageName,
            name: authorText,
            birthdate: birthDateText ? birthDateText : "?",
            deathDate: deathDateText ? deathDateText : "?",
          }
        : await response.json();

    if (params.person_id !== "custom" && (!data.quote || !data.image)) {
      return new NextResponse("Failed to fetch quote or image", { status: 500 });
    }

    const { quote, name, image, birthdate, deathDate } = data;
    const lifeSpan =
      deathDateText || deathDate
        ? `${(birthDateText || birthdate).slice(0, 4)} - ${(deathDateText || deathDate).slice(0, 4)}`
        : birthDateText || birthdate.slice(0, 4);

    // Step 3: Load the background image
    let imagePath = path.join(
      process.cwd(),
      "public",
      imageName ? path.join(params.person_id, "images", imageName) : image
    );

    // Check if imageName is a url
    if (imageName.startsWith("http://") || imageName.startsWith("https://")) {
      imagePath = imageName;
    }

    const background = await loadImage(imagePath);

    // Calculate aspect-ratio-preserving dimensions
    const imageRatio = background.width / background.height;
    let drawWidth = canvasWidth;
    let drawHeight = canvasWidth / imageRatio;

    if (drawHeight < canvasHeight) {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imageRatio;
    }

    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;

    // Step 4: Create canvas and draw the image
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(background, offsetX, offsetY, drawWidth, drawHeight);
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Dynamic text sizes based on canvas dimensions
    const baseFontSize = (canvasHeight / 15) * textSizeScale; // Base font size scaled
    const quoteFontSize = Math.max(baseFontSize, 12); // Minimum font size 12px
    const authorFontSize = Math.max(baseFontSize * 0.7, 10); // Smaller font for author

    ctx.fillStyle = textColor; // Use the dynamic color
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;

    // Font Styles
    const quoteFont = `bold ${quoteFontSize}px Montserrat`;
    const authorFont = `${authorFontSize}px Poppins`;

    // Write the quote (upper-left with top padding)
    ctx.font = quoteFont;
    const maxTextWidth = canvasWidth - pl - pr;
    const lineSpacing = quoteFontSize * 1.2;

    let currentY = pt + lineSpacing;
    let line = "";
    const words = (quoteText || quote).split(" ");

    for (const word of words) {
      const testLine = line + word + " ";
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxTextWidth) {
        ctx.fillText(line, pl, currentY);
        line = word + " ";
        currentY += lineSpacing;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, pl, currentY);

    // Write the author's name (bottom-left with bottom and left padding)
    ctx.font = authorFont;
    ctx.fillText(
      `- ${authorText || name} ${showDate && deathDate ? "(" + lifeSpan.replace("xxxx", "?") + ")" : ""}`,
      pl,
      canvasHeight - pb
    );

    // @ts-ignore
    const buffer = canvas.toBuffer("image/" + format);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/" + format,
      },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return new NextResponse("Failed to generate image", { status: 500 });
  }
}
