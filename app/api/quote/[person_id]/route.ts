import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "path";
import { GET as getRandomPerson } from "../../person/[person_id]/route";

export async function GET(req: NextRequest, { params }: { params: { person_id: string } }) {
  try {
    // Step 1: Fetch the quote and image data
    const url = new URL(req.url);
    url.searchParams.set("type", "combo");
    url.searchParams.set("count", "1");

    const modifiedRequest = new NextRequest(url.toString(), {
      method: req.method,
      headers: req.headers,
    });

    const response = await getRandomPerson(modifiedRequest, { params: { person_id: params.person_id } });
    const data = await response.json();

    if (!data.quote || !data.image) {
      return new NextResponse("Failed to fetch quote or image", { status: 500 });
    }

    const { quote, name, nickname, image, birthdate, deathDate } = data;
    const lifeSpan = deathDate ? `${birthdate.slice(0, 4)} - ${deathDate.slice(0, 4)}` : birthdate.slice(0, 4);

    const canvasWidth = 800;
    const canvasHeight = 500;

    // Step 2: Load the background image
    const imagePath = path.join(process.cwd(), "public", image);
    const background = await loadImage(imagePath);

    // Calculate dimensions to maintain aspect ratio
    const imageRatio = background.width / background.height;
    let drawWidth = canvasWidth;
    let drawHeight = canvasWidth / imageRatio;

    if (drawHeight < canvasHeight) {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imageRatio;
    }

    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;

    // Create the canvas
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Draw the image without distortion
    ctx.drawImage(background, offsetX, offsetY, drawWidth, drawHeight);

    // Add a dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Set text styles and layout spacing
    const marginX = 50;
    const topMargin = 120;
    const bottomMargin = 80;
    const lineSpacing = 45;

    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;

    // Font Styles
    const quoteFont = "bold 32px Montserrat";
    const authorFont = "24px Poppins";
    const yearFont = "20px Poppins";

    // Write the quote (upper-left)
    ctx.font = quoteFont;
    const quoteLines = quote.split(" ");
    let currentY = topMargin;
    let line = "";

    for (const word of quoteLines) {
      const testLine = line + word + " ";
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > canvasWidth - 2 * marginX) {
        ctx.fillText(line, marginX, currentY);
        line = word + " ";
        currentY += lineSpacing;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, marginX, currentY);

    // Write the author's name and nickname (bottom-left)
    ctx.font = authorFont;
    ctx.fillText(
      `- ${name} ${deathDate ? "(" + lifeSpan.replace("xxxx", "?") + ")" : ""}`,
      marginX,
      canvasHeight - bottomMargin
    );

    // Step 3: Return the image
    const buffer = canvas.toBuffer("image/png");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return new NextResponse("Failed to generate image", { status: 500 });
  }
}
