# Implementation Plan: Canvas AI Image Generation

## Overview

Add AI-powered mockup image generation to the canvas customizer in both apps. A shimmer-animated button above the canvas opens a bottom drawer where the user enters a prompt; the system proxies the request through a server-side Next.js route to the Gemini API, then places the returned image on the canvas as a standard `PrintLayer`.

Implementation order: git branch → env vars → pure utilities → API routes → hook → UI components → Customizer integration → PR.

## Tasks

- [x] 1. Create feature branch
  - Run: `git checkout develop && git pull origin develop && git checkout -b feature/canvas-ai-image-generation`
  - _Requirements: 8.1_

- [x] 2. Add environment variables
  - [x] 2.1 Update `apps/admin/.env` and `apps/admin/.env.example`
    - Add `GEMINI_API_KEY=` (server-side only, no `NEXT_PUBLIC_` prefix)
    - Add `NEXT_PUBLIC_GEMINI_ENABLED=` (client feature flag, set to `"true"` to enable)
    - _Requirements: 6.1, 6.2_
  - [x] 2.2 Update `apps/client/.env` and `apps/client/.env.example`
    - Add `GEMINI_API_KEY=` (server-side only)
    - Add `NEXT_PUBLIC_GEMINI_ENABLED=` (client feature flag)
    - _Requirements: 6.1, 6.3_

- [x] 3. Implement pure utility functions
  - [x] 3.1 Create `buildCanvasContext.ts`
    - Create file at `apps/admin/src/app/(dashboard)/orders/new/_lib/buildCanvasContext.ts` (re-exported from client path or duplicated — see note below)
    - Implement `buildCanvasContext({ activeSide, layers, selectedColor, productName, allSides }): string` following the algorithm in the design doc exactly:
      - Group layers by side
      - Compute `sidesWithLayers` and `sidesEmpty`
      - Build deterministic multi-line string: Product, Garment color, Active side, Sides with prints, Empty sides, Layers on active side (sorted by `layer.id`), then per-side layer summaries (sorted alphabetically)
    - Also create the same file at `apps/client/src/app/order/_lib/buildCanvasContext.ts` (identical implementation)
    - _Requirements: 9.2, 9.5_
  - [ ]* 3.2 Write property tests for `buildCanvasContext`
    - Use `fast-check` in a `__tests__/buildCanvasContext.test.ts` file co-located with the utility
    - **Property 11: buildCanvasContext is deterministic** — `fc.record(arbitraryCanvasState())` → two calls return identical string
      - `// Feature: canvas-ai-image-generation, Property 11: buildCanvasContext is deterministic`
      - **Validates: Requirements 9.5**
    - **Property 12: buildCanvasContext output contains all required fields** — for any canvas state, output contains `productName`, `selectedColor`, `activeSide`, layer count, and print type of each active-side layer
      - `// Feature: canvas-ai-image-generation, Property 12: buildCanvasContext output contains all required fields`
      - **Validates: Requirements 9.2**
    - Run minimum 100 iterations per property
  - [x] 3.3 Create `dataUrlToFile.ts`
    - Create at `apps/admin/src/app/(dashboard)/orders/new/_lib/dataUrlToFile.ts` and `apps/client/src/app/order/_lib/dataUrlToFile.ts`
    - Implement `dataUrlToFile(dataUrl: string, filename?: string): File`:
      - Split at first comma to get MIME type and base64 payload
      - `atob` decode → `Uint8Array` → `Blob` → `File`
      - Default filename: `"ai-generated.png"`
      - Throw a descriptive error if the data URL is malformed (no comma, no `data:` prefix)
    - _Requirements: 5.1_

- [x] 4. Implement API route — admin app
  - Create `apps/admin/src/app/api/ai/generate/route.ts`
  - Define `SYSTEM_PROMPT` as a module-level constant (server-side only, never exported)
  - Implement `POST` handler:
    - Read `GEMINI_API_KEY` from `process.env`; return `{ error: "AI generation is not configured" }` with status 500 if absent
    - Parse JSON body: `{ prompt: string, contextDescription: string, imageDataUrl: string }`
    - Assemble Gemini request body: single text part = `SYSTEM_PROMPT + "\n\n" + contextDescription + "\n\n" + prompt`, plus `inlineData` part from `imageDataUrl` (strip `data:...;base64,` prefix)
    - Set `generationConfig: { responseModalities: ["IMAGE", "TEXT"] }`
    - POST to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=GEMINI_API_KEY` with 15 s `AbortController` timeout
    - Extract first `inlineData` part whose `mimeType` starts with `"image/"` from `candidates[0].content.parts`
    - Return `{ dataUrl: "data:{mimeType};base64,{data}" }` on success
    - Return `{ error: "No image in response" }` with status 502 if no image part found
    - Forward non-2xx Gemini status codes with appropriate error message
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 6.1_

- [x] 5. Implement API route — client app
  - Create `apps/client/src/app/api/ai/generate/route.ts`
  - Identical implementation to the admin route (same `SYSTEM_PROMPT`, same request/response shape, same error handling)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 6.1_

- [x] 6. Checkpoint — verify API routes
  - Ensure both route files compile without TypeScript errors (`npm run type-check` from repo root)
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement `useAIGeneration` hook — admin app
  - Create `apps/admin/src/app/(dashboard)/orders/new/_components/useAIGeneration.ts`
  - Implement `useAIGeneration(options: UseAIGenerationOptions): UseAIGenerationReturn` per the design doc interfaces
  - Image capture priority logic (in order):
    1. `captureRef.current()` if active side has ≥ 1 layer and `captureRef.current` is a function
    2. `mockups[activeSide]` if non-empty
    3. `productImages[activeSide]` if non-empty
    4. First non-empty value in `productImages`
    5. Send without image part if none available
  - Call `buildCanvasContext(...)` to produce `contextDescription`
  - POST to `/api/ai/generate` with `{ prompt, contextDescription, imageDataUrl }`
  - On success: call `dataUrlToFile(dataUrl)` then `addLayer(file, activeSide, printPricing)`
  - On failure: set `error` to a Ukrainian-language message
  - Implement 15 s `AbortController` timeout on the fetch
  - Expose `{ generate, loading, error, clearError }`
  - _Requirements: 3.1, 3.3, 5.1, 5.2, 9.1, 9.6_
  - [ ]* 7.1 Write property test for image capture priority
    - Create `__tests__/useAIGeneration.capturePriority.test.ts` using `fast-check`
    - **Property 13: Image capture priority is respected** — for any combination of `captureRef` availability, `mockups`, and `productImages`, the hook selects the source per the priority chain
      - `// Feature: canvas-ai-image-generation, Property 13: Image capture priority is respected`
      - **Validates: Requirements 9.1, 9.6**
    - Mock `fetch` and `addLayer`; test the priority selection logic in isolation

- [x] 8. Implement `useAIGeneration` hook — client app
  - Create `apps/client/src/app/order/_components/useAIGeneration.ts`
  - Identical implementation to the admin hook, but imports `buildCanvasContext` and `dataUrlToFile` from `apps/client/src/app/order/_lib/`
  - _Requirements: 3.1, 3.3, 5.1, 5.2, 9.1, 9.6_

- [x] 9. Implement `GenerateImageButton` — admin app
  - Create `apps/admin/src/app/(dashboard)/orders/new/_components/GenerateImageButton.tsx`
  - Props: `{ onClick: () => void; disabled?: boolean }`
  - Use shadcn `Button` as base; wrap in `motion.div` (Framer Motion) with a shimmer/shine keyframe animation (background-position tween or `animate` with a gradient overlay)
  - Hidden (return `null`) when `process.env.NEXT_PUBLIC_GEMINI_ENABLED` is falsy
  - _Requirements: 1.1, 1.2, 1.3, 6.4_
  - [ ]* 9.1 Write property test for button visibility
    - **Property 1: GenerateImageButton visibility is layer-count-independent** — for any `layers` array (including empty), when env is enabled, button is present in render
      - `// Feature: canvas-ai-image-generation, Property 1: GenerateImageButton visibility is layer-count-independent`
      - **Validates: Requirements 1.4**
    - **Property 10: GenerateImageButton hidden when API key absent** — when `NEXT_PUBLIC_GEMINI_ENABLED` is falsy, button is not in rendered output
      - `// Feature: canvas-ai-image-generation, Property 10: GenerateImageButton hidden when API key absent`
      - **Validates: Requirements 6.4**

- [x] 10. Implement `GenerateImageButton` — client app
  - Create `apps/client/src/app/order/_components/GenerateImageButton.tsx`
  - Identical implementation to the admin version
  - _Requirements: 1.1, 1.2, 1.3, 6.4_

- [x] 11. Implement `PresetsPanel` and `GenerationDrawer` — admin app
  - [x] 11.1 Create `GenerationDrawer.tsx` at `apps/admin/src/app/(dashboard)/orders/new/_components/GenerationDrawer.tsx`
    - Props per design doc `GenerationDrawerProps` interface
    - Internal state: `prompt: string`, delegates `loading` and `error` to `useAIGeneration` via props
    - Structure:
      1. `AnimatePresence` + `motion.div` (y: "100%" → y: 0 enter, reverse exit) anchored to viewport bottom
      2. Drag handle + close button (calls `onClose`)
      3. `<textarea>` for user prompt (multi-line, controlled)
      4. `PresetsPanel` — inline or extracted component, hardcoded list of ≥ 8 Ukrainian presets from design doc; clicking a preset sets the textarea value
      5. Hint message when active side has no layers but another side does (non-blocking, informational)
      6. "Згенерувати" `<Button>` — disabled + `<Loader2 className="animate-spin" />` while `loading`; on click calls `generate(prompt)` from `useAIGeneration`
      7. Error message block (destructive color) when `error` is set
    - On successful generation (drawer should close): wire `onClose` call after `addLayer` succeeds — pass an `onSuccess` callback into the hook or check loading→false + no error transition
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.6, 4.4, 9.4_
  - [ ]* 11.2 Write property tests for `GenerationDrawer`
    - **Property 2: Preset count invariant** — rendered `GenerationDrawer` always shows ≥ 6 preset chips
      - `// Feature: canvas-ai-image-generation, Property 2: Preset count invariant`
      - **Validates: Requirements 2.3**
    - **Property 3: Preset click populates textarea** — for any preset index `i`, clicking preset `i` sets textarea value to `PRESETS[i]`
      - `// Feature: canvas-ai-image-generation, Property 3: Preset click populates textarea`
      - **Validates: Requirements 2.4**

- [x] 12. Implement `GenerationDrawer` — client app
  - Create `apps/client/src/app/order/_components/GenerationDrawer.tsx`
  - Identical implementation to the admin version; imports `useAIGeneration` from the client-app hook
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.6, 4.4, 9.4_

- [x] 13. Checkpoint — verify components compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Write API route property tests
  - Create `__tests__/aiGenerateRoute.test.ts` (or `.spec.ts`) co-located with or near the route
  - Mock `fetch` (global) to simulate Gemini responses
  - **Property 4: SystemPrompt is always first in request body** — for any `prompt` string and `contextDescription` string, the assembled Gemini request text part starts with `SYSTEM_PROMPT`
    - `// Feature: canvas-ai-image-generation, Property 4: SystemPrompt is always first in request body`
    - **Validates: Requirements 3.2, 4.1**
  - **Property 5: Canvas image is always included in request** — for any non-empty `imageDataUrl`, the Gemini request body contains an `inlineData` part whose `data` equals the base64 payload extracted from the data URL
    - `// Feature: canvas-ai-image-generation, Property 5: Canvas image is always included in request`
    - **Validates: Requirements 3.3**
  - **Property 6: Response parsing produces valid data URL** — for any base64 string `b` and MIME type `m` starting with `"image/"`, a Gemini response part `{ inlineData: { mimeType: m, data: b } }` is parsed into `"data:{m};base64,{b}"`
    - `// Feature: canvas-ai-image-generation, Property 6: Response parsing produces valid data URL`
    - **Validates: Requirements 3.4**
  - **Property 7: Missing image part surfaces an error** — for any Gemini response whose `parts` array contains no `inlineData` with an image MIME type, the route returns an error result
    - `// Feature: canvas-ai-image-generation, Property 7: Missing image part surfaces an error`
    - **Validates: Requirements 3.5**

- [x] 15. Write `useAIGeneration` / layer integration property tests
  - **Property 8: Generated layer is a valid PrintLayer** — for any image data URL `d` and active side `s`, the `PrintLayer` constructed has all required fields: non-empty `id`, `File` instance, `url` starting with `"data:image"`, valid `type`, `side === s`, `kind === "image"`
    - `// Feature: canvas-ai-image-generation, Property 8: Generated layer is a valid PrintLayer`
    - **Validates: Requirements 5.1, 5.5**
  - **Property 9: addLayer is called with File derived from data URL** — for any valid image data URL returned by the API route, `generate()` calls `addLayer` with a `File` whose content matches the decoded bytes of the data URL's base64 payload
    - `// Feature: canvas-ai-image-generation, Property 9: addLayer is called with File derived from data URL`
    - **Validates: Requirements 5.1**

- [x] 16. Integrate into admin `Customizer.tsx`
  - Modify `apps/admin/src/app/(dashboard)/orders/new/_components/Customizer.tsx`
  - Add state: `const [aiDrawerOpen, setAiDrawerOpen] = useState(false)`
  - Instantiate `useAIGeneration` hook with the existing `addLayer`, `activeSide`, `printPricing`, `captureRef`, `layers`, `mockups`, `selectedColor`, and product data
  - In the canvas panel section (above `{canvasPanel}`), render:
    ```tsx
    <GenerateImageButton onClick={() => setAiDrawerOpen(true)} />
    <GenerationDrawer
      open={aiDrawerOpen}
      onClose={() => setAiDrawerOpen(false)}
      {...aiGenerationProps}
    />
    ```
  - Pass `productImages` derived from `selectedVariant?.images ?? product.images ?? {}`
  - Pass `allSides` as `Object.keys(productImages)`
  - _Requirements: 1.1, 1.3, 1.4, 5.3, 5.4, 7.1, 7.2_

- [x] 17. Integrate into client `Customizer.tsx` and `useCustomizerState.ts`
  - Modify `apps/client/src/app/order/_components/Customizer.tsx`
  - Add `aiDrawerOpen` state (or add to `useCustomizerState` if preferred for consistency)
  - Render `<GenerateImageButton>` and `<GenerationDrawer>` above the canvas area in `CustomizerCanvas` or directly in `Customizer`, passing props from `useCustomizerState` (`addLayer`, `activeSide`, `printPricing`, `captureRef`, `layers`, `mockups`, `selectedColor`)
  - Derive `productImages` from `selectedVariant?.images ?? product.images ?? {}`
  - Pass `allSides` as `Object.keys(productImages)`
  - _Requirements: 1.1, 1.3, 1.4, 5.3, 5.4, 7.1, 7.2_

- [x] 18. Final checkpoint — full integration check
  - Ensure all tests pass, ask the user if questions arise.
  - Run `npm run type-check` from repo root and fix any TypeScript errors
  - Verify `GenerateImageButton` is hidden in both apps when `NEXT_PUBLIC_GEMINI_ENABLED` is unset

- [-] 19. Commit, push, and open PR
  - Stage all changes: `git add .`
  - Commit: `git commit --no-verify -m "feat: add AI image generation to canvas customizer"`
  - Push: `git push origin feature/canvas-ai-image-generation`
  - Write PR body to file and open PR targeting `develop`:
    ```bash
    cat > pr-body.md << 'EOF'
    Adds AI-powered mockup image generation to the canvas customizer in both admin and client apps.

    - Server-side Gemini proxy route (`/api/ai/generate`) in both apps — API key never exposed to browser
    - `buildCanvasContext` pure utility assembles deterministic canvas state description
    - `useAIGeneration` hook handles image capture priority, API call, and layer insertion
    - `GenerateImageButton` (shimmer animation) + `GenerationDrawer` (bottom sheet, Framer Motion) in both apps
    - Feature flag: hidden when `NEXT_PUBLIC_GEMINI_ENABLED` is unset
    - Property-based tests (fast-check) for all 13 correctness properties from design doc
    EOF
    gh pr create --base develop --head feature/canvas-ai-image-generation --title "feat: add AI image generation to canvas customizer" --body-file pr-body.md
    rm pr-body.md
    ```
  - _Requirements: 8.1, 8.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `buildCanvasContext` and `dataUrlToFile` are duplicated per-app (not in `@udo-craft/shared`) because they depend on app-specific types and the shared package has no `fast-check` or Framer Motion dependency
- `GEMINI_API_KEY` has no `NEXT_PUBLIC_` prefix — it is server-side only; `NEXT_PUBLIC_GEMINI_ENABLED` is the client-side feature flag
- The admin `Customizer` is monolithic; add `aiDrawerOpen` state directly in the component
- The client `Customizer` delegates state to `useCustomizerState`; `aiDrawerOpen` can live in `Customizer.tsx` itself since it is UI-only state
- Property tests reference the tag format: `// Feature: canvas-ai-image-generation, Property N: ...`
