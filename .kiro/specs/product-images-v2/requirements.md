# Product Images V2 — Requirements

## Problem

Currently `products.images` and `product_color_variants.images` are stored as `Record<string, string>` (flat key→url map). This works for the canvas customizer (which needs to know which side to render) but has no way to distinguish "this image is a canvas side" from "this is a lifestyle/gallery photo". As a result, admins can't upload extra product photos without them appearing as canvas sides.

## Goal

Allow each image on a product (and per-color variant) to be marked as customizable or not. Customizable images appear as canvas sides in the editor. Non-customizable images appear only in the product gallery on the detail page.

## Requirements

### R1 — New image data model
Each image entry must carry:
- `key` — unique identifier within the product/variant (e.g. "front", "back", "lifestyle_1")
- `url` — uploaded image URL
- `label` — human-readable name shown in admin (e.g. "Передня сторона", "На моделі")
- `is_customizable` — boolean; true = canvas side, false = gallery only
- `sort_order` — integer for display ordering

### R2 — Database
- Add `product_images jsonb default '[]'` column to `products` table
- Add `variant_images jsonb default '[]'` column to `product_color_variants` table
- Keep existing `images` column intact during migration (backward compat)
- Seed existing `images` data into new columns with `is_customizable: true`

### R3 — Shared schema
- Add `ProductImageSchema` Zod object: `{ key, url, label, is_customizable, sort_order }`
- Add `product_images: ProductImageSchema[]` to `ProductSchema` (optional, default `[]`)
- Add `variant_images: ProductImageSchema[]` to `ProductColorVariantSchema` (optional, default `[]`)
- Export `getCustomizableImages(imgs: ProductImage[]): Record<string, string>` helper — returns the old `{ key: url }` shape for canvas compatibility

### R4 — Admin: product image manager
Replace the current `imageSlots` UI in the product edit modal with a new multi-image manager:
- Add new image row (key auto-generated, editable label, upload button, `is_customizable` toggle)
- Reorder rows via drag handle
- Delete individual rows
- Visual distinction between customizable (canvas icon badge) and gallery-only (photo icon badge) images
- Save writes to `product_images` column

### R5 — Admin: color variant image manager
Same upgrade for `ProductColorVariantEditor`:
- Replace `imageSlots` with the same multi-image manager component
- Save writes to `variant_images` column

### R6 — Canvas compatibility shim
All canvas/customizer code that currently reads `product.images` or `variant.images` must be updated to call `getCustomizableImages()` on the new arrays. The old `images` column is no longer written to by admin but remains readable as fallback.

Affected files:
- `apps/client/src/components/ProductCanvas.tsx`
- `apps/admin/src/components/product-canvas.tsx`
- `apps/admin/src/app/(dashboard)/orders/new/_components/Customizer.tsx`
- `apps/admin/src/app/(dashboard)/orders/new/_components/ProductCardInline.tsx`
- `apps/admin/src/app/(dashboard)/orders/new/page.tsx`
- `apps/admin/src/app/(dashboard)/orders/page.tsx`
- `apps/client/src/components/ProductCardDetailed.tsx`
- `apps/client/src/app/checkout/page.tsx`
- `apps/client/src/app/products/[slug]/page.tsx`

### R7 — Product detail page gallery
`/products/[slug]` must show ALL images (customizable + gallery) in the gallery viewer. Thumbnails show all images. The main image switcher cycles through all of them. Only customizable images are used as canvas sides when the user clicks "Кастомізувати".

### R8 — Landing catalog card
`ProductCardDetailed` on the landing page must link to `/products/[slug]` on click (instead of jumping directly to `/order`). The card image preview still shows the first customizable image (or first image overall as fallback).

### R9 — Backward compatibility
- If `product_images` is empty, fall back to reading `images` (old column) — zero breakage for existing products
- Same fallback for `variant_images` → `images`
- Migration seeds existing data so fallback is only needed for edge cases
