# Product Images V2 — Design

## Data Model

### `ProductImage` type (new, in `@udo-craft/shared`)

```ts
const ProductImageSchema = z.object({
  key:             z.string(),           // "front" | "back" | "lifestyle_1" | any string
  url:             z.string(),
  label:           z.string().default(""),
  is_customizable: z.boolean().default(false),
  sort_order:      z.number().int().default(0),
});
type ProductImage = z.infer<typeof ProductImageSchema>;
```

### Updated `ProductSchema`
```ts
product_images: z.array(ProductImageSchema).default([])
```

### Updated `ProductColorVariantSchema`
```ts
variant_images: z.array(ProductImageSchema).default([])
```

### Compatibility helper (exported from shared)
```ts
export function getCustomizableImages(imgs: ProductImage[]): Record<string, string> {
  return Object.fromEntries(
    imgs
      .filter(i => i.is_customizable && i.url)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(i => [i.key, i.url])
  );
}

export function getAllImages(imgs: ProductImage[]): Record<string, string> {
  return Object.fromEntries(
    imgs
      .filter(i => i.url)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(i => [i.key, i.url])
  );
}

/** Reads new column with fallback to legacy images Record */
export function resolveProductImages(
  product_images: ProductImage[] | undefined,
  legacy_images: Record<string, string> | undefined
): ProductImage[] {
  if (product_images && product_images.length > 0) return product_images;
  // Convert legacy Record to ProductImage array, all marked customizable
  return Object.entries(legacy_images ?? {}).map(([key, url], i) => ({
    key, url, label: key, is_customizable: true, sort_order: i,
  }));
}
```

---

## Database Migration

```sql
-- Add new columns
alter table public.products
  add column if not exists product_images jsonb not null default '[]';

alter table public.product_color_variants
  add column if not exists variant_images jsonb not null default '[]';

-- Seed existing images into new columns (all marked is_customizable: true)
update public.products
set product_images = (
  select jsonb_agg(
    jsonb_build_object(
      'key',             entry.key,
      'url',             entry.value,
      'label',           entry.key,
      'is_customizable', true,
      'sort_order',      row_number() over () - 1
    )
  )
  from jsonb_each_text(images) as entry(key, value)
)
where images != '{}'::jsonb and product_images = '[]'::jsonb;

update public.product_color_variants
set variant_images = (
  select jsonb_agg(
    jsonb_build_object(
      'key',             entry.key,
      'url',             entry.value,
      'label',           entry.key,
      'is_customizable', true,
      'sort_order',      row_number() over () - 1
    )
  )
  from jsonb_each_text(images) as entry(key, value)
)
where images != '{}'::jsonb and variant_images = '[]'::jsonb;
```

---

## Shared Component: `ProductImageManager`

A reusable component used in both the product modal and the color variant editor.

```
packages/ui/components/ProductImageManager.tsx
```

Props:
```ts
interface ProductImageManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  uploadUrl: string;           // "/api/upload"
  uploadTagPrefix?: string;    // "product" | "variant"
}
```

UI layout per row:
```
[≡ drag] [thumbnail] [label input] [key input] [🎨 customizable toggle] [upload btn] [× delete]
```

- Drag handle for reorder (updates `sort_order`)
- Thumbnail preview (click to upload)
- Label: free text ("Передня сторона", "На моделі")
- Key: slug-style identifier, auto-generated from label if empty
- Toggle: `is_customizable` — shows canvas icon when on, photo icon when off
- Upload: triggers file input, POSTs to `uploadUrl`
- Delete: removes row

Add button at bottom: "+ Додати фото"

---

## Canvas Compatibility — Read Pattern

Every place that currently does:
```ts
const imgs = variant?.images ?? product.images ?? {};
const url = imgs.front ?? Object.values(imgs)[0];
```

Becomes:
```ts
import { resolveProductImages, getCustomizableImages } from "@udo-craft/shared";

const productImgs = resolveProductImages(product.product_images, product.images);
const variantImgs = variant ? resolveProductImages(variant.variant_images, variant.images) : null;
const imgs = getCustomizableImages(variantImgs?.length ? variantImgs : productImgs);
const url = imgs.front ?? Object.values(imgs)[0];
```

This is a mechanical find-and-replace across 9 files. The canvas behavior is identical.

---

## Product Detail Page — Gallery Logic

```ts
// All images for gallery display
const allImgs = resolveProductImages(product.product_images, product.images);
const galleryImages = allImgs.sort((a, b) => a.sort_order - b.sort_order);

// Only customizable for canvas
const customizableImgs = getCustomizableImages(allImgs);
```

Gallery thumbnails show all images. When user clicks "Кастомізувати", only customizable images are passed to the canvas via URL params (existing behavior unchanged).

---

## Admin API Changes

`PUT /api/products/:id` — accept `product_images` in body, write to DB
`PUT /api/product-color-variants/:id` — accept `variant_images` in body, write to DB

No new API routes needed.

---

## Landing Card Behavior Change

`ProductCardDetailed` currently navigates to `/order?product=slug` on click.

New behavior:
- Card click → `/products/[slug]`
- "Додати принт" button → `/order?product=slug&customize=1` (unchanged)
- "Додати без принта" button → unchanged

This gives users a proper product page before committing to the customizer.
