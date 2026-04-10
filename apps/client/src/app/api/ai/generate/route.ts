import { NextResponse } from "next/server";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a professional merch mockup photographer for a Ukrainian print-on-demand platform.
Your task is to generate a PHOTOREALISTIC lifestyle mockup image showing a real person wearing or using the product.

Critical rules for realism:
- Generate ONLY photorealistic images — no illustrations, no cartoons, no flat design.
- The garment/product must look exactly like a real physical item being worn — natural fabric folds, realistic lighting, shadows.
- The design printed on the product must be clearly visible, properly scaled, and look like it was actually printed on the fabric (not pasted on top).
- The person should look like a real Ukrainian — natural skin tone, realistic hair, authentic Ukrainian urban/lifestyle setting.
- Environment: modern Kyiv streets, cozy café, contemporary office, university campus, corporate event, HoReCa venue.
- Lighting: natural or soft studio lighting — no harsh flash, no overexposed backgrounds.
- Composition: lifestyle photography style — the product is the hero but the scene feels authentic and candid.
- Do NOT generate abstract art, patterns, or images where the product is not clearly visible.
- Do NOT alter or distort the design printed on the product.
- The final image should look like it came from a professional product photographer's portfolio.`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI generation is not configured" }, { status: 500 });
  }

  const { prompt, contextDescription, imageDataUrl, canvasDataUrl, hasSelfie } = await request.json() as {
    prompt: string;
    contextDescription: string;
    imageDataUrl: string;
    canvasDataUrl?: string;
    hasSelfie?: boolean;
  };

  const selfieInstruction = hasSelfie
    ? `\n\nIMPORTANT: The second image provided is a photo of the actual customer. You MUST use their face, body, and appearance — place the merch product on THIS specific person. Keep their likeness accurate.`
    : "";

  const textPart = { text: `${SYSTEM_PROMPT}${selfieInstruction}\n\n${contextDescription}\n\n${prompt}` };

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

  const extraParts: { inlineData: { mimeType: string; data: string } }[] = [];
  if (hasSelfie && canvasDataUrl && canvasDataUrl.includes(",")) {
    const ci = canvasDataUrl.indexOf(",");
    const cMime = canvasDataUrl.slice(0, ci).replace("data:", "").replace(";base64", "");
    const cData = canvasDataUrl.slice(ci + 1);
    extraParts.push({ inlineData: { mimeType: cMime, data: cData } });
  }

  const geminiBody = {
    contents: [
      {
        parts: [textPart, inlineDataPart, ...extraParts],
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
