import { NextResponse } from "next/server";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a merch visualization assistant for a Ukrainian print-on-demand platform.
Your task is to generate a realistic photographic mockup image showing a person wearing or using the product described below.

Rules:
- Generate ONLY realistic merch/product visualization images with people (unless explicitly asked to generate objects only).
- The person should have a human appearance, ideally in a culturally relevant context (e.g., urban Kyiv, café, modern office, campus, IT company workspace, corporate event, HoReCa).
- Focus on themes suitable for businesses: IT companies, corporate events, HoReCa, startups, campus, etc.
- The product must be clearly visible and prominently featured.
- Do NOT generate abstract art, logos, or patterns instead of the mockup. The output MUST be a high-quality lifestyle photo placeholder.
- Do NOT alter the design printed on the product — show it as-is.
- The image should look like a professional lifestyle product photo.`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI generation is not configured" }, { status: 500 });
  }

  const { prompt, contextDescription, imageDataUrl } = await request.json() as {
    prompt: string;
    contextDescription: string;
    imageDataUrl: string;
  };

  const textPart = { text: `${SYSTEM_PROMPT}\n\n${contextDescription}\n\n${prompt}` };

  // Extract mimeType and base64 data from the data URL
  const commaIndex = imageDataUrl.indexOf(",");
  const prefix = imageDataUrl.slice(0, commaIndex); // e.g. "data:image/png;base64"
  const mimeType = prefix.replace("data:", "").replace(";base64", "");
  const base64Data = imageDataUrl.slice(commaIndex + 1);

  const inlineDataPart = {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };

  const geminiBody = {
    contents: [
      {
        parts: [textPart, inlineDataPart],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let geminiRes: Response;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!geminiRes.ok) {
    const errBody = await geminiRes.json().catch(() => ({})) as { error?: { message?: string } };
    const detail = errBody?.error?.message ?? geminiRes.statusText;
    return NextResponse.json(
      { error: `Gemini API error: ${geminiRes.status} — ${detail}` },
      { status: geminiRes.status }
    );
  }

  const geminiData = await geminiRes.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { mimeType: string; data: string };
          text?: string;
        }>;
      };
    }>;
  };

  const parts = geminiData.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(
    (p) => p.inlineData?.mimeType?.startsWith("image/")
  );

  if (!imagePart?.inlineData) {
    return NextResponse.json({ error: "No image in response" }, { status: 502 });
  }

  const { mimeType: imgMime, data: imgData } = imagePart.inlineData;
  return NextResponse.json({ dataUrl: `data:${imgMime};base64,${imgData}` });
}
