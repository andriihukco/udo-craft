# Design Document — Canvas AI Image Generation

## Overview

This feature adds an AI-powered image generation capability to the canvas customizer in both the client app (`apps/client`) and the admin app (`apps/admin`). A shimmer-animated "Generate Image" button appears above the canvas. Clicking it opens a bottom drawer where the user types a prompt (or picks a preset). The system assembles a context description from the current canvas state, captures the active canvas side as a data URL, and sends both to a server-side Next.js API route that proxies the request to the Gemini API. The returned image is decoded and added to the canvas as a standard `PrintLayer` via the existing `useCustomizer` hook.

The Gemini API key is stored as `GEMINI_API_KEY` (no `NEXT_PUBLIC_` prefix) and is only accessed server-side through the proxy route, keeping it out of the browser bundle entirely.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Customizer (client or admin)                                   │
│                                                                 │
│  ┌──────────────────┐   open   ┌──────────────────────────────┐ │
│  │ GenerateImage    │ ──────►  │ GenerationDrawer             │ │
│  │ Button           │          │  - prompt textarea           │ │
│  └──────────────────┘          │  - PresetsPanel              │ │
│                                │  - "Згенерувати" button      │ │
│                                └──────────┬───────────────────┘ │
│                                           │ submit(prompt)      │
│                                           ▼                     │
│                                ┌──────────────────────────────┐ │
│                                │ useAIGeneration hook         │ │
│                                │  1. captureRef / mockups /   │ │
│                                │     product.images fallback  │ │
│                                │  2. buildCanvasContext(...)  │ │
│                                │  3. POST /api/ai/generate    │ │
│                                └──────────┬───────────────────┘ │
│                                           │ data URL            │
│                                           ▼                     │
│                                ┌──────────────────────────────┐ │
│                                │ dataUrlToFile()              │ │
│                                │ addLayer(file, side, pricing)│ │
│                                └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                           │ POST
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js API Route: /api/ai/generate                            │
│  (apps/admin and apps/client, identical implementation)         │
│                                                                 │
│  - Reads GEMINI_API_KEY from process.env (server-only)          │
│  - Prepends SYSTEM_PROMPT + context to user prompt              │
│  - Forwards multipart request to Gemini API                     │
│  - Extracts image part from response                            │
│  - Returns { dataUrl: "data:image/png;base64,..." }             │
└─────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                              Gemini API (generativelanguage.googleapis.com)
```

### Key Design Decisions

**Server-side proxy over `NEXT_PUBLIC_` key**: The requirements originally mentioned `NEXT_PUBLIC_GEMINI_API_KEY`, but exposing an API key in the browser bundle is a security risk. The design uses a Next.js Route Handler (`/api/ai/generate`) so `GEMINI_API_KEY` never leaves the server. The client sends the prompt + image to its own backend; the backend calls Gemini.

**Pure `buildCanvasContext` function**: Context assembly is extracted as a pure, deterministic function so it can be unit-tested independently of React and the network.

**Shared component placement**: `GenerateImageButton`, `GenerationDrawer`, and `useAIGeneration` are placed inside each app's own component tree (not in `@udo-craft/shared`) because they depend on app-specific routing (`/api/ai/generate`) and Framer Motion, which is not currently a shared-package dependency. The components accept props for all canvas state, keeping them stateless with respect to layer management.

---

## Components and Interfaces

### `GenerateImageButton`

Rendered above the canvas area in both Customizers. Hidden when `NEXT_PUBLIC_GEMINI_ENABLED` is falsy (see §API Key Configuration).

```ts
interface GenerateImageButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

Implemented as a `<button>` wrapped in a Framer Motion `<motion.div>` with a shimmer/shine keyframe animation using Tailwind's `animate-` utilities and a `background-position` tween. Uses shadcn `Button` as the base.

### `GenerationDrawer`

Bottom sheet anchored to the viewport bottom. Animated with Framer Motion `AnimatePresence` + `motion.div` (y: "100%" → y: 0 on enter, reverse on exit).

```ts
interface GenerationDrawerProps {
  open: boolean;
  onClose: () => void;
  addLayer: (file: File, side: string, pricing: PrintTypePricingRow[]) => void;
  activeSide: string;
  printPricing: PrintTypePricingRow[];
  captureRef: React.MutableRefObject<(() => string) | null>;
  layers: PrintLayer[];
  mockups: Record<string, string>;
  selectedColor: string;
  productImages: Record<string, string>;
  productName: string;
}
```

Internal state: `prompt: string`, `loading: boolean`, `error: string | null`.

Renders:
1. Drag handle + close button
2. `<textarea>` for the user prompt
3. `PresetsPanel` — grid of preset chips
4. Optional hint when active side has no layers but another side does
5. "Згенерувати" `<Button>` (disabled + spinner while `loading`)
6. Error message when `error` is set

### `PresetsPanel`

Pure presentational component. Receives `onSelect: (text: string) => void`. Hardcoded list of ≥ 6 Ukrainian-language presets:

```ts
const PRESETS = [
  "хлопець на заході",
  "дівчина-співробітниця у закладі",
  "команда на корпоративі",
  "спортсмен після тренування",
  "студент у кампусі",
  "підприємець на зустрічі",
  "друзі на вулиці міста",
  "молода жінка в кав'ярні",
];
```

### `useAIGeneration` hook

```ts
interface UseAIGenerationOptions {
  addLayer: (file: File, side: string, pricing: PrintTypePricingRow[]) => void;
  activeSide: string;
  printPricing: PrintTypePricingRow[];
  captureRef: React.MutableRefObject<(() => string) | null>;
  layers: PrintLayer[];
  mockups: Record<string, string>;
  selectedColor: string;
  productImages: Record<string, string>;
  productName: string;
}

interface UseAIGenerationReturn {
  generate: (prompt: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}
```

Responsibilities:
1. Resolve the canvas image (priority chain — see §Canvas Context Assembly)
2. Call `buildCanvasContext(...)` to produce the textual description
3. POST to `/api/ai/generate` with `{ prompt, contextDescription, imageDataUrl }`
4. On success: call `dataUrlToFile(dataUrl)` then `addLayer(file, activeSide, printPricing)`
5. On failure: set `error` state with a user-friendly Ukrainian message

### `buildCanvasContext` (pure function)

```ts
interface CanvasContextInput {
  activeSide: string;
  layers: PrintLayer[];
  selectedColor: string;
  productName: string;
  allSides: string[];
}

function buildCanvasContext(input: CanvasContextInput): string
```

See §Canvas Context Assembly Algorithm for the full specification.

### `dataUrlToFile` (pure utility)

```ts
function dataUrlToFile(dataUrl: string, filename?: string): File
```

Splits the data URL at the comma, decodes the base64 payload, constructs a `Uint8Array`, and wraps it in a `File` with the MIME type extracted from the data URL prefix.

### API Route: `/api/ai/generate`

Identical implementation in both apps:
- `apps/admin/src/app/api/ai/generate/route.ts`
- `apps/client/src/app/api/ai/generate/route.ts`

```ts
// POST /api/ai/generate
// Request body (JSON):
interface GenerateRequest {
  prompt: string;           // user's free-text prompt
  contextDescription: string; // assembled by buildCanvasContext on client
  imageDataUrl: string;     // base64 data URL of canvas capture
}

// Response body (JSON):
interface GenerateResponse {
  dataUrl: string;          // "data:image/png;base64,..."
}
// or on error:
interface GenerateErrorResponse {
  error: string;
}
```

---

## Data Models

### Gemini API Request Structure

```json
{
  "contents": [
    {
      "parts": [
        { "text": "<SYSTEM_PROMPT>\n\n<contextDescription>\n\n<userPrompt>" },
        {
          "inlineData": {
            "mimeType": "image/png",
            "data": "<base64-encoded canvas capture>"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE", "TEXT"]
  }
}
```

The three text segments are concatenated into a single text part to keep the request structure simple and ensure the system prompt always precedes user content.

### SYSTEM_PROMPT constant

Defined as a module-level constant in the API route file (server-side only, never exported to client):

```
You are a merch visualization assistant for a Ukrainian print-on-demand platform.
Your task is to generate a realistic photographic mockup image showing a person wearing or using the product described below.

Rules:
- Generate ONLY realistic merch/product visualization images.
- The person should have a Ukrainian appearance and be in a Ukrainian cultural context (urban Kyiv, countryside, café, office, campus, etc.).
- The product must be clearly visible and prominently featured.
- Do NOT generate abstract art, logos, patterns, or images unrelated to a person wearing/using the product.
- Do NOT alter the design printed on the product — show it as-is.
- The image should look like a professional lifestyle product photo.
- If the request is unrelated to merch visualization, generate the closest valid merch visualization you can.
```

### `PrintLayer` (existing, from `@udo-craft/shared`)

The generated image layer is a standard `PrintLayer` with `kind: "image"`. No new fields are added to the shared type.

---

## Canvas Context Assembly Algorithm

`buildCanvasContext` is a pure, deterministic function. Given the same inputs it always produces the same string.

```
function buildCanvasContext({ activeSide, layers, selectedColor, productName, allSides }):

1. Group layers by side:
   layersBySide = Map<side, PrintLayer[]>

2. For each side in allSides:
   - sidesWithLayers = sides where layersBySide[side].length > 0
   - sidesEmpty = sides where layersBySide[side].length === 0

3. For the activeSide:
   - activeLayers = layersBySide[activeSide] ?? []
   - For each layer: collect type (layer.type) and sizeLabel (layer.sizeLabel ?? "unset")

4. Build the description string (deterministic field order):
   Line 1: "Product: {productName}"
   Line 2: "Garment color: {selectedColor}"
   Line 3: "Active side: {activeSide}"
   Line 4: "Sides with prints: {sidesWithLayers.join(', ') || 'none'}"
   Line 5: "Empty sides: {sidesEmpty.join(', ') || 'none'}"
   Line 6: "Layers on active side ({activeSide}): {activeLayers.length}"
   For each layer on activeSide (sorted by layer.id for determinism):
     "  - type: {layer.type}, size: {layer.sizeLabel ?? 'unset'}"
   For each other side with layers (sorted alphabetically):
     "Layers on {side}: {count} ({types joined by ', '})"

5. Return the assembled string.
```

**Image capture priority** (resolved in `useAIGeneration`, not in `buildCanvasContext`):

1. If `activeSide` has at least one layer AND `captureRef.current` is a function → call `captureRef.current()` to get a live canvas data URL
2. Else if `mockups[activeSide]` is a non-empty string → use the cached mockup
3. Else if `productImages[activeSide]` is a non-empty string → use the product base image
4. Else → use the first available value in `productImages` (any side)

If none of the above yields a data URL, the request is sent without an image part (text-only generation).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: GenerateImageButton visibility is layer-count-independent

*For any* layers array (including empty), when `GEMINI_API_KEY` is configured, the `GenerateImageButton` SHALL be present in the rendered output of the Customizer.

**Validates: Requirements 1.4**

---

### Property 2: Preset count invariant

*For any* rendered `GenerationDrawer`, the number of preset suggestions displayed SHALL be greater than or equal to 6.

**Validates: Requirements 2.3**

---

### Property 3: Preset click populates textarea

*For any* preset at index `i` in the presets list, clicking that preset chip SHALL set the textarea value to exactly the text of preset `i`.

**Validates: Requirements 2.4**

---

### Property 4: SystemPrompt is always first in request body

*For any* user prompt string `p` and any canvas context description `c`, the text part of the Gemini API request body assembled by the API route SHALL start with the `SYSTEM_PROMPT` constant, followed by `c`, followed by `p`.

**Validates: Requirements 3.2, 4.1**

---

### Property 5: Canvas image is always included in request

*For any* non-empty image data URL `d`, the Gemini API request body assembled by the API route SHALL contain an `inlineData` part whose `data` field equals the base64 payload extracted from `d`.

**Validates: Requirements 3.3**

---

### Property 6: Response parsing produces valid data URL

*For any* base64 string `b` and MIME type `m` starting with `"image/"`, a Gemini response part `{ inlineData: { mimeType: m, data: b } }` SHALL be parsed into a data URL of the form `"data:{m};base64,{b}"`.

**Validates: Requirements 3.4**

---

### Property 7: Missing image part surfaces an error

*For any* Gemini API response whose `candidates[0].content.parts` array contains no part with an `inlineData.mimeType` starting with `"image/"`, the response parser SHALL return an error result rather than a data URL.

**Validates: Requirements 3.5**

---

### Property 8: Generated layer is a valid PrintLayer

*For any* image data URL `d` and active side `s`, the `PrintLayer` constructed from `d` and `s` SHALL have all required fields: `id` (non-empty string), `file` (File instance), `url` (string starting with `"data:image"`), `type` (valid `PrintTypeId`), `side` equal to `s`, and `kind` equal to `"image"`.

**Validates: Requirements 5.1, 5.5**

---

### Property 9: addLayer is called with File derived from data URL

*For any* valid image data URL returned by the API route, `useAIGeneration.generate()` SHALL call `addLayer` with a `File` object whose content matches the decoded bytes of the data URL's base64 payload.

**Validates: Requirements 5.1**

---

### Property 10: GenerateImageButton hidden when API key absent

*For any* render of the Customizer where `NEXT_PUBLIC_GEMINI_ENABLED` is falsy (env var absent or empty), the `GenerateImageButton` SHALL NOT be present in the rendered output.

**Validates: Requirements 6.4**

---

### Property 11: buildCanvasContext is deterministic

*For any* canvas state `{ activeSide, layers, selectedColor, productName, allSides }`, calling `buildCanvasContext(state)` twice SHALL return the same string both times.

**Validates: Requirements 9.5**

---

### Property 12: buildCanvasContext output contains all required fields

*For any* canvas state `{ activeSide, layers, selectedColor, productName, allSides }`, the string returned by `buildCanvasContext(state)` SHALL contain: the `productName`, the `selectedColor`, the `activeSide`, a count of layers on the active side, and the print type of each layer on the active side.

**Validates: Requirements 9.2**

---

### Property 13: Image capture priority is respected

*For any* combination of `captureRef` availability (function or null), `mockups` map (populated or empty), and `productImages` map (populated or empty), `useAIGeneration` SHALL select the image source according to the priority: captureRef (when active side has layers) > mockups[activeSide] > productImages[activeSide] > any productImages value.

**Validates: Requirements 9.1, 9.6**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `GEMINI_API_KEY` not set on server | API route returns `{ error: "AI generation is not configured" }` with status 500 |
| `NEXT_PUBLIC_GEMINI_ENABLED` not set on client | `GenerateImageButton` is hidden; feature silently disabled |
| Gemini API HTTP error (4xx/5xx) | API route forwards status; `useAIGeneration` sets `error` to Ukrainian message |
| Gemini response contains no image part | API route returns `{ error: "No image in response" }` with status 502; hook surfaces it |
| Gemini safety block / refusal | Treated as "no image part" — same error path |
| `captureRef.current()` returns empty string | Falls through to `mockups` then `productImages` fallback |
| `dataUrlToFile` receives malformed data URL | Throws; `useAIGeneration` catches and sets `error` |
| Network timeout | `fetch` with `AbortController` (15 s timeout); hook surfaces timeout error |

All user-visible error messages are in Ukrainian. The `GenerationDrawer` renders the `error` string below the generate button in a destructive-colored text block.

---

## Testing Strategy

### Unit Tests (example-based)

- Render `GenerateImageButton` — assert present when env enabled, absent when disabled
- Render `GenerationDrawer` — assert textarea, presets, generate button, close control are present
- Render `GenerationDrawer` with `loading=true` — assert button disabled and spinner visible
- Render `GenerationDrawer` with layers only on non-active side — assert hint message present
- Assert `SYSTEM_PROMPT` constant contains required instruction keywords
- Assert `SYSTEM_PROMPT` constant is not rendered in `GenerationDrawer` output
- After successful generation, assert `GenerationDrawer` closes (open prop becomes false)
- After successful generation, assert `activeLayerId` is set to the new layer's id

### Property-Based Tests

Uses **fast-check** (already compatible with the TypeScript/Jest/Vitest stack). Each test runs a minimum of **100 iterations**.

Tag format: `// Feature: canvas-ai-image-generation, Property {N}: {property_text}`

| Property | Generator inputs | Assertion |
|---|---|---|
| P1: Button visibility is layer-count-independent | `fc.array(arbitraryPrintLayer())` | Button present in render |
| P2: Preset count ≥ 6 | (static render) | `presets.length >= 6` |
| P3: Preset click populates textarea | `fc.integer({ min: 0, max: PRESETS.length - 1 })` | textarea value === PRESETS[i] |
| P4: SystemPrompt first in request | `fc.string(), fc.string()` (prompt, context) | request text part starts with SYSTEM_PROMPT |
| P5: Canvas image in request | `fc.string()` (base64), `fc.constantFrom("image/png","image/jpeg")` | inlineData.data matches |
| P6: Response parsing → valid data URL | `fc.string(), fc.constantFrom("image/png","image/jpeg")` | output starts with `"data:image/"` |
| P7: Missing image part → error | `fc.array(arbitraryNonImagePart())` | parser returns error |
| P8: Generated layer is valid PrintLayer | `fc.string()` (data URL), `fc.string()` (side) | all required fields present |
| P9: addLayer called with correct File | `fc.string()` (data URL) | addLayer spy called with File |
| P10: Button hidden when key absent | (render with env var unset) | button not in output |
| P11: buildCanvasContext deterministic | `arbitraryCanvasState()` | two calls return identical string |
| P12: buildCanvasContext contains required fields | `arbitraryCanvasState()` | output contains productName, color, side, layer count, types |
| P13: Image capture priority | `arbitraryCaptureSources()` | correct source selected per priority rules |

### Integration Tests

- POST `/api/ai/generate` with a real (or mocked) Gemini response — assert `dataUrl` in response
- POST `/api/ai/generate` with missing `GEMINI_API_KEY` — assert 500 + error message
- POST `/api/ai/generate` with Gemini returning no image part — assert 502 + error message
- `addLayer` upload flow — mock `/api/upload`, trigger generation, assert upload called with generated file
- `useCustomizer.addLayer` is called (not direct state mutation) when generation succeeds
