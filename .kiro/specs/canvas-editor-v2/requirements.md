# Requirements Document

## Introduction

Canvas Editor v2 is a comprehensive redesign of the Fabric.js-based canvas customizer used in both `apps/admin` and `apps/client`. The goal is to replace the current flat `LeftPanel` / `CustomizerLeftPanel` with a professional, Apple/Google-quality sidebar experience: four contextual tool panels (Prints, Draw, Text, Upload), richer text controls, a large static shapes library, freehand drawing with AI illustration generation, and a fully responsive mobile layout.

The existing `GenerationDrawer` component (mockup visualization of people wearing merch) is **already implemented and must not be modified**. The AI feature in the Draw panel is a separate, new capability with a different purpose: generating standalone illustrations and artwork.

All new shared types and constants live in `packages/shared`. UI components stay per-app unless purely presentational. Both `apps/admin` and `apps/client` receive the same sidebar treatment.

---

## Glossary

- **Canvas_Editor**: The full-screen Fabric.js customizer component in both admin (`Customizer.tsx`) and client (`Customizer.tsx`).
- **Sidebar**: The vertical icon navigation bar on the left edge of the Canvas_Editor on desktop, or the horizontal bottom navigation bar on mobile.
- **Panel**: A contextual drawer that opens alongside the canvas when a SidebarTab is activated.
- **SidebarTab**: One of the four icon buttons in the Sidebar: Prints, Draw, Text, Upload.
- **PrintLayer**: The existing shared type in `@udo-craft/shared` representing one canvas layer (image, text, or drawing).
- **TextLayer**: A `PrintLayer` with `kind === "text"`.
- **DrawLayer**: A `PrintLayer` with `kind === "drawing"` — a rasterised freehand stroke exported as PNG.
- **PrintPreset**: A pre-made print design stored in the Supabase `print_presets` table, added as an image `PrintLayer`.
- **ShapePreset**: A static SVG asset bundled in `/public/shapes/`, defined by the `ELEMENT_PRESETS` constant in `@udo-craft/shared`.
- **DrawingSession**: The set of unsaved Fabric.js paths, lines, and shape-stamps currently on the canvas in drawing mode. A DrawingSession is scoped to one canvas side and is discarded if the user exits without saving.
- **DrawingTool**: One of four tools available in the Draw Panel: Pen, Eraser, Line, Shape-stamp.
- **EraserTool**: The drawing tool that removes individual freehand paths from the current DrawingSession.
- **LineTool**: The drawing tool that adds straight Fabric.js Line objects to the current DrawingSession.
- **ShapeStampTool**: The drawing tool that stamps a selected ShapePreset SVG onto the canvas as a Fabric.js object within the current DrawingSession.
- **TextBox**: The Fabric.js `Textbox` object used to render a TextLayer; its dimensions are independent of the font size.
- **FontComboPreset**: A named pairing of fonts with a visual preview, shown in the Text panel.
- **TextTransform**: One of `"none"`, `"uppercase"`, `"lowercase"`, `"capitalize"` applied to a TextLayer.
- **MobileSheet**: A bottom-sheet overlay used on viewports narrower than 768 px to surface Panel content.
- **GenerationDrawer**: The existing, already-implemented component for AI mockup visualization of people wearing merch. It is **not part of this spec**.
- **AI_Illustration_Generator**: The new AI feature in the Draw panel that generates standalone artwork/illustrations via `/api/ai/generate` with an illustration-focused system prompt.
- **Validator**: The shared Zod validation logic in `@udo-craft/shared`.
- **Supabase**: The backend database and storage service used by both apps.
- **ELEMENT_PRESETS**: A constant in `@udo-craft/shared` defining all shape metadata: `{ id, name, category, svgPath, tags }`.
- **SHAPE_CATEGORIES**: A constant in `@udo-craft/shared` listing all shape category names (e.g., Basic Shapes, Polygons, Stars, Arrows, Speech Bubbles, Clouds, Hearts, Banners, Frames, Decorative).

---

## Requirements

### Requirement 1: Sidebar Navigation

**User Story:** As a user (admin or client), I want a clean icon sidebar with four labelled tabs so that I can switch between tool panels instantly without losing my canvas work.

#### Acceptance Criteria

1. THE Canvas_Editor SHALL render a Sidebar containing exactly four SidebarTabs: Prints, Draw, Text, and Upload.
2. WHEN a SidebarTab is clicked and its Panel is closed, THE Sidebar SHALL open the corresponding Panel alongside the canvas.
3. WHEN a SidebarTab is clicked and its Panel is already open, THE Sidebar SHALL close the Panel, returning to full-canvas view.
4. THE Sidebar SHALL highlight the active SidebarTab with a distinct visual indicator (filled background or accent border) so the user always knows which panel is open.
5. THE Canvas_Editor SHALL preserve all canvas layer state when switching between SidebarTabs or closing a Panel.
6. WHERE the viewport width is less than 768 px, THE Sidebar SHALL render as a horizontal bottom navigation bar with the same four tabs, each with a minimum tap target of 44 × 44 px.
7. WHERE the viewport width is less than 768 px and a SidebarTab is activated, THE Canvas_Editor SHALL open the corresponding Panel as a MobileSheet sliding up from the bottom.
8. THE Sidebar SHALL be present and functional in both the admin and client Canvas_Editor instances.
9. WHEN no Panel is open, THE Canvas_Editor SHALL use the full available width for the canvas.

---

### Requirement 2: Prints Panel

**User Story:** As a user, I want to browse print presets and shapes in one place so that I can quickly add professional designs or decorative elements to my canvas.

#### Acceptance Criteria

**Print Presets section (top)**

1. WHEN the Prints SidebarTab is activated, THE Prints Panel SHALL display a "Print Presets" section at the top, showing a grid of PrintPresets fetched from the Supabase `print_presets` table where `is_active = true`, ordered by `sort_order` ascending.
2. THE Prints Panel SHALL display each PrintPreset as a thumbnail card showing `thumbnail_url`, `name`, and `category`.
3. WHILE the Prints Panel is loading PrintPresets from Supabase, THE Prints Panel SHALL display a skeleton grid of placeholder cards matching the expected card dimensions.
4. IF the Supabase fetch for PrintPresets fails, THEN THE Prints Panel SHALL display an error state with a descriptive message and a "Retry" button, without crashing the Canvas_Editor.
5. THE Prints Panel SHALL include a text search input for PrintPresets; WHEN the search value changes, THE Prints Panel SHALL filter the displayed grid to PrintPresets whose `name` or `tags` contain the search string (case-insensitive).
6. WHEN a PrintPreset thumbnail is clicked, THE Canvas_Editor SHALL add a new image `PrintLayer` to the active canvas side using the preset's `file_url`, centred within the print zone.

**Shapes Library section (bottom)**

7. THE Prints Panel SHALL display a "Shapes" section below the Print Presets section, showing ShapePresets sourced from the static `ELEMENT_PRESETS` constant — no network request required.
8. THE Shapes section SHALL display category filter chips for all categories defined in `SHAPE_CATEGORIES` (Basic Shapes, Polygons, Stars, Arrows, Speech Bubbles, Clouds, Hearts, Banners, Frames, Decorative, and any additional categories); WHEN a chip is selected, THE Shapes section SHALL filter the grid to ShapePresets in that category only.
9. THE Shapes section SHALL include a text search input; WHEN the search value changes, THE Shapes section SHALL filter the grid to ShapePresets whose `name` or `tags` contain the search string (case-insensitive).
10. WHEN a ShapePreset thumbnail is clicked, THE Canvas_Editor SHALL add a new image `PrintLayer` to the active canvas side using the preset's `svgPath`, centred within the print zone.
11. IF a ShapePreset SVG fails to load, THEN THE Canvas_Editor SHALL display an error toast and not add a broken layer.
12. THE `print_presets` Supabase table SHALL have columns: `id` (uuid), `name` (text), `category` (text), `thumbnail_url` (text), `file_url` (text), `tags` (text[]), `sort_order` (int), `is_active` (bool).
13. THE `@udo-craft/shared` package SHALL export a `PrintPresetSchema` Zod schema and inferred `PrintPreset` type matching the `print_presets` table columns.
14. IF the Prints Panel has no PrintPresets and no ShapePresets matching the current search, THEN THE Prints Panel SHALL display a helpful empty state message with a suggestion to clear the search.

---

### Requirement 3: Draw Panel and AI Illustration

**User Story:** As a user, I want to draw freehand on the canvas using multiple drawing tools and optionally use AI to generate or enhance illustrations so that I can create custom artwork directly in the editor.

#### Acceptance Criteria

**Tool selection**

1. WHEN the Draw SidebarTab is activated, THE Draw Panel SHALL display a horizontal tool selector row with icons for four DrawingTools: Pen, Eraser, Line, and Shape-stamp.
2. WHEN a DrawingTool is selected, THE Draw Panel SHALL show only the controls relevant to that tool below the selector row.
3. THE active DrawingTool SHALL be visually highlighted in the tool selector row.
4. WHEN the Draw Panel is closed or a different SidebarTab is activated, THE Canvas_Editor SHALL disable Fabric.js `isDrawingMode` and restore normal layer interaction.
5. WHILE drawing mode is active, THE Canvas_Editor SHALL prevent layer selection and drag interactions on existing layers.

**Pen tool**

6. WHEN the Pen tool is selected, THE Canvas_Editor SHALL enable Fabric.js `isDrawingMode` using `PencilBrush` on the canvas.
7. THE Draw Panel SHALL expose Pen controls: color (color picker with preset swatches), size (slider, range 1–100 px), and opacity (slider, range 0–100%); WHEN any control is changed, THE Canvas_Editor SHALL apply the new value to the active `PencilBrush` immediately without requiring a separate "apply" action.
8. WHEN the user draws on the canvas with the Pen tool, THE Canvas_Editor SHALL render strokes using the configured `PencilBrush` color, size, and opacity in real time.

**Eraser tool**

9. WHEN the Eraser tool is selected, THE Canvas_Editor SHALL disable Fabric.js `isDrawingMode` and enter path-erasure mode.
10. THE Draw Panel SHALL expose an Eraser size control (slider, range 10–200 px).
11. WHEN the user clicks or drags over the canvas with the Eraser tool, THE Canvas_Editor SHALL remove any unsaved freehand paths in the current DrawingSession that the eraser area intersects, at path level (not pixel level).
12. THE EraserTool SHALL only affect unsaved paths in the current DrawingSession; it SHALL NOT modify any saved `PrintLayer` objects on the canvas.

**Line tool**

13. WHEN the Line tool is selected, THE Canvas_Editor SHALL disable Fabric.js `isDrawingMode` and enter line-drawing mode.
14. THE Draw Panel SHALL expose Line controls: color (color picker with preset swatches), stroke width (slider, range 1–50 px), and opacity (slider, range 0–100%).
15. WHEN the user click-drags on the canvas with the Line tool, THE Canvas_Editor SHALL render a straight Fabric.js `Line` object from the drag start point to the drag end point, added to the current DrawingSession.

**Shape-stamp tool**

16. WHEN the Shape-stamp tool is selected, THE Draw Panel SHALL display a mini shape picker showing the same shape categories as the Prints panel's Shapes Library.
17. THE Draw Panel SHALL expose Shape-stamp controls: fill color (color picker), stroke color (color picker), and stroke width (slider, range 0–20 px).
18. WHEN the user clicks on the canvas with the Shape-stamp tool and a shape is selected, THE Canvas_Editor SHALL stamp the selected ShapePreset as a Fabric.js object at the clicked position, added to the current DrawingSession.

**One DrawLayer per side**

19. THE Canvas_Editor SHALL enforce a maximum of one DrawLayer per canvas side at any time.
20. WHEN the user activates the Draw Panel on a side that already has a DrawLayer, THE Canvas_Editor SHALL enter "edit drawing" mode, loading the existing DrawLayer's rasterised PNG back onto the drawing canvas as a background reference so the user can draw additional strokes on top.
21. WHEN the user saves the drawing on a side that already has a DrawLayer, THE Canvas_Editor SHALL replace the existing DrawLayer with a newly rasterised PNG that merges the background reference and all new DrawingSession strokes.
22. IF the active side has no DrawLayer, THE Canvas_Editor SHALL create a new DrawLayer on save.
23. THE layers list SHALL show at most one DrawLayer entry per side; WHEN the user attempts to add a second DrawLayer to the same side, THE Canvas_Editor SHALL silently enter "edit drawing" mode on the existing DrawLayer instead of creating a new entry.

**Undo/Redo and session controls**

24. THE Draw Panel SHALL include Undo and Redo buttons; WHEN Undo is clicked, THE Canvas_Editor SHALL remove the last path, line, or shape-stamp added in the current DrawingSession; WHEN Redo is clicked, THE Canvas_Editor SHALL restore the last undone item.
25. Undo and Redo SHALL operate only within the current DrawingSession and SHALL NOT affect saved layers or cross session boundaries.
26. THE Draw Panel SHALL include a "Save Drawing" button; WHEN clicked, THE Canvas_Editor SHALL rasterise all current DrawingSession objects into a single PNG and save it as the DrawLayer for the active side (creating or replacing per criteria 21–22), then exit drawing mode.
27. THE Draw Panel SHALL include a "Clear" button; WHEN clicked, THE Canvas_Editor SHALL remove all unsaved DrawingSession objects from the canvas without affecting existing saved layers.
28. IF the rasterised drawing PNG is fully transparent (empty DrawingSession), THEN THE Canvas_Editor SHALL display a warning toast and not save an empty DrawLayer.

**AI Illustration Generation**

29. THE Draw Panel SHALL include an "AI Illustration" section with a text prompt input and a "Generate" button; this feature is distinct from the existing `GenerationDrawer` and uses a different system prompt focused on standalone artwork, not people wearing merch.
30. WHEN the "Generate" button is clicked with a non-empty prompt, THE Draw Panel SHALL call `/api/ai/generate` with an illustration-focused system prompt instructing the AI to generate standalone artwork/illustrations suitable for print-on-demand (no people, no merch context).
31. WHILE the AI illustration is being generated, THE Draw Panel SHALL display a loading indicator and disable the "Generate" button to prevent duplicate requests.
32. WHEN the AI illustration generation succeeds, THE Canvas_Editor SHALL add the result as a new image `PrintLayer` on the active canvas side, centred within the print zone.
33. IF the AI illustration generation fails, THEN THE Draw Panel SHALL display a descriptive error message with a "Try Again" option, without crashing the Canvas_Editor.

**AI Enhance Drawing**

34. THE Draw Panel SHALL include an "Enhance Drawing" button that is enabled only WHEN at least one DrawLayer exists on the active canvas side.
35. WHEN the "Enhance Drawing" button is clicked, THE Draw Panel SHALL capture the selected DrawLayer as an image and send it to `/api/ai/generate` with a system prompt instructing the AI to enhance/upscale the sketch into polished illustration artwork.
36. WHEN the AI enhancement succeeds, THE Canvas_Editor SHALL add the enhanced result as a new image `PrintLayer` on the active canvas side, positioned to match the source DrawLayer's transform.
37. IF the AI enhancement fails, THEN THE Draw Panel SHALL display a descriptive error message with a "Try Again" option.
38. THE `PrintLayer` type in `@udo-craft/shared` SHALL support `kind: "drawing"` in addition to the existing `"image"` and `"text"` values.

---

### Requirement 4: Text Panel

**User Story:** As a user, I want rich, real-time text controls so that I can create expressive text layers with precise typography and full control over the text box dimensions without leaving the editor.

#### Acceptance Criteria

**Font combo presets**

1. WHEN the Text SidebarTab is activated, THE Canvas_Editor SHALL open the Text Panel displaying a grid of at least six `FONT_COMBO_PRESETS`, each showing a heading sample and a body sample rendered in their respective fonts.
2. WHEN a FontComboPreset is clicked, THE Canvas_Editor SHALL add two TextLayers to the canvas: one with the heading font and one with the body font, both using default placeholder text, stacked vertically and centred within the print zone.
3. THE Text Panel SHALL include an "Add Text" button; WHEN clicked, THE Canvas_Editor SHALL add a single TextLayer with the default font and placeholder text, centred within the print zone.

**Contextual controls (active TextLayer)**

4. WHEN a TextLayer is selected on the canvas, THE Text Panel SHALL display inline controls for that layer: font family picker with search, font size, text alignment, text color, TextTransform toggles, letter spacing, line height, bold toggle, italic toggle, text box width/height inputs, text overflow toggle, text background color toggle with color picker, and stroke/outline toggle with color picker and width slider.
5. WHEN the font size control is changed to a value between 8 and 200 (inclusive), THE Canvas_Editor SHALL update the selected TextLayer's `textFontSize` and re-render the Fabric.js object in real time without deselecting the layer.
6. WHEN a TextTransform button (uppercase / lowercase / capitalize / none) is clicked, THE Canvas_Editor SHALL apply the corresponding transform to the Fabric.js text object and persist the value in `PrintLayer.textTransform`.
7. WHEN the letter spacing control is changed to a value between -10 and 100 (inclusive), THE Canvas_Editor SHALL update the Fabric.js `charSpacing` property of the selected TextLayer in real time.
8. WHEN the line height control is changed to a value between 0.5 and 3.0 (inclusive), THE Canvas_Editor SHALL update the Fabric.js `lineHeight` property of the selected TextLayer in real time.
9. WHEN the bold toggle is activated, THE Canvas_Editor SHALL apply `fontWeight: "bold"` to the Fabric.js text object and persist `textBold: true` in the `PrintLayer`; WHEN deactivated, THE Canvas_Editor SHALL restore `fontWeight: "normal"`.
10. WHEN the italic toggle is activated, THE Canvas_Editor SHALL apply `fontStyle: "italic"` to the Fabric.js text object and persist `textItalic: true` in the `PrintLayer`; WHEN deactivated, THE Canvas_Editor SHALL restore `fontStyle: "normal"`.
11. THE font family picker SHALL display all fonts from `TEXT_FONTS` with a search input; WHEN the search value changes, THE font picker SHALL filter to fonts whose label contains the search string (case-insensitive).
12. THE color picker SHALL include a full color input and a row of preset swatches; WHEN a color is selected, THE Canvas_Editor SHALL update the selected TextLayer's `textColor` in real time.
13. IF no TextLayer is selected on the canvas, THE Text Panel SHALL display only the FontComboPresets grid and the "Add Text" button, with a contextual hint explaining that selecting a text layer reveals its controls.
14. FOR ALL combinations of font, size, textTransform, letterSpacing, and lineHeight within their documented ranges, THE Validator SHALL accept the resulting `PrintLayer` object without a type error.

**Text box resize (independent of font size)**

15. THE Text Panel SHALL display the current TextBox width and height in pixels as editable number inputs; WHEN either value is changed, THE Canvas_Editor SHALL resize the Fabric.js `Textbox` object to the new dimensions and persist the values as `textBoxWidth` and `textBoxHeight` on the `PrintLayer` without changing `textFontSize`.
16. WHEN the user resizes the TextBox via Fabric.js handles on the canvas, THE Canvas_Editor SHALL update `textBoxWidth` and `textBoxHeight` on the `PrintLayer` without changing `textFontSize`, so that the text reflows within the new container dimensions.
17. THE Canvas_Editor SHALL treat `textBoxWidth` and `textBoxHeight` as the physical print area dimensions of the TextLayer, independent of the rendered font size.

**Text overflow**

18. THE Text Panel SHALL display a text overflow toggle with two options: "clip" and "auto-expand"; WHEN changed, THE Canvas_Editor SHALL update the Fabric.js `Textbox` overflow behaviour accordingly and persist the value as `textOverflow` on the `PrintLayer`.
19. WHILE `textOverflow` is `"clip"`, THE Canvas_Editor SHALL clip text that exceeds the TextBox bounds without resizing the container.
20. WHILE `textOverflow` is `"auto"`, THE Canvas_Editor SHALL expand the TextBox height automatically as text content grows beyond the current container height.

**Text background color**

21. THE Text Panel SHALL display a text background color toggle; WHEN enabled, THE Text Panel SHALL show a color picker; WHEN a color is selected, THE Canvas_Editor SHALL apply a background fill behind the Fabric.js `Textbox` and persist the value as `textBackgroundColor` on the `PrintLayer`.
22. WHEN the text background color toggle is disabled, THE Canvas_Editor SHALL remove the background fill from the Fabric.js `Textbox` and set `textBackgroundColor` to `undefined` on the `PrintLayer`.

**Stroke / outline**

23. THE Text Panel SHALL display a stroke toggle; WHEN enabled, THE Text Panel SHALL show a stroke color picker and a stroke width slider (range 0–20 px); WHEN either value is changed, THE Canvas_Editor SHALL apply the stroke to the Fabric.js `Textbox` and persist the values as `textStrokeColor` and `textStrokeWidth` on the `PrintLayer`.
24. WHEN the stroke toggle is disabled, THE Canvas_Editor SHALL remove the stroke from the Fabric.js `Textbox` and set `textStrokeColor` and `textStrokeWidth` to `undefined` on the `PrintLayer`.

---

### Requirement 5: Upload Panel

**User Story:** As a user, I want a dedicated upload panel so that I can add my own images to the canvas through a clear, accessible interface.

#### Acceptance Criteria

1. WHEN the Upload SidebarTab is activated, THE Canvas_Editor SHALL open the Upload Panel displaying a file upload button and a drag-and-drop zone.
2. THE Upload Panel SHALL accept files of type PNG, JPG/JPEG, SVG, and PDF; WHEN a file of an unsupported type is dropped or selected, THE Upload Panel SHALL display a clear error message listing the accepted formats.
3. THE Upload Panel SHALL display the maximum accepted file size; IF a file exceeding the size limit is selected, THEN THE Upload Panel SHALL display a descriptive error message and not attempt to upload the file.
4. WHEN a valid file is uploaded via the button or drag-and-drop, THE Canvas_Editor SHALL add a new image `PrintLayer` to the active canvas side, centred within the print zone.
5. THE Upload Panel SHALL maintain a session-scoped list of recently uploaded files; WHEN the Upload Panel is opened, THE Upload Panel SHALL display thumbnails of files uploaded during the current session.
6. WHEN a recently uploaded file thumbnail is clicked, THE Canvas_Editor SHALL add that file as a new image `PrintLayer` to the active canvas side.
7. WHILE a file is being uploaded, THE Upload Panel SHALL display a progress indicator and disable the upload controls to prevent duplicate uploads.
8. IF a file upload fails, THEN THE Upload Panel SHALL display a descriptive error message with a "Retry" button.
9. IF the Upload Panel has no recent uploads, THE Upload Panel SHALL display a helpful empty state with instructions for uploading a first file.
10. THE drag-and-drop zone SHALL provide visual feedback (border highlight, background tint) WHILE a file is being dragged over it.

---

### Requirement 6: Mobile Responsiveness

**User Story:** As a mobile user, I want the canvas editor to be fully usable on a phone screen so that I can customise products on the go without a degraded experience.

#### Acceptance Criteria

1. WHERE the viewport width is less than 768 px, THE Canvas_Editor SHALL occupy the full viewport height with the canvas taking the upper portion and the bottom navigation bar fixed at the bottom.
2. WHERE the viewport width is less than 768 px, THE Canvas_Editor SHALL scale the canvas to fit the product image within the visible area above the bottom navigation bar without horizontal scrolling.
3. WHERE the viewport width is less than 768 px and a MobileSheet is open, THE Canvas_Editor SHALL allow the MobileSheet to be dismissed by tapping the backdrop or swiping it downward.
4. WHERE the viewport width is less than 768 px, THE MobileSheet SHALL occupy at most 80% of the viewport height and be independently scrollable internally.
5. WHILE a MobileSheet is open on mobile, THE Canvas_Editor SHALL prevent the background page from scrolling (scroll lock).
6. WHERE the viewport width is at least 768 px, THE Canvas_Editor SHALL render the Sidebar as a vertical column on the left, the Panel (when open) as a fixed-width drawer (280 px) adjacent to the Sidebar, and the canvas filling the remaining space.
7. THE Canvas_Editor SHALL support touch-based layer drag-and-drop reordering in the layers list on both mobile and desktop, using the existing touch drag implementation from `LayersPanel`.
8. WHERE the viewport width is less than 768 px, ALL interactive controls in the Sidebar and Panels SHALL have a minimum tap target size of 44 × 44 px.
9. THE Canvas_Editor SHALL not use hover-only interactions for any primary functionality; all interactions SHALL be accessible via tap or click.

---

### Requirement 7: Canvas Layer Management

**User Story:** As a user, I want layer management to remain accessible at all times so that I can select, reorder, duplicate, and delete layers without switching away from my current tool panel.

#### Acceptance Criteria

1. THE Canvas_Editor SHALL preserve all existing layer management functionality from the current `LayersPanel`: select, delete, duplicate, reorder (drag), print type assignment, and size label assignment.
2. THE layers list SHALL be accessible at all times — either as a persistent mini-panel within the sidebar area or as a collapsible section — so that opening a tool Panel does not hide the layers list entirely.
3. WHEN a layer is selected in the layers list, THE Canvas_Editor SHALL activate that layer on the Fabric.js canvas and, if the layer is a TextLayer, THE Text Panel SHALL display that layer's contextual controls.
4. WHEN a layer is reordered via drag-and-drop in the layers list, THE Canvas_Editor SHALL update the Fabric.js canvas z-order to match the new layer order.
5. WHEN a layer is deleted from the layers list, THE Canvas_Editor SHALL remove the corresponding Fabric.js object from the canvas and deselect it.
6. WHEN a layer is duplicated, THE Canvas_Editor SHALL add a new `PrintLayer` with the same properties as the source, offset slightly on the canvas so the duplicate is visually distinguishable.
7. THE layers list SHALL display a type badge and a thumbnail preview for each layer (image preview for image/drawing layers, text preview for text layers), consistent with the existing `LayersPanel` rendering.
8. IF the active canvas side has no layers, THE layers list SHALL display a helpful empty state prompting the user to add content via one of the tool panels.

---

### Requirement 8: Shared Type and Constant Updates

**User Story:** As a developer, I want all new canvas types and constants to live in `@udo-craft/shared` so that both apps stay in sync without duplication.

#### Acceptance Criteria

1. THE `PrintLayer` type in `@udo-craft/shared` SHALL be updated to include: `kind: "image" | "text" | "drawing"`, `textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"`, `textLetterSpacing?: number`, `textLineHeight?: number`, `textBold?: boolean`, `textItalic?: boolean`, `textOverflow?: "clip" | "auto"`, `textBackgroundColor?: string`, `textStrokeColor?: string`, `textStrokeWidth?: number`, `textBoxWidth?: number`, `textBoxHeight?: number`.
2. THE `@udo-craft/shared` package SHALL export a `ELEMENT_PRESETS` constant: a readonly array of objects with shape `{ id: string; name: string; category: string; svgPath: string; tags: string[] }`, covering all bundled SVG shapes in `/public/shapes/`.
3. THE `@udo-craft/shared` package SHALL export a `SHAPE_CATEGORIES` constant: a readonly array of category name strings including at minimum: `"Basic Shapes"`, `"Polygons"`, `"Stars"`, `"Arrows"`, `"Speech Bubbles"`, `"Clouds"`, `"Hearts"`, `"Banners"`, `"Frames"`, `"Decorative"`.
4. THE `@udo-craft/shared` package SHALL export a `FONT_COMBO_PRESETS` constant: a readonly array of objects with shape `{ id: string; name: string; headingFont: TextFontId; bodyFont: TextFontId }`, containing at least six entries.
5. THE `@udo-craft/shared` package SHALL export a `PrintPresetSchema` Zod schema and inferred `PrintPreset` type matching the `print_presets` Supabase table columns: `id`, `name`, `category`, `thumbnail_url`, `file_url`, `tags`, `sort_order`, `is_active`.
6. WHEN `@udo-craft/shared` is rebuilt after these changes, THE TypeScript compiler SHALL report zero type errors across both `apps/admin` and `apps/client`.
7. FOR ALL valid `PrintLayer` objects (any combination of existing and new optional fields), THE `PrintLayer` type SHALL accept the object without a TypeScript error.
8. FOR ALL `PrintLayer` objects where `kind === "text"`, the existing fields `textContent`, `textFont`, `textColor`, `textFontSize`, `textAlign`, and `textCurve` SHALL remain optional and backward-compatible with existing persisted data.
9. FOR ALL `PrintLayer` objects where `kind` is absent (legacy data), THE `PrintLayer` type SHALL treat the layer as `kind === "image"` without a runtime error.

---

### Requirement 9: Git Branch and PR Workflow

**User Story:** As a developer, I want a clear branch and PR strategy so that the feature is reviewed on staging before reaching production.

#### Acceptance Criteria

1. THE Canvas_Editor_v2 feature SHALL be developed on a branch named `feature/canvas-editor-v2` created from `develop`.
2. WHEN development is complete, THE developer SHALL create a PR from `feature/canvas-editor-v2` to `develop` using `gh pr create --base develop`.
3. WHEN the `develop` PR is merged and staging is verified, THE developer SHALL create a PR from `develop` to `main` using `gh pr create --base main`.
4. THE CI workflow (`.github/workflows/ci.yml`) SHALL pass type-check and lint on both PRs before merging.
5. THE developer SHALL never push directly to `main`.
