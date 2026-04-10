import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { POST } from "../route";

const SYSTEM_PROMPT = `You are a merch visualization assistant for a Ukrainian print-on-demand platform.
Your task is to generate a realistic photographic mockup image showing a person wearing or using the product described below.

Rules:
- Generate ONLY realistic merch/product visualization images.
- The person should have a Ukrainian appearance and be in a Ukrainian cultural context (urban Kyiv, countryside, café, office, campus, etc.).
- The product must be clearly visible and prominently featured.
- Do NOT generate abstract art, logos, patterns, or images unrelated to a person wearing/using the product.
- Do NOT alter the design printed on the product — show it as-is.
- The image should look like a professional lifestyle product photo.
- If the request is unrelated to merch visualization, generate the closest valid merch visualization you can.`;

function makeRequest(body: object) {
  return new Request("http://localhost/api/ai/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeGeminiOkResponse(parts: unknown[]) {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts } }],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("API route property tests", () => {
  // Feature: canvas-ai-image-generation, Property 4: SystemPrompt is always first in request body
  it("Property 4: SystemPrompt is always first in request body", async () => {
    // Validates: Requirements 3.2, 4.1
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.string(), async (prompt, contextDescription) => {
        let capturedBody: { contents: Array<{ parts: Array<{ text?: string }> }> } | null = null;

        vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
          capturedBody = JSON.parse(init.body as string);
          return makeGeminiOkResponse([
            { inlineData: { mimeType: "image/png", data: "abc123" } },
          ]);
        }));

        const req = makeRequest({
          prompt,
          contextDescription,
          imageDataUrl: "data:image/png;base64,abc123",
        });

        await POST(req);

        expect(capturedBody).not.toBeNull();
        const textPart = capturedBody!.contents[0].parts[0].text;
        expect(textPart).toBeDefined();
        expect(textPart!.startsWith(SYSTEM_PROMPT)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: canvas-ai-image-generation, Property 5: Canvas image is always included in request
  it("Property 5: Canvas image is always included in request", async () => {
    // Validates: Requirements 3.3
    await fc.assert(
      fc.asyncProperty(
        fc.base64String({ minLength: 1 }),
        fc.constantFrom("image/png", "image/jpeg", "image/webp"),
        async (base64data, mimeType) => {
          let capturedBody: { contents: Array<{ parts: Array<{ inlineData?: { data: string } }> }> } | null = null;

          vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
            capturedBody = JSON.parse(init.body as string);
            return makeGeminiOkResponse([
              { inlineData: { mimeType: "image/png", data: "result" } },
            ]);
          }));

          const imageDataUrl = `data:${mimeType};base64,${base64data}`;
          const req = makeRequest({
            prompt: "test",
            contextDescription: "test",
            imageDataUrl,
          });

          await POST(req);

          expect(capturedBody).not.toBeNull();
          const inlineData = capturedBody!.contents[0].parts[1].inlineData;
          expect(inlineData).toBeDefined();
          expect(inlineData!.data).toBe(base64data);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: canvas-ai-image-generation, Property 6: Response parsing produces valid data URL
  it("Property 6: Response parsing produces valid data URL", async () => {
    // Validates: Requirements 3.4
    await fc.assert(
      fc.asyncProperty(
        fc.base64String(),
        fc.constantFrom("image/png", "image/jpeg", "image/webp", "image/gif"),
        async (b, m) => {
          vi.stubGlobal("fetch", vi.fn(async () => {
            return makeGeminiOkResponse([
              { inlineData: { mimeType: m, data: b } },
            ]);
          }));

          const req = makeRequest({
            prompt: "test",
            contextDescription: "test",
            imageDataUrl: "data:image/png;base64,abc",
          });

          const response = await POST(req);
          const json = await response.json() as { dataUrl?: string };

          expect(json.dataUrl).toBe(`data:${m};base64,${b}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: canvas-ai-image-generation, Property 7: Missing image part surfaces an error
  it("Property 7: Missing image part surfaces an error", async () => {
    // Validates: Requirements 3.5
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({ text: fc.string() })),
        async (textOnlyParts) => {
          vi.stubGlobal("fetch", vi.fn(async () => {
            return makeGeminiOkResponse(textOnlyParts);
          }));

          const req = makeRequest({
            prompt: "test",
            contextDescription: "test",
            imageDataUrl: "data:image/png;base64,abc",
          });

          const response = await POST(req);
          const json = await response.json() as { error?: string };

          expect(response.status).toBe(502);
          expect(json).toHaveProperty("error");
        }
      ),
      { numRuns: 100 }
    );
  });
});
