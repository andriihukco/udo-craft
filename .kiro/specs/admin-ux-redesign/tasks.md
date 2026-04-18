# Implementation Tasks — Admin UX Redesign

## Phase 1: Route Architecture — Dedicated Pages

- [x] 1. Create Product Detail Page `/products/[id]`
  - [x] 1.1 Create `apps/admin/src/app/(dashboard)/products/[id]/page.tsx` — fetch product by id, render `<ProductForm product={...} />`
  - [x] 1.2 Add `<PageHeader>` with breadcrumb "Каталог / [product name]" and action buttons: "← Назад", "Видалити", "Зберегти"
  - [x] 1.3 On save success: stay on page, show success toast
  - [x] 1.4 On delete: show `<AlertDialog>` confirmation, then redirect to `/products`
  - [x] 1.5 Show "Є незбережені зміни" banner when form is dirty and admin tries to navigate away

- [x] 2. Create Product New Page `/products/new`
  - [x] 2.1 Create `apps/admin/src/app/(dashboard)/products/new/page.tsx` — render `<ProductForm />` (no product prop)
  - [x] 2.2 Add `<PageHeader>` with breadcrumb "Каталог / Новий товар" and "← Назад" button
  - [x] 2.3 On save success: redirect to `/products/[newId]`

- [x] 3. Create Order Detail Page `/orders/[id]`
  - [x] 3.1 Create `apps/admin/src/app/(dashboard)/orders/[id]/page.tsx`
  - [x] 3.2 Add `<PageHeader>` with breadcrumb "Замовлення / #[id]" and "← Назад", "Зберегти" buttons
  - [x] 3.3 Two-column layout on desktop: left (контактні дані, товари), right (статус, теги, нотатки)
  - [x] 3.4 Use shadcn/ui `<Input>` for all editable contact fields — no raw `<input>` elements
  - [x] 3.5 Add messages thread section at the bottom of the page

- [x] 4. Create Catalog Settings Page `/settings/catalog`
  - [x] 4.1 Create `apps/admin/src/app/(dashboard)/settings/catalog/page.tsx`
  - [x] 4.2 Add vertical tab layout (left nav): Кольори, Ціни друку, Принти
  - [x] 4.3 Move materials management (table + Dialog) from `products/page.tsx` to this page
  - [x] 4.4 Move `<PrintTypePricingManager />` from `products/page.tsx` to this page
  - [x] 4.5 Move `<PrintPresetsTab />` from `products/page.tsx` to this page
  - [x] 4.6 Add "Налаштування каталогу" link to `AppSidebar` under the "Каталог" group

## Phase 2: Products List Page Refactor

- [x] 5. Create `useProductsData` hook
  - [x] 5.1 Create `apps/admin/src/app/(dashboard)/products/_components/useProductsData.ts`
  - [x] 5.2 Fetch products, categories, materials, sizeCharts, printAreas in a single `Promise.all()`
  - [x] 5.3 Expose `refresh()`, `refreshProducts()`, `loading`, and all data arrays
  - [x] 5.4 Ensure switching tabs does NOT re-fetch already loaded data

- [x] 6. Create `ProductsTab` with search and filters
  - [x] 6.1 Create `apps/admin/src/app/(dashboard)/products/_components/ProductsTab.tsx`
  - [x] 6.2 Add search input filtering by name (case-insensitive, ≤300ms, client-side)
  - [x] 6.3 Add "Активні / Неактивні / Всі" status filter dropdown
  - [x] 6.4 Show product count label (e.g. "12 товарів") updating with active filters
  - [x] 6.5 Highlight active category filter chip with `bg-primary text-primary-foreground`
  - [x] 6.6 Show `EmptyState` (SearchX icon, "Нічого не знайдено", "Скинути фільтри" button) when no results
  - [x] 6.7 Show `EmptyState` (Shirt icon, "Товарів ще немає", "+ Додати товар" button) when list is empty
  - [x] 6.8 Show `<ProductsTableSkeleton>` (5 animated rows) while loading — not "Завантаження..." text

- [x] 7. Create `ProductTableRow` component
  - [x] 7.1 Create `apps/admin/src/app/(dashboard)/products/_components/ProductTableRow.tsx`
  - [x] 7.2 Add thumbnail (32×32px, `object-contain`, white bg) from `product_images[0]` or `images` fallback
  - [x] 7.3 Add color variant count column
  - [x] 7.4 Add `<Badge variant="secondary">Кастом</Badge>` when `is_customizable === true`
  - [x] 7.5 Show muted "· Неактивний" text next to name when `is_active === false`
  - [x] 7.6 Make entire row clickable → `router.push("/products/[id]")` (stop propagation on Switch and drag handle)
  - [x] 7.7 Preserve drag-to-reorder, Switch toggle, hover action buttons (edit → navigate, delete → AlertDialog)

- [x] 8. Create `CategoriesTab` with `CategoryDialog`
  - [x] 8.1 Create `apps/admin/src/app/(dashboard)/products/_components/CategoriesTab.tsx`
  - [x] 8.2 Display categories as responsive card grid (1→2→3 columns)
  - [x] 8.3 Create `apps/admin/src/app/(dashboard)/products/_components/CategoryDialog.tsx` (≤5 fields, `max-w-md`)
  - [x] 8.4 Replace `<input type="checkbox">` in CategoryDialog with `<Switch>` + `<Label>`
  - [x] 8.5 Replace `window.confirm()` in delete handler with `<AlertDialog>`
  - [x] 8.6 Show `EmptyState` when categories array is empty

- [x] 9. Slim down `products/page.tsx` to list orchestrator (≤150 lines)
  - [x] 9.1 Replace all inline tab content with `<ProductsTab>` and `<CategoriesTab>` components
  - [x] 9.2 Remove all product/category/material modal state — these now live on dedicated pages/dialogs
  - [x] 9.3 Keep only: tab state, `useProductsData()` call, tab header with "Товари" and "Категорії" tabs
  - [x] 9.4 "Додати товар" button navigates to `/products/new` — not opens a Dialog
  - [x] 9.5 Add `<PageHeader title="Товари" />` at the top

## Phase 3: ProductForm Component

- [x] 10. Create `ProductForm` shared component
  - [x] 10.1 Create `apps/admin/src/app/(dashboard)/products/_components/ProductForm.tsx`
  - [x] 10.2 Two-column layout on desktop for basic info: left (Назва, Slug, Опис, Категорія), right (Ціна, Активний, Кастомізація)
  - [x] 10.3 Organize into `<Card>` sections: Основна інформація, Фотографії, Розміри, Зони друку, Знижки, Кольори
  - [x] 10.4 Show "Зони друку" section ONLY when `is_customizable === true`
  - [x] 10.5 Show "Кольори та фото" section with `<ProductColorVariantsList>` inline — only when `product.id` exists
  - [x] 10.6 Show "Кольори можна додати після збереження" placeholder when creating new product
  - [x] 10.7 Add `₴` prefix adornment to price field
  - [x] 10.8 Show slug as muted monospace text below name input (auto-generated, editable on click)
  - [x] 10.9 Add inline field-level validation errors below Name field when empty on save attempt
  - [x] 10.10 Disable save button and show `<Loader2 animate-spin>` while saving

## Phase 4: Color Variants Refactor

- [x] 11. Refactor `ProductColorVariantEditor` — replace native elements
  - [x] 11.1 Replace native `<select>` for material with shadcn/ui `<Select>` showing color swatch + name in each `<SelectItem>`
  - [x] 11.2 Replace `<input type="checkbox">` for `is_active` with `<Switch>` + `<Label>`
  - [x] 11.3 Replace `window.confirm()` in `handleDelete` with `<AlertDialog>`
  - [x] 11.4 Show `EmptyState` (ImageIcon, "Фото не додано") when variant has no images

## Phase 5: Orders Refactor

- [x] 12. Create `OrderQuickSheet` component
  - [x] 12.1 Create `apps/admin/src/app/(dashboard)/orders/_components/OrderQuickSheet.tsx`
  - [x] 12.2 Use shadcn/ui `<Sheet side="right" className="w-[480px]">` — not a Drawer
  - [x] 12.3 Display: клієнт, контакти (read-only), товари, сума, статус buttons, теги, нотатки preview
  - [x] 12.4 Add "Відкрити повне замовлення →" link to `/orders/[id]`
  - [x] 12.5 Status change buttons update kanban optimistically via `onStatusChange` callback

- [x] 13. Extract `KanbanColumn` and `OrderCard`
  - [x] 13.1 Create `apps/admin/src/app/(dashboard)/orders/_components/KanbanColumn.tsx`
  - [x] 13.2 Create `apps/admin/src/app/(dashboard)/orders/_components/OrderCard.tsx`
  - [x] 13.3 `OrderCard` click → open `<OrderQuickSheet>` (not navigate)
  - [x] 13.4 `KanbanColumn` header shows: status label, order count badge, total amount

- [x] 14. Fix `orders/page.tsx`
  - [x] 14.1 Replace local `PREDEFINED_TAGS` with `import { PREDEFINED_TAGS } from "@udo-craft/shared"`
  - [x] 14.2 Wrap `useSearchParams()` in `<Suspense>` boundary
  - [x] 14.3 Slim to ≤150 lines using extracted components

## Phase 6: Consistency Pass

- [x] 15. Add `PageHeader` to all pages missing it
  - [x] 15.1 `analytics/page.tsx` — add `<PageHeader title="Аналітика" />`
  - [x] 15.2 `clients/page.tsx` — add `<PageHeader title="Клієнти" />`
  - [x] 15.3 `messages/page.tsx` — add `<PageHeader title="Повідомлення" />`
  - [x] 15.4 `settings/page.tsx` — add `<PageHeader title="Налаштування" />`

- [x] 16. Add `EmptyState` to all pages with zero-data states
  - [x] 16.1 `analytics/page.tsx` — EmptyState when all metrics are zero
  - [x] 16.2 `messages/page.tsx` — EmptyState when no conversations; EmptyState "Оберіть розмову" when none selected
  - [x] 16.3 `clients/page.tsx` — EmptyState with "Додати клієнта" action

- [x] 17. Replace all `window.confirm()` with `<AlertDialog>`
  - [x] 17.1 Audit all files: `grep -r "window.confirm\|confirm(" apps/admin/src`
  - [x] 17.2 Replace each instance with shadcn/ui `<AlertDialog>` with descriptive title and description

- [x] 18. Standardize spacing and typography
  - [x] 18.1 Replace all `text-gray-500` and `text-neutral-500` with `text-muted-foreground`
  - [x] 18.2 Standardize page content padding to `p-4 md:p-6` for card pages, `px-4` for filter bars
  - [x] 18.3 Add `sr-only` spans to empty `<TableHead>` action columns

## Phase 7: TypeScript Quality

- [x] 19. Fix `any` type casts
  - [x] 19.1 Extend local `Product` interface: add `product_images?: ProductImage[]`
  - [x] 19.2 Extend local `ProductColorVariant` interface: add `variant_images?: ProductImage[]`
  - [x] 19.3 Remove all `(p as any).product_images` and `(v as any).variant_images` casts
  - [x] 19.4 Type Supabase Realtime payloads in `orders/page.tsx` using `Lead` from `@udo-craft/shared`
  - [x] 19.5 Run `npm run type-check` from repo root — fix all errors

## Phase 8: Property-Based Tests

- [ ] 20. Write PBT tests for filter and utility functions
  - [ ] 20.1 Create `apps/admin/src/app/(dashboard)/products/_components/__tests__/filters.test.ts`
  - [ ] 20.2 Property: filtered count ≤ total count for any search query
  - [ ] 20.3 Property: search is case-insensitive
  - [ ] 20.4 Property: empty filters return all products
  - [ ] 20.5 Property: `slugify` is idempotent
  - [ ] 20.6 Property: `reorder` preserves item count and set of IDs
