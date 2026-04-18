# Product Images V2 — Tasks

## Task 1: DB Migration
- [x] Create `supabase/migrations/20260418_product_images_v2.sql`
- [x] Add `product_images jsonb default '[]'` to `products`
- [x] Add `variant_images jsonb default '[]'` to `product_color_variants`
- [x] Seed existing `images` data into new columns with `is_customizable: true`

## Task 2: Shared schema + helpers
- [x] Add `ProductImageSchema` and `ProductImage` type to `packages/shared/index.ts`
- [x] Add `product_images` field to `ProductSchema`
- [x] Add `variant_images` field to `ProductColorVariantSchema`
- [x] Export `getCustomizableImages()`, `getAllImages()`, `resolveProductImages()` helpers

## Task 3: `ProductImageManager` shared component
- [x] Create `packages/ui/components/ProductImageManager.tsx`
- [x] Drag-to-reorder rows (updates `sort_order`)
- [x] Per-row: label input, key input, `is_customizable` toggle, upload, delete
- [x] Upload via `uploadUrl` prop, show thumbnail preview
- [x] Export from `packages/ui/index.ts`

## Task 4: Admin — product modal
- [x] Replace `imageSlots` state + UI in `apps/admin/src/app/(dashboard)/products/page.tsx` with `ProductImageManager`
- [x] `handleSaveProduct` writes `product_images` to API

## Task 5: Admin — color variant editor
- [x] Replace `imageSlots` in `apps/admin/src/components/product-color-variants.tsx` with `ProductImageManager`
- [x] `handleSave` writes `variant_images` to API

## Task 6: Admin API — accept new fields
- [x] `apps/admin/src/app/api/products/[id]/route.ts` — passes body through (no change needed)
- [x] `apps/admin/src/app/api/product-color-variants/[id]/route.ts` — passes body through (no change needed)

## Task 7: Canvas compatibility shim — client
- [x] `apps/client/src/components/ProductCanvas.tsx`
- [x] `apps/client/src/components/ProductCardDetailed.tsx` — card click goes to `/products/[slug]`
- [x] `apps/client/src/app/products/[slug]/page.tsx` — all images for gallery, customizable for canvas CTA
- [x] `apps/client/src/app/checkout/page.tsx`

## Task 8: Canvas compatibility shim — admin
- [x] `apps/admin/src/components/product-canvas.tsx`
- [x] `apps/admin/src/app/(dashboard)/orders/new/_components/Customizer.tsx`
- [x] `apps/admin/src/app/(dashboard)/orders/new/_components/ProductCardInline.tsx`
- [x] `apps/admin/src/app/(dashboard)/orders/new/page.tsx`
- [x] `apps/admin/src/app/(dashboard)/orders/page.tsx`

## Task 9: Product detail page — full gallery
- [x] Show all images (customizable + gallery) in thumbnail strip
- [x] Main image viewer cycles through all images
- [x] "Кастомізувати" CTA only passes customizable images to canvas

## Task 10: Type-check + smoke test
- [x] `npm run type-check` passes — zero new errors introduced
