import { z } from "zod";

// Constants
export const PX_TO_MM_RATIO = 0.5; // Example ratio

// Enums
export const PrintZoneSideEnum = z.enum(["front", "back"]);
export const LeadStatusEnum = z.enum(["draft", "new", "in_progress", "production", "completed", "archived"]);

// Zod Schemas
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().default(""),
  base_price_cents: z.number().int(),
  images: z.record(z.string(), z.string()), // flexible: { front: url, back: url, left: url, ... }
  px_to_mm_ratio: z.number(),
  collar_y_px: z.number().int(),
  is_active: z.boolean().default(true),
  is_customizable: z.boolean().default(false),
  available_sizes: z.array(z.string()).default(["S", "M", "L", "XL"]),
});

export const PrintZoneSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  side: PrintZoneSideEnum,
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
  allowed_print_types: z.array(z.string()).default(["dtf"]).optional(),
});

export const LeadSchema = z.object({
  id: z.string().uuid(),
  status: LeadStatusEnum,
  customer_data: z.object({
    name: z.string(),
    email: z.string().email(),
    social_channel: z.string().url().optional(),
  }),
  total_amount_cents: z.number().int(),
});

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  product_id: z.string().uuid(),
  size: z.string(),
  color: z.string(),
  quantity: z.number().int().min(1),
  custom_print_url: z.string().url().optional(),
  mockup_url: z.string().url().optional(),
  technical_metadata: z.object({
    offset_top_mm: z.number(),
    print_size_mm: z.tuple([z.number(), z.number()]), // [width, height]
  }).optional(),
});

// TypeScript Interfaces inferred from Zod schemas
export type Product = z.infer<typeof ProductSchema>;
export type PrintZone = z.infer<typeof PrintZoneSchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type LeadStatus = z.infer<typeof LeadStatusEnum>;
export type PrintZoneSide = z.infer<typeof PrintZoneSideEnum>;

// ── Catalog hierarchy ───────────────────────────────────────────────────────

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  image_url: z.string().nullable().optional(),
});

export const MaterialSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  hex_code: z.string().default("#000000"),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const ProductColorVariantSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  material_id: z.string().uuid(),
  images: z.record(z.string(), z.string()),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type Category = z.infer<typeof CategorySchema>;
export type Material = z.infer<typeof MaterialSchema>;
export type ProductColorVariant = z.infer<typeof ProductColorVariantSchema>;

// ── Print types & fonts ─────────────────────────────────────────────────────

// Shared print type constants and types — no fabric dependency, safe for SSR
export const PRINT_TYPES = [
  { id: "dtf",         label: "DTF",        color: "#6366f1", bg: "#eef2ff", desc: "Прямий друк" },
  { id: "embroidery",  label: "Вишивка",    color: "#ec4899", bg: "#fdf2f8", desc: "Машинна вишивка" },
  { id: "screen",      label: "Шовкодрук",  color: "#f59e0b", bg: "#fffbeb", desc: "Трафаретний друк" },
  { id: "sublimation", label: "Сублімація", color: "#06b6d4", bg: "#ecfeff", desc: "Термоперенос" },
  { id: "patch",       label: "Нашивка",    color: "#10b981", bg: "#ecfdf5", desc: "Тканинна нашивка" },
] as const;

export type PrintTypeId = typeof PRINT_TYPES[number]["id"];

/**
 * 15 Google Fonts with full Cyrillic support — visually distinct families.
 */
export const TEXT_FONTS = [
  { id: "Montserrat",         label: "Montserrat",          style: "sans-serif", category: "Гротеск"       },
  { id: "PT Sans",            label: "PT Sans",              style: "sans-serif", category: "Гротеск"       },
  { id: "PT Serif",           label: "PT Serif",             style: "serif",      category: "Антиква"       },
  { id: "Playfair Display",   label: "Playfair Display",     style: "serif",      category: "Антиква"       },
  { id: "Oswald",             label: "Oswald",               style: "sans-serif", category: "Конденсований" },
  { id: "Raleway",            label: "Raleway",              style: "sans-serif", category: "Гротеск"       },
  { id: "Lobster",            label: "Lobster",              style: "cursive",    category: "Декоративний"  },
  { id: "Comfortaa",          label: "Comfortaa",            style: "cursive",    category: "Декоративний"  },
  { id: "Exo 2",              label: "Exo 2",                style: "sans-serif", category: "Технічний"     },
  { id: "Nunito",             label: "Nunito",               style: "sans-serif", category: "Гротеск"       },
  { id: "Merriweather",       label: "Merriweather",         style: "serif",      category: "Антиква"       },
  { id: "Cormorant Garamond", label: "Cormorant Garamond",   style: "serif",      category: "Антиква"       },
  { id: "Unbounded",          label: "Unbounded",            style: "sans-serif", category: "Дисплейний"    },
  { id: "Jost",               label: "Jost",                 style: "sans-serif", category: "Гротеск"       },
  { id: "Philosopher",        label: "Philosopher",          style: "serif",      category: "Антиква"       },
] as const;

export type TextFontId = typeof TEXT_FONTS[number]["id"];

export interface PrintLayer {
  id: string;
  /** For image layers: the File object. For text layers: a synthetic File (empty placeholder). */
  file: File;
  /** For image layers: blob/uploaded URL. For text layers: empty string. */
  url: string;
  uploadedUrl?: string;
  type: PrintTypeId;
  side: string;
  sizeLabel?: string;
  sizeMinCm?: number;
  sizeMaxCm?: number;
  priceCents?: number;
  /** Canvas transform */
  transform?: { left: number; top: number; scaleX: number; scaleY: number; angle: number; flipX: boolean };
  /** Text layer fields */
  kind?: "image" | "text";
  textContent?: string;
  textFont?: TextFontId;
  textColor?: string;
  textFontSize?: number;
  textAlign?: "left" | "center" | "right";
  /** Curve radius in degrees: 0 = straight, positive = arc up, negative = arc down */
  textCurve?: number;
}

// ── Order constants ─────────────────────────────────────────────────────────

export const PREDEFINED_TAGS = [
  { id: "paid_100",   label: "Оплачено 100%", color: "#16a34a", bg: "#dcfce7" },
  { id: "paid_50",    label: "Оплачено 50%",  color: "#d97706", bg: "#fef3c7" },
  { id: "urgent",     label: "Терміново",     color: "#dc2626", bg: "#fee2e2" },
  { id: "vip",        label: "VIP",           color: "#7c3aed", bg: "#ede9fe" },
  { id: "new_client", label: "Новий клієнт",  color: "#0284c7", bg: "#e0f2fe" },
] as const;

export const DISCOUNT_TIERS = [
  { min: 10, max: 49,   pct: 5  },
  { min: 50, max: 99,   pct: 12 },
  { min: 100, max: null, pct: 15 },
] as const;

// ── Lead validation ─────────────────────────────────────────────────────────

export const CreateLeadSchema = z.object({
  status: LeadStatusEnum,
  customer_data: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    social_channel: z.string().optional(),
    phone: z.string().optional(),
  }),
  total_amount_cents: z.number().int().optional(),
});

export type CreateLead = z.infer<typeof CreateLeadSchema>;

// ── useCustomizer hook ──────────────────────────────────────────────────────

export {
  useCustomizer,
  getUploadUrl,
  type UseCustomizerConfig,
  type UseCustomizerReturn,
  type HandleAddToCartParams,
  type HandleAddToCartResult,
  type PrintTypePricingRow,
} from "./src/useCustomizer";
