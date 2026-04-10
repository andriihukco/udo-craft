# Requirements Document

## Introduction

This feature adds AI-powered mockup image generation to the canvas customizer in both the client app (`/order`) and the admin app (`/orders/new`). A "Generate Image" button appears in a visually prominent section above the canvas. When clicked, it opens a bottom drawer where the user enters a text prompt. The system calls the Gemini API with a hidden system prompt that constrains generation to realistic Ukrainian-looking people wearing the product's merch. The resulting image is placed on the canvas as a new `PrintLayer`, following the existing `useCustomizer` hook pattern from `@udo-craft/shared`.

---

## Glossary

- **AI_Generator**: The client-side module responsible for calling the Gemini API and returning a generated image.
- **Customizer**: The full-screen canvas editor component present in both the client app (`/order`) and the admin app (`/orders/new`).
- **GenerateImageButton**: The animated button rendered above the canvas area that opens the generation drawer.
- **GenerationDrawer**: The bottom sheet/panel that collects the user's prompt and triggers image generation.
- **Gemini_API**: The Google Generative Language REST API (`generativelanguage.googleapis.com/v1beta`) used for image generation, accessed with model `gemini-2.0-flash-preview-image-generation`.
- **PrintLayer**: The data structure defined in `@udo-craft/shared` that represents a single image or text layer on the canvas.
- **SystemPrompt**: The hidden, non-user-editable instruction sent to the Gemini API that constrains generation to merch visualizations with a Ukrainian aesthetic.
- **useCustomizer**: The shared React hook from `@udo-craft/shared` that manages canvas layers, uploads, and cart operations.
- **Canvas**: The Fabric.js-powered product canvas where layers are composited on top of the product mockup image.
- **PresetsPanel**: The UI section inside the GenerationDrawer that displays example prompt suggestions.

---

## Requirements

### Requirement 1: Generate Image Button

**User Story:** As a user of the canvas customizer, I want a clearly visible "Generate Image" button above the canvas, so that I can quickly discover and access the AI image generation feature.

#### Acceptance Criteria

1. THE Customizer SHALL render the GenerateImageButton in a dedicated section visually separated from the canvas controls, positioned above the canvas area.
2. THE GenerateImageButton SHALL be styled using shadcn/ui components and Tailwind CSS, with a Framer Motion animation (e.g., shimmer/shine effect) that makes it visually distinct from other controls.
3. THE GenerateImageButton SHALL be present in both the client app Customizer (`apps/client`) and the admin app Customizer (`apps/admin`).
4. WHEN the GenerateImageButton is rendered, THE Customizer SHALL display it regardless of whether any layers are currently present on the canvas.

---

### Requirement 2: Generation Drawer

**User Story:** As a user, I want a bottom drawer to open when I click "Generate Image", so that I can enter a prompt and initiate generation without leaving the customizer.

#### Acceptance Criteria

1. WHEN the GenerateImageButton is clicked, THE Customizer SHALL open the GenerationDrawer as a bottom sheet anchored to the bottom of the viewport.
2. THE GenerationDrawer SHALL contain a multi-line text area where the user can type a custom prompt.
3. THE GenerationDrawer SHALL contain a PresetsPanel displaying at least 6 example prompt suggestions (e.g., "хлопець на заході", "дівчина-співробітниця у закладі", "команда на корпоративі", "спортсмен після тренування", "студент у кампусі", "підприємець на зустрічі").
4. WHEN a preset suggestion is clicked, THE GenerationDrawer SHALL populate the text area with the selected preset text.
5. THE GenerationDrawer SHALL contain a "Згенерувати" (Generate) action button that submits the prompt.
6. THE GenerationDrawer SHALL contain a close/dismiss control that closes the drawer without triggering generation.
7. THE GenerationDrawer SHALL be animated using Framer Motion (slide-up entrance, slide-down exit).

---

### Requirement 3: Image Generation via Gemini API

**User Story:** As a user, I want the system to generate a contextually relevant mockup image based on my prompt, so that I can visualize how the merch looks on a real person.

#### Acceptance Criteria

1. WHEN the user submits a prompt in the GenerationDrawer, THE AI_Generator SHALL send a request to the Gemini API endpoint `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent`.
2. THE AI_Generator SHALL include the SystemPrompt as the first part of the request contents, prepended before the user's prompt text, so that the user cannot see or modify it.
3. THE AI_Generator SHALL include the current canvas mockup image (captured via `captureRef`) as an inline image part in the Gemini API request, so that the generated image is contextually aware of the product.
4. WHEN the Gemini API returns a successful response containing an image, THE AI_Generator SHALL decode the base64-encoded image data and produce a data URL of type `image/png` or `image/jpeg`.
5. WHEN the Gemini API returns an error or a response containing no image part, THE AI_Generator SHALL surface a user-visible error message describing the failure.
6. WHILE a generation request is in progress, THE GenerationDrawer SHALL display a loading indicator and disable the "Згенерувати" button to prevent duplicate submissions.

---

### Requirement 4: Safety and Content Constraints (SystemPrompt)

**User Story:** As the platform operator, I want all AI-generated images to be constrained to merch visualizations with a Ukrainian aesthetic, so that the feature cannot be misused for free-form or off-brand content generation.

#### Acceptance Criteria

1. THE AI_Generator SHALL always prepend the SystemPrompt to every Gemini API request; the SystemPrompt SHALL NOT be exposed in any client-side UI or network response visible to the end user beyond the API call itself.
2. THE SystemPrompt SHALL instruct the Gemini API to generate only realistic mockup/merch visualization images showing people wearing the product.
3. THE SystemPrompt SHALL specify a Ukrainian visual aesthetic: realistic Ukrainian-looking people, Ukrainian cultural context, no requirement for specific ethnicity exclusions stated in user-visible text.
4. THE GenerationDrawer SHALL display only the PresetsPanel suggestions and a free-text prompt field; no system prompt content SHALL be rendered in the UI.
5. WHEN the user's prompt does not relate to a merch visualization context, THE AI_Generator SHALL rely on the SystemPrompt to redirect the generation; THE Customizer SHALL display a user-friendly error message if the API returns a safety block or refusal.

---

### Requirement 5: Canvas Layer Integration

**User Story:** As a user, I want the generated image to appear on the canvas as a layer, so that I can reposition, resize, and manage it like any other uploaded image.

#### Acceptance Criteria

1. WHEN the AI_Generator successfully produces an image data URL, THE Customizer SHALL convert the data URL to a `File` object and call `addLayer(file, activeSide, printPricing)` from the `useCustomizer` hook to add it as a new `PrintLayer`.
2. WHEN the generated image layer is added, THE Customizer SHALL upload the image file to `/api/upload` following the same upload flow used by `addLayer` in `useCustomizer`, setting `uploadedUrl` on the layer once the upload completes.
3. WHEN the generated image layer is added, THE Customizer SHALL set it as the `activeLayerId` so it is immediately selected and editable on the canvas.
4. WHEN the generated image layer is added, THE GenerationDrawer SHALL close automatically.
5. THE generated image layer SHALL be a standard `PrintLayer` object compatible with all existing layer operations: delete, duplicate, resize, reposition, remove background, and type/size-label assignment.

---

### Requirement 6: API Key Configuration

**User Story:** As a developer, I want the Gemini API key to be stored as an environment variable, so that it is not hardcoded in source code and can be rotated without a code change.

#### Acceptance Criteria

1. THE AI_Generator SHALL read the Gemini API key from the environment variable `NEXT_PUBLIC_GEMINI_API_KEY` at runtime.
2. THE admin app (`apps/admin/.env`) SHALL include `NEXT_PUBLIC_GEMINI_API_KEY` as a documented environment variable entry.
3. THE client app (`apps/client/.env`) SHALL include `NEXT_PUBLIC_GEMINI_API_KEY` as a documented environment variable entry.
4. IF `NEXT_PUBLIC_GEMINI_API_KEY` is not set or is an empty string, THEN THE GenerateImageButton SHALL be hidden and the feature SHALL be silently disabled, so that the customizer remains fully functional without the AI feature.

---

### Requirement 7: Shared Hook Compatibility

**User Story:** As a developer, I want the AI generation feature to integrate with the existing `useCustomizer` hook pattern, so that the codebase remains consistent and the feature does not duplicate layer management logic.

#### Acceptance Criteria

1. THE Customizer SHALL use `setLayersWithRef` and `addLayer` from the `useCustomizer` hook (imported from `@udo-craft/shared`) to add the generated image layer, rather than managing a separate layer state.
2. THE AI generation UI components (GenerateImageButton, GenerationDrawer) SHALL accept `addLayer`, `activeSide`, `printPricing`, and `captureRef` as props, so that they remain stateless with respect to canvas layer management.
3. THE GenerationDrawer component SHALL be implemented as a reusable component usable in both the client app and the admin app without modification to `@udo-craft/shared`.

---

### Requirement 8: Git Branch

**User Story:** As a developer, I want the feature developed on a dedicated branch following the project's branching convention, so that it can be reviewed and merged independently.

#### Acceptance Criteria

1. THE developer SHALL create the feature branch `feature/canvas-ai-image-generation` from the `develop` branch before beginning implementation.
2. THE developer SHALL follow the git workflow defined in the project guide: commit with `--no-verify`, push to `feature/canvas-ai-image-generation`, and open a PR targeting `develop` using the `gh` CLI.

---

### Requirement 9: Canvas Context Assembly

**User Story:** As a user, I want the AI generator to understand the full state of my canvas mockup — which side I'm designing, what prints are placed, and the garment color — so that the generated image is contextually accurate and relevant to my actual design.

#### Acceptance Criteria

1. WHEN the user submits a prompt, THE AI_Generator SHALL capture the canvas image using the following priority: (1) call `captureRef.current()` if the active side has at least one layer; (2) use `mockups[activeSide]` if `captureRef` is unavailable or the active side has no layers; (3) use `product.images[activeSide]` as a final fallback if neither is available.
2. WHEN assembling the Gemini API request, THE AI_Generator SHALL construct a textual context description containing: the active side name (e.g., "front side"), the list of sides that have layers vs. sides that are empty, the garment color name from `selectedColor`, the count and print types of layers per side (e.g., "2 DTF prints on front, 1 embroidery on back"), and any available `sizeLabel` values for each layer.
3. THE AI_Generator SHALL append the assembled context description to the SystemPrompt before sending the request to the Gemini API, so that Gemini receives full mockup state without exposing it in the user-visible UI.
4. WHEN the active side has no layers but at least one other side has layers, THE GenerationDrawer SHALL display a non-blocking hint message identifying which side contains the design (e.g., "Generating based on front side with your design").
5. THE AI_Generator SHALL produce an identical context description for identical canvas state — same `activeSide`, `layers`, `selectedColor`, and `mockups` values SHALL always yield the same context string (deterministic assembly).
6. IF all sides have no layers, THEN THE AI_Generator SHALL still proceed using the product base image and a context description indicating an empty canvas, so that generation remains functional for users who have not yet added any prints.
