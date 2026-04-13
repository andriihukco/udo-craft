# Design Document: Canvas Editor v2

## Overview

Canvas Editor v2 replaces the flat `LeftPanel` / `CustomizerLeftPanel` in both `apps/admin` and `apps/client` with a professional four-tab sidebar experience. The redesign introduces four contextual tool panels (Prints, Draw, Text, Upload), richer text controls, a static shapes library, freehand drawing with AI illustration generation, and a fully responsive mobile layout — all without breaking the existing canvas, layer management, or `GenerationDrawer` functionality.

The existing `GenerationDrawer` (AI mockup visualization of people wearing merch) is **not modified** by this spec. The new AI Illustration feature in the Draw panel is a separate capability with a different system prompt and purpose.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Canvas_Editor (admin/Customizer.tsx  OR  client/Customizer.tsx)        │
│                                                                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  ┌────────┐  │
│  │ EditorSidebar│  │  Active Panel    │  │ ProductCanvas│  │ Right  │  │
│  │  (56px)      │  │  (280px, slide)  │  │  (flex-1)    │  │ Panel  │  │
│  │              │  │                  │  │              │  │ (280px)│  │
│  │  [Prints]    │  │  PrintsPanel     │  │  Fabric.js   │  │        │  │
│  │  [Draw  ]    │  │  DrawPanel       │  │  canvas      │  │ Qty /  │  │
│  │  [Text  ]    │  │  TextPanel       │  │              │  │ Price  │  │
│  │  [Upload]    │  │  UploadPanel     │  │              │  │        │  │
│  │              │  │                  │  │              │  │        │  │
│  │  ─────────   │  │  ─────────────   │  │              │  │        │  │
│  │  [Layers]    │  │  LayersList      │  │              │  │        │  │
│  └──────────────┘  └──────────────────┘  └──────────────┘  └────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**1. Panel components stay per-app, not in `@udo-craft/shared`**

`EditorSidebar`, `PrintsPanel`, `DrawPanel`, `TextPanel`, `UploadPanel`, and `LayersList` live in each app's component tree (`apps/admin/src/...` and `apps/client/src/...`). They depend on app-specific routing, Framer Motion, and Supabase clients. Shared types and constants (extended `PrintLayer`, `ELEMENT_PRESETS`, `FONT_COMBO_PRESETS`, `PrintPresetSchema`) live in `@udo-craft/shared` as always.

**2. State extension, not replacement**

`useCustomizerState` (client) and the admin `Customizer.tsx` inline state are extended with `activeTab: SidebarTabId | null` and `drawingSession: DrawingSessionState`. No existing state fields are removed. The `onTextChange` handler signature is widened to accept all new text fields.

**3. `useDrawingSession` hook owns all drawing state**

Drawing mode, tool selection, undo/redo stack, and session objects are encapsulated in a dedicated `useDrawingSession` hook. This hook receives a `fabricCanvasRef` and manages Fabric.js drawing mode transitions directly, keeping the parent Customizer clean.

**4. `useAIIllustration` hook is separate from `useAIGeneration`**

The existing `useAIGeneration` hook (used by `GenerationDrawer`) is not modified. A new `useAIIllustration` hook handles illustration generation and drawing enhancement, posting to the same `/api/ai/generate` route with a different `systemPrompt` field.

**5. `LayersList` is extracted from `LayersPanel`**

The existing `LayersPanel` component is refactored: the layer list rendering logic is extracted into a standalone `LayersList` component with the same props. `LayersPanel` becomes a thin wrapper. This allows `LayersList` to be embedded inside the sidebar area without duplicating code.

### Integration Points

```
apps/admin/Customizer.tsx
  ├── EditorSidebar          (new — replaces LeftPanel)
  │     ├── PrintsPanel
  │     ├── DrawPanel
  │     │     └── useDrawingSession (new hook)
  │     │     └── useAIIllustration (new hook)
  │     ├── TextPanel
  │     ├── UploadPanel
  │     └── LayersList        (extracted from LayersPanel)
  ├── ProductCanvas           (unchanged)
  ├── QtyPricePanel           (unchanged)
  └── GenerationDrawer        (unchanged — DO NOT MODIFY)

apps/client/Customizer.tsx
  ├── EditorSidebar          (new — replaces CustomizerLeftPanel)
  │     └── (same panel tree as admin)
  ├── CustomizerCanvas        (unchanged)
  ├── QtyPriceContent         (unchanged)
  └── GenerationDrawer        (unchanged — DO NOT MODIFY)
```

---

## Components and Interfaces

### `EditorSidebar`

Vertical icon navigation bar (desktop) or horizontal bottom nav (mobile). Renders four tab buttons and delegates panel rendering to the parent via `onTabChange`.

```ts
type SidebarTabId = "prints" | "draw" | "text" | "upload";

interface EditorSidebarProps {
  activeTab: SidebarTabId | null;
  onTabChange: (tab: SidebarTabId | null) => void;
  // Passed through to LayersList rendered below the tab icons
  layers: PrintLayer[];
  activeSide: string;
  activeLayerId: string | null;
  onLayerSelect: (id: string | null) => void;
  onLayerDelete: (id: string) => void;
  onLayerDuplicate: (id: string) => void;
  onLayerReorder: (layers: PrintLayer[]) => void;
  onLayerTypeChange: (id: string, type: PrintTypeId) => void;
  onLayerSizeLabelChange: (id: string, sizeLabel: string) => void;
  printPricing: PrintTypePricingRow[];
  quantity: number;
  layerScales: Record<string, number>;
  pxToMmRatio: number;
}
```

Clicking an active tab calls `onTabChange(null)` (toggle closed). Clicking an inactive tab calls `onTabChange(tabId)`. Satisfies Requirements 1.1–1.5, 1.8–1.9.

---

### `PrintsPanel`

```ts
interface PrintsPanelProps {
  activeSide: string;
  printPricing: PrintTypePricingRow[];
  onAddLayer: (file: File) => void;
}
```

Internally fetches `print_presets` from Supabase on mount. Manages its own `search`, `categoryFilter`, `loading`, `error` state. Satisfies Requirements 2.1–2.14.

**Supabase query:**
```ts
supabase
  .from("print_presets")
  .select("*")
  .eq("is_active", true)
  .order("sort_order", { ascending: true })
```

When a preset is clicked, fetches the `file_url` as a `Blob`, wraps it in a `File`, and calls `onAddLayer(file)`.

---

### `DrawPanel`

```ts
interface DrawPanelProps {
  fabricCanvasRef: React.RefObject<fabric.Canvas | null>;
  layers: PrintLayer[];
  activeSide: string;
  activeLayerId: string | null;
  onAddLayer: (file: File) => void;
  onReplaceDrawLayer: (id: string, file: File) => void;
  setLayersWithRef: (updater: PrintLayer[] | ((prev: PrintLayer[]) => PrintLayer[])) => void;
}
```

Internally uses `useDrawingSession` and `useAIIllustration`. Satisfies Requirements 3.1–3.38.

---

### `TextPanel`

```ts
// Extended patch type covering all new text fields
type TextLayerPatch = Partial<Pick<PrintLayer,
  | "textContent" | "textFont" | "textColor" | "textFontSize" | "textAlign" | "textCurve"
  | "textTransform" | "textLetterSpacing" | "textLineHeight"
  | "textBold" | "textItalic" | "textOverflow"
  | "textBackgroundColor" | "textStrokeColor" | "textStrokeWidth"
  | "textBoxWidth" | "textBoxHeight"
>>;

interface TextPanelProps {
  layers: PrintLayer[];
  activeLayerId: string | null;
  activeSide: string;
  onAddTextLayer: () => void;
  onAddFontCombo: (headingFont: TextFontId, bodyFont: TextFontId) => void;
  onTextChange: (id: string, patch: TextLayerPatch) => void;
}
```

When no TextLayer is selected, shows `FONT_COMBO_PRESETS` grid + "Add Text" button. When a TextLayer is selected, shows full contextual controls. Satisfies Requirements 4.1–4.24.

---

### `UploadPanel`

```ts
interface UploadPanelProps {
  activeSide: string;
  onFileAdd: (file: File) => void;
}
```

Manages its own `recentFiles: File[]` (session-scoped, stored in component state). Handles drag-and-drop via `onDragOver` / `onDrop` events. Satisfies Requirements 5.1–5.10.

Accepted MIME types: `image/png`, `image/jpeg`, `image/svg+xml`, `application/pdf`.
Max file size: 20 MB (displayed in the UI).

---

### `LayersList`

Extracted from the existing `LayersPanel`. Renders the list of layers for the active side with drag-and-drop reorder, type badge, thumbnail, delete, and duplicate. The `LayersPanel` component becomes a thin wrapper that adds the "Add Image" / "Add Text" quick-add buttons above `LayersList`.

```ts
// Same props as current LayersPanel minus onAddClick/onAddText/fileInputRef/onFileChange
interface LayersListProps {
  layers: PrintLayer[];
  activeSide: string;
  activeLayerId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onTypeChange: (id: string, type: PrintTypeId) => void;
  onSizeLabelChange?: (id: string, sizeLabel: string) => void;
  onReorder: (layers: PrintLayer[]) => void;
  onTextChange?: (id: string, patch: TextLayerPatch) => void;
  pricing?: PrintTypePricingRow[];
  quantity?: number;
  layerScales?: Record<string, number>;
  pxToMmRatio?: number;
  disabled?: boolean;
}
```

Satisfies Requirements 7.1–7.8.

---

### `useDrawingSession` Hook

```ts
interface PenConfig {
  color: string;       // hex, default "#000000"
  size: number;        // 1–100, default 8
  opacity: number;     // 0–100, default 100
}

interface EraserConfig {
  size: number;        // 10–200, default 30
}

interface LineConfig {
  color: string;       // hex, default "#000000"
  strokeWidth: number; // 1–50, default 3
  opacity: number;     // 0–100, default 100
}

interface ShapeStampConfig {
  shapeId: string | null;
  fillColor: string;   // hex, default "#000000"
  strokeColor: string; // hex, default "transparent"
  strokeWidth: number; // 0–20, default 0
}

interface DrawingSessionState {
  activeTool: "pen" | "eraser" | "line" | "shape-stamp";
  penConfig: PenConfig;
  eraserConfig: EraserConfig;
  lineConfig: LineConfig;
  shapeStampConfig: ShapeStampConfig;
  sessionObjects: fabric.Object[];   // unsaved paths/lines/stamps
  undoStack: fabric.Object[][];      // snapshots of sessionObjects
  redoStack: fabric.Object[][];
  isDrawingMode: boolean;
}

interface UseDrawingSessionReturn {
  // State
  session: DrawingSessionState;
  // Tool controls
  setActiveTool: (tool: DrawingSessionState["activeTool"]) => void;
  setPenConfig: (patch: Partial<PenConfig>) => void;
  setEraserConfig: (patch: Partial<EraserConfig>) => void;
  setLineConfig: (patch: Partial<LineConfig>) => void;
  setShapeStampConfig: (patch: Partial<ShapeStampConfig>) => void;
  // Session lifecycle
  startSession: (existingDrawLayerUrl?: string) => Promise<void>;
  saveSession: () => Promise<File | null>;  // rasterises → File (PNG)
  clearSession: () => void;
  // Undo/redo
  undo: () => void;
  redo: () => void;
}

function useDrawingSession(
  fabricCanvasRef: React.RefObject<fabric.Canvas | null>,
  printZoneBounds: { left: number; top: number; width: number; height: number }
): UseDrawingSessionReturn
```

Satisfies Requirements 3.1–3.28.

---

### `useAIIllustration` Hook

```ts
interface UseAIIllustrationReturn {
  generate: (prompt: string) => Promise<string | null>;  // returns dataUrl or null
  enhance: (drawLayerDataUrl: string) => Promise<string | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

function useAIIllustration(): UseAIIllustrationReturn
```

Both `generate` and `enhance` POST to `/api/ai/generate` with the `ILLUSTRATION_SYSTEM_PROMPT` (for generate) or `ENHANCE_SYSTEM_PROMPT` (for enhance) passed as `systemPrompt` in the request body. Satisfies Requirements 3.29–3.37.

---

## Data Models

### Extended `PrintLayer` (in `@udo-craft/shared`)

```ts
export interface PrintLayer {
  id: string;
  file: File;
  url: string;
  uploadedUrl?: string;
  type: PrintTypeId;
  side: string;
  sizeLabel?: string;
  sizeMinCm?: number;
  sizeMaxCm?: number;
  priceCents?: number;
  transform?: {
    left: number; top: number;
    scaleX: number; scaleY: number;
    angle: number; flipX: boolean;
  };

  // ── Kind (extended: now includes "drawing") ──────────────────────────
  kind?: "image" | "text" | "drawing";  // absent = treated as "image" (legacy compat)

  // ── Existing text fields (unchanged) ─────────────────────────────────
  textContent?: string;
  textFont?: TextFontId;
  textColor?: string;
  textFontSize?: number;
  textAlign?: "left" | "center" | "right";
  textCurve?: number;

  // ── New text fields ───────────────────────────────────────────────────
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textLetterSpacing?: number;   // maps to Fabric.js charSpacing; range -10 to 100
  textLineHeight?: number;      // maps to Fabric.js lineHeight; range 0.5 to 3.0
  textBold?: boolean;           // maps to Fabric.js fontWeight: "bold" | "normal"
  textItalic?: boolean;         // maps to Fabric.js fontStyle: "italic" | "normal"
  textOverflow?: "clip" | "auto";
  textBackgroundColor?: string; // maps to Fabric.js backgroundColor on Textbox
  textStrokeColor?: string;     // maps to Fabric.js stroke on Textbox
  textStrokeWidth?: number;     // maps to Fabric.js strokeWidth; range 0–20
  textBoxWidth?: number;        // maps to Fabric.js Textbox width (px)
  textBoxHeight?: number;       // maps to Fabric.js Textbox height (px)
}
```

Satisfies Requirements 8.1, 8.7–8.9.

---

### New Shared Constants

#### `ELEMENT_PRESETS`

```ts
export const ELEMENT_PRESETS = [
  // Basic Shapes
  { id: "rect-01",     name: "Rectangle",      category: "Basic Shapes",   svgPath: "/shapes/basic/rect.svg",          tags: ["rectangle", "box", "square"] },
  { id: "circle-01",   name: "Circle",          category: "Basic Shapes",   svgPath: "/shapes/basic/circle.svg",        tags: ["circle", "round", "ellipse"] },
  { id: "triangle-01", name: "Triangle",        category: "Basic Shapes",   svgPath: "/shapes/basic/triangle.svg",      tags: ["triangle", "arrow"] },
  // Polygons
  { id: "hex-01",      name: "Hexagon",         category: "Polygons",       svgPath: "/shapes/polygons/hexagon.svg",    tags: ["hexagon", "hex", "polygon"] },
  { id: "pent-01",     name: "Pentagon",        category: "Polygons",       svgPath: "/shapes/polygons/pentagon.svg",   tags: ["pentagon", "polygon"] },
  { id: "oct-01",      name: "Octagon",         category: "Polygons",       svgPath: "/shapes/polygons/octagon.svg",    tags: ["octagon", "polygon", "stop"] },
  // Stars
  { id: "star4-01",    name: "4-Point Star",    category: "Stars",          svgPath: "/shapes/stars/star4.svg",         tags: ["star", "sparkle"] },
  { id: "star5-01",    name: "5-Point Star",    category: "Stars",          svgPath: "/shapes/stars/star5.svg",         tags: ["star", "favorite"] },
  { id: "star6-01",    name: "6-Point Star",    category: "Stars",          svgPath: "/shapes/stars/star6.svg",         tags: ["star", "david"] },
  // Arrows
  { id: "arrow-r-01",  name: "Arrow Right",     category: "Arrows",         svgPath: "/shapes/arrows/arrow-right.svg",  tags: ["arrow", "direction", "right"] },
  { id: "arrow-l-01",  name: "Arrow Left",      category: "Arrows",         svgPath: "/shapes/arrows/arrow-left.svg",   tags: ["arrow", "direction", "left"] },
  { id: "arrow-dbl-01","name": "Double Arrow",  category: "Arrows",         svgPath: "/shapes/arrows/arrow-double.svg", tags: ["arrow", "double", "both"] },
  // Speech Bubbles
  { id: "bubble-01",   name: "Speech Bubble",   category: "Speech Bubbles", svgPath: "/shapes/bubbles/bubble.svg",      tags: ["speech", "bubble", "chat", "talk"] },
  { id: "bubble-02",   name: "Thought Bubble",  category: "Speech Bubbles", svgPath: "/shapes/bubbles/thought.svg",     tags: ["thought", "bubble", "cloud"] },
  // Clouds
  { id: "cloud-01",    name: "Cloud",           category: "Clouds",         svgPath: "/shapes/clouds/cloud.svg",        tags: ["cloud", "sky", "weather"] },
  { id: "cloud-02",    name: "Storm Cloud",     category: "Clouds",         svgPath: "/shapes/clouds/storm.svg",        tags: ["cloud", "storm", "rain"] },
  // Hearts
  { id: "heart-01",    name: "Heart",           category: "Hearts",         svgPath: "/shapes/hearts/heart.svg",        tags: ["heart", "love", "valentine"] },
  { id: "heart-02",    name: "Heart Outline",   category: "Hearts",         svgPath: "/shapes/hearts/heart-outline.svg",tags: ["heart", "love", "outline"] },
  // Banners
  { id: "banner-01",   name: "Ribbon Banner",   category: "Banners",        svgPath: "/shapes/banners/ribbon.svg",      tags: ["banner", "ribbon", "label"] },
  { id: "banner-02",   name: "Scroll Banner",   category: "Banners",        svgPath: "/shapes/banners/scroll.svg",      tags: ["banner", "scroll", "vintage"] },
  // Frames
  { id: "frame-01",    name: "Square Frame",    category: "Frames",         svgPath: "/shapes/frames/square.svg",       tags: ["frame", "border", "square"] },
  { id: "frame-02",    name: "Oval Frame",      category: "Frames",         svgPath: "/shapes/frames/oval.svg",         tags: ["frame", "oval", "border"] },
  // Decorative
  { id: "deco-01",     name: "Sunflower",       category: "Decorative",     svgPath: "/shapes/decorative/sunflower.svg",tags: ["sunflower", "flower", "ukraine"] },
  { id: "deco-02",     name: "Vyshyvanka",      category: "Decorative",     svgPath: "/shapes/decorative/vyshyvanka.svg",tags: ["vyshyvanka", "ukraine", "pattern", "embroidery"] },
] as const satisfies ReadonlyArray<{ id: string; name: string; category: string; svgPath: string; tags: string[] }>;

export type ElementPreset = typeof ELEMENT_PRESETS[number];
```

Satisfies Requirements 8.2.

#### `SHAPE_CATEGORIES`

```ts
export const SHAPE_CATEGORIES = [
  "Basic Shapes",
  "Polygons",
  "Stars",
  "Arrows",
  "Speech Bubbles",
  "Clouds",
  "Hearts",
  "Banners",
  "Frames",
  "Decorative",
] as const;

export type ShapeCategory = typeof SHAPE_CATEGORIES[number];
```

Satisfies Requirements 8.3.

#### `FONT_COMBO_PRESETS`

```ts
export const FONT_COMBO_PRESETS = [
  { id: "classic",    name: "Classic",    headingFont: "Playfair Display",   bodyFont: "PT Sans"            },
  { id: "modern",     name: "Modern",     headingFont: "Montserrat",         bodyFont: "Jost"               },
  { id: "editorial",  name: "Editorial",  headingFont: "Cormorant Garamond", bodyFont: "Raleway"            },
  { id: "bold",       name: "Bold",       headingFont: "Unbounded",          bodyFont: "Exo 2"              },
  { id: "elegant",    name: "Elegant",    headingFont: "Philosopher",        bodyFont: "Merriweather"       },
  { id: "playful",    name: "Playful",    headingFont: "Lobster",            bodyFont: "Comfortaa"          },
  { id: "condensed",  name: "Condensed",  headingFont: "Oswald",             bodyFont: "Nunito"             },
] as const satisfies ReadonlyArray<{ id: string; name: string; headingFont: TextFontId; bodyFont: TextFontId }>;

export type FontComboPreset = typeof FONT_COMBO_PRESETS[number];
```

Satisfies Requirements 8.4.

#### `PrintPresetSchema`

```ts
export const PrintPresetSchema = z.object({
  id:            z.string().uuid(),
  name:          z.string(),
  category:      z.string(),
  thumbnail_url: z.string().url(),
  file_url:      z.string().url(),
  tags:          z.array(z.string()).default([]),
  sort_order:    z.number().int().default(0),
  is_active:     z.boolean().default(true),
});

export type PrintPreset = z.infer<typeof PrintPresetSchema>;
```

Satisfies Requirements 2.12–2.13, 8.5.

#### `DrawingSessionState`

```ts
interface DrawingSessionState {
  activeTool: "pen" | "eraser" | "line" | "shape-stamp";
  penConfig: { color: string; size: number; opacity: number };
  eraserConfig: { size: number };
  lineConfig: { color: string; strokeWidth: number; opacity: number };
  shapeStampConfig: {
    shapeId: string | null;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
  sessionObjects: fabric.Object[];  // unsaved paths/lines/stamps in current session
  undoStack: fabric.Object[][];     // array of sessionObjects snapshots
  redoStack: fabric.Object[][];
  isDrawingMode: boolean;
}
```

---

## Layout Architecture

### Desktop Layout (viewport ≥ 768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  56px  │  280px (when open)  │       flex-1        │         280px           │
│        │                     │                     │                         │
│  Side  │  Active Panel       │   ProductCanvas     │   QtyPricePanel         │
│  bar   │  (Framer Motion     │   (Fabric.js)       │   (unchanged)           │
│        │   x: -280 → 0)      │                     │                         │
│ [Prnt] │                     │                     │                         │
│ [Draw] │  PrintsPanel   OR   │                     │                         │
│ [Text] │  DrawPanel     OR   │                     │                         │
│ [Upld] │  TextPanel     OR   │                     │                         │
│ ─────  │  UploadPanel        │                     │                         │
│ Layers │                     │                     │                         │
│  List  │  LayersList         │                     │                         │
│        │  (always visible    │                     │                         │
│        │   in panel area)    │                     │                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**CSS grid:**
```css
/* When panel is open */
grid-template-columns: 56px 280px 1fr 280px;

/* When panel is closed */
grid-template-columns: 56px 0px 1fr 280px;
/* Panel uses overflow:hidden + Framer Motion width animation */
```

The `EditorSidebar` is `56px` wide with vertical icon buttons. Each button has a 44×44px touch target. The active tab gets `bg-primary/10 text-primary` styling with a left accent border.

The panel slides in with Framer Motion:
```ts
// Panel animation
<motion.div
  initial={{ width: 0, opacity: 0 }}
  animate={{ width: activeTab ? 280 : 0, opacity: activeTab ? 1 : 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
  className="overflow-hidden border-r border-border bg-card"
>
```

The `LayersList` is rendered in the lower portion of the sidebar column (below the tab icons), always visible regardless of which panel is open. On desktop it scrolls independently within the sidebar.

Satisfies Requirements 1.1–1.9, 6.6.

---

### Mobile Layout (viewport < 768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                    ProductCanvas                                             │
│                    (full width, scales to fit above nav bar)                 │
│                                                                              │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  [Prints]    [Draw]    [Text]    [Upload]    (56px height, bottom nav)       │
└──────────────────────────────────────────────────────────────────────────────┘

When a tab is activated:
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Canvas (shrinks to fit above sheet)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  ▬▬▬  (drag handle)                                                    │  │
│  │  Panel Title                                              [×]           │  │
│  │  ─────────────────────────────────────────────────────────────────     │  │
│  │  Panel content (scrollable, max-height: 80vh)                          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  [Prints]    [Draw]    [Text]    [Upload]                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**MobileSheet implementation:**
- `position: fixed; bottom: 56px; left: 0; right: 0` (sits above the bottom nav)
- `max-height: 80vh; overflow-y: auto`
- Backdrop: `fixed inset-0 bg-black/40 z-[9999]` — tap to dismiss
- Swipe-down to dismiss via `onTouchStart` / `onTouchMove` / `onTouchEnd` tracking `deltaY`
- `document.body.style.overflow = "hidden"` while open (scroll lock)
- Framer Motion: `y: "100%" → 0` slide-up animation

Satisfies Requirements 1.6–1.7, 6.1–6.9.

---

## Drawing Session Architecture

### One DrawLayer Per Side Constraint

The constraint is enforced at two levels:

1. **On session start** (`startSession`): `useDrawingSession` checks `layers.filter(l => l.side === activeSide && l.kind === "drawing")`. If a DrawLayer exists, its `url` is loaded as a `fabric.Image` background reference (non-interactive, `selectable: false`, `evented: false`, z-index 0 below all session objects).

2. **On save** (`saveSession`): The hook calls `canvas.toDataURL({ format: "png", ...printZoneBounds })` to rasterise all session objects plus the background reference into a single PNG. If a DrawLayer already exists for the side, `onReplaceDrawLayer(existingId, newFile)` is called instead of `onAddLayer(newFile)`.

```
DrawLayer lifecycle:
─────────────────────────────────────────────────────────────────────────────
  User opens Draw panel on side "front"
        │
        ▼
  Does layers contain a DrawLayer for "front"?
        │
   YES  │  NO
        │   └──► startSession() — blank canvas, no background
        │
        └──► startSession(existingDrawLayer.url)
               │
               ▼
             Load existing PNG as fabric.Image (background ref, z=0)
               │
               ▼
             User draws new strokes (sessionObjects, z=1+)
               │
               ▼
             saveSession()
               │
               ▼
             canvas.toDataURL(printZoneBounds) → PNG
               │
               ▼
             onReplaceDrawLayer(existingId, newFile)
               │
               ▼
             setLayersWithRef: replace existing DrawLayer entry
─────────────────────────────────────────────────────────────────────────────
```

Satisfies Requirements 3.19–3.23.

### Undo/Redo Stack

The undo/redo stack stores **snapshots of `sessionObjects`** (arrays of Fabric.js object references). Each mutating operation (add stroke, add line, stamp shape) pushes the previous `sessionObjects` array onto `undoStack` and clears `redoStack`.

```ts
// On add:
undoStack.push([...sessionObjects]);
redoStack = [];
sessionObjects.push(newObject);
canvas.add(newObject);

// On undo:
if (undoStack.length === 0) return;
redoStack.push([...sessionObjects]);
const prev = undoStack.pop()!;
// Remove objects not in prev
sessionObjects.forEach(obj => { if (!prev.includes(obj)) canvas.remove(obj); });
sessionObjects = prev;

// On redo:
if (redoStack.length === 0) return;
undoStack.push([...sessionObjects]);
const next = redoStack.pop()!;
next.forEach(obj => { if (!sessionObjects.includes(obj)) canvas.add(obj); });
sessionObjects = next;
```

Satisfies Requirements 3.24–3.25.

### Eraser Tool

The eraser does **path-level erasure** (not pixel-level). On `mousedown` and `mousemove`:

```ts
const eraserCircle = new fabric.Circle({ radius: eraserConfig.size / 2, ... });
const eraserBounds = eraserCircle.getBoundingRect();

sessionObjects.forEach(obj => {
  const objBounds = obj.getBoundingRect();
  if (rectsIntersect(eraserBounds, objBounds)) {
    canvas.remove(obj);
    // push undo snapshot before first removal in this drag gesture
  }
});
sessionObjects = sessionObjects.filter(obj => canvas.contains(obj));
```

The eraser only affects `sessionObjects` — it cannot remove saved `PrintLayer` objects. Satisfies Requirements 3.9–3.12.

### Drawing Tools — Fabric.js API Mapping

| Tool | Fabric.js API | Notes |
|---|---|---|
| Pen | `canvas.isDrawingMode = true`; `canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)` | `brush.color`, `brush.width`, `brush.opacity` set from `penConfig` |
| Eraser | `canvas.isDrawingMode = false`; custom mousedown/mousemove handlers | Path-level removal from `sessionObjects` |
| Line | `canvas.isDrawingMode = false`; mousedown records start point; mousemove updates a preview `fabric.Line`; mouseup finalises | `new fabric.Line([x1,y1,x2,y2], { stroke, strokeWidth, opacity })` |
| Shape-stamp | `canvas.isDrawingMode = false`; click handler | `fabric.loadSVGFromURL(svgPath, (objects, options) => { const group = fabric.util.groupSVGElements(objects, options); group.set({ fill, stroke, strokeWidth, left: clickX, top: clickY }); canvas.add(group); })` |

### Save Rasterisation

```ts
async function saveSession(): Promise<File | null> {
  if (sessionObjects.length === 0 && !backgroundRef) return null;

  const dataUrl = canvas.toDataURL({
    format: "png",
    left: printZoneBounds.left,
    top: printZoneBounds.top,
    width: printZoneBounds.width,
    height: printZoneBounds.height,
    multiplier: 2,  // 2× for print quality
  });

  // Check if fully transparent
  const isBlank = await isDataUrlBlank(dataUrl);
  if (isBlank) return null;  // caller shows warning toast

  return dataUrlToFile(dataUrl, `drawing-${Date.now()}.png`, "image/png");
}
```

Satisfies Requirements 3.26–3.28.

---

## Text Layer Architecture

### `fabric.Textbox` vs `fabric.IText`

The implementation uses `fabric.Textbox` (not `fabric.IText`) because:
- `Textbox` supports a fixed `width` constraint with automatic text reflow
- `Textbox` supports multi-line text with word-wrap within the container
- `IText` does not constrain width — it expands horizontally with content

### Fabric.js Property Mapping

| `PrintLayer` field | Fabric.js `Textbox` property | Notes |
|---|---|---|
| `textContent` | `text` | After applying `textTransform` |
| `textFont` | `fontFamily` | Google Font name string |
| `textFontSize` | `fontSize` | Independent of `width`/`height` |
| `textColor` | `fill` | |
| `textAlign` | `textAlign` | `"left"` \| `"center"` \| `"right"` |
| `textCurve` | Custom SVG path rendering | Existing implementation unchanged |
| `textTransform` | Applied to `text` string | Original stored in `textContent` |
| `textLetterSpacing` | `charSpacing` | Fabric.js unit: 1/1000 em; multiply by 10 |
| `textLineHeight` | `lineHeight` | Direct mapping |
| `textBold` | `fontWeight: "bold"` \| `"normal"` | |
| `textItalic` | `fontStyle: "italic"` \| `"normal"` | |
| `textOverflow: "clip"` | `clipPath` on Textbox | Clip to `textBoxWidth × textBoxHeight` |
| `textOverflow: "auto"` | Default Textbox behaviour | Height expands with content |
| `textBackgroundColor` | `backgroundColor` | |
| `textStrokeColor` | `stroke` | |
| `textStrokeWidth` | `strokeWidth` | |
| `textBoxWidth` | `width` | Physical container width in px |
| `textBoxHeight` | `height` | Physical container height in px |

### TextTransform Implementation

`textTransform` is applied as a pure string transformation before setting `textbox.text`. The original content is always stored in `PrintLayer.textContent` (untransformed). The Fabric.js object's `text` property holds the display value.

```ts
function applyTextTransform(content: string, transform: PrintLayer["textTransform"]): string {
  switch (transform) {
    case "uppercase":   return content.toUpperCase();
    case "lowercase":   return content.toLowerCase();
    case "capitalize":  return content.replace(/\b\w/g, c => c.toUpperCase());
    default:            return content;  // "none" or undefined
  }
}

// When updating the Fabric.js object:
textbox.set("text", applyTextTransform(layer.textContent ?? "", layer.textTransform));
```

### TextBox Resize Independence

`textBoxWidth` and `textBoxHeight` map to `textbox.width` and `textbox.height`. Changing these values does **not** change `textbox.fontSize`. The Fabric.js `Textbox` handles reflow automatically when `width` changes.

When the user resizes the Textbox via Fabric.js canvas handles (`object:scaling` event), the handler updates `textBoxWidth` and `textBoxHeight` on the `PrintLayer` without touching `textFontSize`:

```ts
canvas.on("object:scaling", (e) => {
  const obj = e.target;
  if (obj?.type !== "textbox") return;
  const layer = layers.find(l => l.id === obj.data?.layerId);
  if (!layer) return;
  onTextChange(layer.id, {
    textBoxWidth: Math.round(obj.width! * obj.scaleX!),
    textBoxHeight: Math.round(obj.height! * obj.scaleY!),
    // textFontSize intentionally NOT updated here
  });
  // Reset scale to 1 after applying to width/height
  obj.set({ scaleX: 1, scaleY: 1, width: obj.width! * obj.scaleX!, height: obj.height! * obj.scaleY! });
});
```

Satisfies Requirements 4.15–4.17.

---

## AI Illustration API Route

### System Prompts

```ts
// For illustration generation (Draw panel → "Generate" button)
export const ILLUSTRATION_SYSTEM_PROMPT = `
You are an illustration generator for a print-on-demand platform.
Generate standalone artwork/illustrations suitable for printing on clothing and merchandise.

Rules:
- Generate ONLY flat, vector-style or artistic illustrations
- NO people, NO faces, NO merch/clothing context
- Suitable for DTF, screen printing, or embroidery
- Clean edges, high contrast, print-ready aesthetic
- Ukrainian cultural motifs, nature, geometric patterns, or abstract art are preferred
- Output should look like a professional graphic design asset
`;

// For drawing enhancement (Draw panel → "Enhance Drawing" button)
export const ENHANCE_DRAWING_SYSTEM_PROMPT = `
You are an illustration enhancer for a print-on-demand platform.
You receive a rough sketch or freehand drawing and transform it into polished, print-ready artwork.

Rules:
- Enhance the provided sketch into clean, professional illustration artwork
- Preserve the original composition and intent of the sketch
- Apply clean lines, solid fills, and print-ready contrast
- NO people, NO faces, NO merch/clothing context
- Output should be suitable for DTF, screen printing, or embroidery
- Style: flat vector illustration or bold graphic art
`;
```

### Route Update (`/api/ai/generate`)

The existing route is updated to accept an optional `systemPrompt` field. The server validates it against an allowlist of permitted prompts to prevent prompt injection:

```ts
const ALLOWED_SYSTEM_PROMPTS = new Set([
  ILLUSTRATION_SYSTEM_PROMPT.trim(),
  ENHANCE_DRAWING_SYSTEM_PROMPT.trim(),
]);

// In the POST handler:
const { prompt, contextDescription, imageDataUrl, canvasDataUrl, hasSelfie, systemPrompt } =
  await request.json();

const resolvedSystemPrompt = (systemPrompt && ALLOWED_SYSTEM_PROMPTS.has(systemPrompt.trim()))
  ? systemPrompt.trim()
  : SYSTEM_PROMPT;  // default: existing merch visualization prompt
```

The `useAIIllustration` hook calls the route as follows:

```ts
// generate(prompt):
fetch("/api/ai/generate", {
  method: "POST",
  body: JSON.stringify({
    prompt,
    contextDescription: "Generate a standalone illustration for print-on-demand.",
    imageDataUrl: BLANK_PNG_DATA_URL,  // required by route; use 1×1 transparent PNG
    systemPrompt: ILLUSTRATION_SYSTEM_PROMPT,
  }),
});

// enhance(drawLayerDataUrl):
fetch("/api/ai/generate", {
  method: "POST",
  body: JSON.stringify({
    prompt: "Enhance this sketch into polished print-ready artwork.",
    contextDescription: "Enhance the provided drawing.",
    imageDataUrl: drawLayerDataUrl,
    systemPrompt: ENHANCE_DRAWING_SYSTEM_PROMPT,
  }),
});
```

Satisfies Requirements 3.29–3.37.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Before writing properties, redundancy analysis:

- Properties from 1.2 (open tab) and 1.3 (close tab) can be combined into a single toggle round-trip property.
- Properties from 4.5 (font size range) and 4.7 (letter spacing range) are both range-validation properties on numeric fields — they can be combined into a single "numeric text field range acceptance" property.
- Properties from 8.1 and 8.7 (PrintLayer type compatibility) are the same property stated twice — merged into one backward-compatibility property.
- The DrawingSession clear (3.27) and isolation (session doesn't affect saved layers) are distinct enough to keep separate.

After reflection: 9 unique properties remain.

---

### Property 1: Sidebar Tab Toggle

*For any* `SidebarTabId`, clicking the tab when it is closed sets `activeTab` to that id; clicking it again when it is already active sets `activeTab` to `null`, returning to full-canvas view.

**Validates: Requirements 1.2, 1.3**

---

### Property 2: Layer State Preserved Across Tab Switches

*For any* array of `PrintLayer` objects and any sequence of `activeTab` changes, the `layers` array is identical before and after the tab switch — no layers are added, removed, or mutated by the tab change alone.

**Validates: Requirements 1.5**

---

### Property 3: One DrawLayer Per Side

*For any* sequence of draw-and-save operations on the same canvas side, `layers.filter(l => l.side === side && l.kind === "drawing").length` is always `<= 1` after each operation.

**Validates: Requirements 3.19, 3.21, 3.22, 3.23**

---

### Property 4: DrawingSession Clear Isolation

*For any* `DrawingSessionState` with any number of `sessionObjects`, calling `clearSession()` results in `sessionObjects.length === 0` and leaves all saved `PrintLayer` objects in `layers` unchanged.

**Validates: Requirements 3.27**

---

### Property 5: Undo/Redo Stack Invariant

*For any* drawing session with `N` session objects, after `K` undo operations (where `0 <= K <= N`), `sessionObjects.length === N - K`. After `K` subsequent redo operations, `sessionObjects.length === N`.

**Validates: Requirements 3.24, 3.25**

---

### Property 6: TextTransform Correctness

*For any* non-empty string `s` and any `textTransform` value `t`, `applyTextTransform(s, t)` returns:
- `s.toUpperCase()` when `t === "uppercase"`
- `s.toLowerCase()` when `t === "lowercase"`
- each word's first character uppercased when `t === "capitalize"`
- `s` unchanged when `t === "none"` or `t` is `undefined`

**Validates: Requirements 4.6**

---

### Property 7: TextBox Resize Does Not Change Font Size

*For any* `PrintLayer` with `kind === "text"` and any `textFontSize` value, updating `textBoxWidth` or `textBoxHeight` (or both) does not change `textFontSize`. The font size field is independent of the container dimensions.

**Validates: Requirements 4.15, 4.16, 4.17**

---

### Property 8: Numeric Text Field Range Acceptance

*For any* `textFontSize` value in `[8, 200]`, the `PrintLayer` validator accepts it without error. *For any* `textLetterSpacing` value in `[-10, 100]`, the `PrintLayer` validator accepts it without error. *For any* `textLineHeight` value in `[0.5, 3.0]`, the `PrintLayer` validator accepts it without error.

**Validates: Requirements 4.5, 4.7, 4.8, 8.1**

---

### Property 9: PrintLayer Backward Compatibility

*For any* `PrintLayer` object that was valid before this feature (i.e., containing only the original fields: `id`, `file`, `url`, `type`, `side`, and any subset of the original optional fields), the updated `PrintLayer` type accepts it without a TypeScript error. Specifically, a layer with `kind` absent is treated as `kind === "image"` at runtime without throwing.

**Validates: Requirements 8.7, 8.8, 8.9**

---

## Error Handling

| Scenario | Component | Handling |
|---|---|---|
| Supabase fetch fails (PrintPresets) | `PrintsPanel` | Inline error state with descriptive message + "Retry" button; canvas remains fully functional |
| SVG shape fails to load | `PrintsPanel` / `DrawPanel` (shape-stamp) | `toast.error(...)` via Sonner; no broken layer added to canvas |
| DrawingSession save produces empty/blank PNG | `DrawPanel` | `toast.warning(...)` — "Drawing is empty"; DrawLayer not created or replaced |
| AI illustration generation fails | `DrawPanel` | Inline error message below the prompt input + "Try Again" button; loading state cleared |
| AI enhance drawing fails | `DrawPanel` | Inline error message below the "Enhance" button + "Try Again" button; loading state cleared |
| File upload fails | `UploadPanel` | Inline error message with "Retry" button; recent uploads list unchanged |
| Unsupported file type dropped | `UploadPanel` | Inline error listing accepted formats (PNG, JPG, SVG, PDF); file not processed |
| File exceeds size limit (>20 MB) | `UploadPanel` | Inline error with size limit reminder; file not processed |
| TextBox resize below minimum (10px) | `TextPanel` | Clamp to 10px minimum silently; no error toast |
| Font not loaded (Google Fonts) | `ProductCanvas` | Fabric.js falls back to system sans-serif; no crash; no error shown to user |
| AI generate called with empty prompt | `DrawPanel` | "Generate" button disabled when prompt is empty; no API call made |
| `startSession` called while session already active | `useDrawingSession` | Existing session is discarded (after optional confirm dialog); new session starts |

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and pure functions:

- `applyTextTransform(s, t)` — all four transform values, empty string, string with mixed case
- `PrintPresetSchema` — valid object, missing required fields, invalid URL
- `ELEMENT_PRESETS` — every entry has a `category` that exists in `SHAPE_CATEGORIES`
- `FONT_COMBO_PRESETS` — length >= 6, all `headingFont` and `bodyFont` values exist in `TEXT_FONTS`
- `useDrawingSession` — `clearSession` empties `sessionObjects`, `undo`/`redo` stack transitions
- `EditorSidebar` — renders exactly 4 tab buttons, active tab has correct CSS class
- `PrintLayer` type — legacy layer (no `kind`) accepted, new fields accepted individually and in combination

### Property-Based Tests

Property-based tests use [fast-check](https://github.com/dubzzz/fast-check) (TypeScript-native, no additional runtime dependency). Each test runs a minimum of 100 iterations.

**Tag format:** `// Feature: canvas-editor-v2, Property {N}: {property_text}`

```ts
// Property 1: Sidebar Tab Toggle
// Feature: canvas-editor-v2, Property 1: sidebar tab toggle is a clean toggle
fc.assert(fc.property(
  fc.constantFrom("prints", "draw", "text", "upload"),
  (tab) => {
    const { result } = renderHook(() => useSidebarTab());
    act(() => result.current.onTabChange(tab));
    expect(result.current.activeTab).toBe(tab);
    act(() => result.current.onTabChange(tab));
    expect(result.current.activeTab).toBeNull();
  }
), { numRuns: 100 });

// Property 3: One DrawLayer Per Side
// Feature: canvas-editor-v2, Property 3: one DrawLayer per side invariant
fc.assert(fc.property(
  fc.array(fc.record({ side: fc.constantFrom("front", "back"), kind: fc.constant("drawing") })),
  (ops) => {
    const layers = simulateSaveOperations(ops);
    ["front", "back"].forEach(side => {
      const count = layers.filter(l => l.side === side && l.kind === "drawing").length;
      expect(count).toBeLessThanOrEqual(1);
    });
  }
), { numRuns: 200 });

// Property 6: TextTransform Correctness
// Feature: canvas-editor-v2, Property 6: applyTextTransform correctness
fc.assert(fc.property(
  fc.string({ minLength: 1 }),
  fc.constantFrom("none", "uppercase", "lowercase", "capitalize", undefined),
  (s, t) => {
    const result = applyTextTransform(s, t);
    if (t === "uppercase") expect(result).toBe(s.toUpperCase());
    else if (t === "lowercase") expect(result).toBe(s.toLowerCase());
    else if (t === "capitalize") expect(result).toMatch(/^\p{Lu}/u);
    else expect(result).toBe(s);
  }
), { numRuns: 500 });

// Property 7: TextBox Resize Does Not Change Font Size
// Feature: canvas-editor-v2, Property 7: textBoxWidth/Height independent of textFontSize
fc.assert(fc.property(
  fc.integer({ min: 8, max: 200 }),   // textFontSize
  fc.integer({ min: 10, max: 1000 }), // new textBoxWidth
  fc.integer({ min: 10, max: 1000 }), // new textBoxHeight
  (fontSize, newWidth, newHeight) => {
    const layer = makeTextLayer({ textFontSize: fontSize });
    const updated = applyTextPatch(layer, { textBoxWidth: newWidth, textBoxHeight: newHeight });
    expect(updated.textFontSize).toBe(fontSize);
  }
), { numRuns: 300 });
```

### Integration Tests

- `PrintsPanel` — mock Supabase client, verify fetch called with correct query, verify skeleton → grid transition
- `/api/ai/generate` — verify `systemPrompt` allowlist enforcement (invalid prompt falls back to default)
- `useAIIllustration` — mock fetch, verify correct `systemPrompt` sent for `generate` vs `enhance`

### Accessibility

- All interactive controls have `aria-label` or visible label
- Tab buttons have `aria-pressed` state
- MobileSheet has `role="dialog"` and `aria-modal="true"`
- Color pickers include a text input fallback for keyboard entry
- Minimum tap target 44×44px enforced on all mobile controls (Requirements 6.8)

---

## Migration Strategy

### Step 1: Extend `@udo-craft/shared`

Update `packages/shared/index.ts`:
- Extend `PrintLayer` interface with all new optional fields (`kind: "drawing"`, text fields)
- Export `ELEMENT_PRESETS`, `SHAPE_CATEGORIES`, `FONT_COMBO_PRESETS`
- Export `PrintPresetSchema` and `PrintPreset` type
- No breaking changes — all new fields are optional; `kind` absent = `"image"` by convention

Both apps continue to compile without changes at this step.

### Step 2: Extract `LayersList`

In both apps, extract the layer list rendering from `LayersPanel` into a `LayersList` component with the same props (minus the quick-add buttons). `LayersPanel` becomes a thin wrapper. This is a pure refactor — no behaviour changes.

### Step 3: Build `EditorSidebar` and Panels

Create new components in each app:
- `EditorSidebar` — tab navigation + `LayersList` in lower section
- `PrintsPanel`, `DrawPanel`, `TextPanel`, `UploadPanel` — panel content

These are additive — they don't replace anything yet.

### Step 4: Add State Extensions

**Client (`useCustomizerState.ts`):**
```ts
// Add to existing state:
const [activeTab, setActiveTab] = useState<SidebarTabId | null>(null);
// drawingSession state is owned by useDrawingSession hook inside DrawPanel
```

**Admin (`Customizer.tsx`):**
```ts
// Add alongside existing useState calls:
const [activeTab, setActiveTab] = useState<SidebarTabId | null>(null);
```

Extend `onTextChange` handler in both apps to accept the full `TextLayerPatch` type.

### Step 5: Replace LeftPanel

**Admin:** Replace `<LeftPanel {...leftPanelProps} />` with `<EditorSidebar ... />` in `Customizer.tsx`. The grid layout changes from `grid-cols-[280px_1fr_280px]` to `grid-cols-[56px_auto_1fr_280px]`.

**Client:** Replace `<CustomizerLeftPanel ... />` with `<EditorSidebar ... />` in `Customizer.tsx`. `CustomizerLayout` is updated to accommodate the new sidebar width.

Color/size selectors (previously in `LeftPanel`) move to the right panel or a product info section above the canvas — they are not part of the new sidebar tabs.

### Step 6: Update Mobile Layout

Both apps: replace the existing `mobileSheet === "config"` bottom sheet with the new `MobileSheet` driven by `activeTab`. The `mobileSheet === "price"` sheet remains unchanged.

### Step 7: Update `/api/ai/generate`

Add `systemPrompt` field to the request body parsing and allowlist validation. Existing callers (`GenerationDrawer` / `useAIGeneration`) do not pass `systemPrompt`, so they continue to use the default merch visualization prompt unchanged.

### Preserved Unchanged

- `GenerationDrawer` component in both apps — not touched
- `useAIGeneration` hook — not touched
- `ProductCanvas` / `CustomizerCanvas` — not touched (except adding `fabricCanvasRef` forwarding if not already present)
- `QtyPricePanel` / `QtyPriceContent` — not touched
- `useCustomizer` hook in `@udo-craft/shared` — not touched
- All existing API routes except `/api/ai/generate` (additive change only)

---
