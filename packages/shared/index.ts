import { z } from "zod";

// Constants
export const PX_TO_MM_RATIO = 0.5; // Example ratio

// Enums
export const PrintZoneSideEnum = z.enum(["front", "back"]);
export const LeadStatusEnum = z.enum(["new", "in_progress", "production", "completed", "archived"]);

// Zod Schemas
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
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
