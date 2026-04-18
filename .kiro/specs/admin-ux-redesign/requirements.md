# Requirements Document — Admin UX Redesign

## Introduction

Цей документ описує вимоги до редизайну та рефакторингу адмін-панелі U:DO Craft (`apps/admin`).

Аудит виявив критичні проблеми: монолітні файли (1015 і 1139 рядків), перевантажені Dialog-и для складних форм, нативні HTML-елементи поруч із shadcn/ui, відсутність пошуку, непослідовні відступи та типографіка.

**Ключовий UX-принцип (Google/Apple pattern):**
- **Dialog** — тільки для малих, швидких форм (≤5 полів): категорія, матеріал, підтвердження видалення
- **Окрема сторінка** — для складних сутностей з багатьма секціями: товар, замовлення
- **Sheet/Drawer** — для контекстних деталей без переходу: швидкий перегляд замовлення на kanban

Мета — сучасний, зрозумілий адмін-інструмент, де кожна дія відчувається природно.

---

## Glossary

- **Admin_Dashboard**: Адмін-панель Next.js 14 за адресою `apps/admin`
- **Products_List_Page**: `/products` — таблиця товарів з пошуком і фільтрами
- **Product_Detail_Page**: `/products/[id]` — окрема сторінка редагування товару (нова)
- **Product_New_Page**: `/products/new` — окрема сторінка створення товару (нова)
- **Orders_Kanban**: `/orders` — kanban-дошка зі статусами
- **Order_Detail_Page**: `/orders/[id]` — окрема сторінка деталей замовлення (нова)
- **Quick_Sheet**: shadcn/ui `<Sheet>` — бічна панель для швидкого перегляду без переходу
- **Sidebar**: Ліва навігаційна панель (`AppSidebar`)
- **EmptyState**: `components/empty-state.tsx`
- **PageHeader**: `components/page-header.tsx`
- **Color_Variant**: Варіант кольору товару (`product_color_variants`)
- **Print_Area**: Зона нанесення друку (`print_zones`)

---

## Requirements

---

### Requirement 1: Навігаційна архітектура — сторінки замість Dialog для складних форм

**User Story:** Як адмін, я хочу редагувати товар на окремій сторінці, а не в переповненому Dialog, щоб мати достатньо простору для всіх секцій і не губитися в нескінченному скролі.

#### Acceptance Criteria

1. THE `Admin_Dashboard` SHALL navigate to `/products/new` when the admin clicks "Додати товар" — not open a Dialog.
2. THE `Admin_Dashboard` SHALL navigate to `/products/[id]` when the admin clicks on a product name or edit button — not open a Dialog.
3. THE `Admin_Dashboard` SHALL navigate to `/orders/[id]` when the admin clicks "Відкрити замовлення" from the kanban card or Quick Sheet — not rely solely on a Drawer.
4. THE `Admin_Dashboard` SHALL use `<Dialog>` ONLY for forms with ≤5 fields: category create/edit, material create/edit, delete confirmations.
5. THE `Admin_Dashboard` SHALL use `<Sheet>` (side panel) for quick-view contexts where the admin needs to see details without losing their place: order quick-view from kanban.
6. WHEN the admin saves a product on `/products/new`, THE `Admin_Dashboard` SHALL redirect to `/products/[id]` (the newly created product's page).
7. WHEN the admin saves changes on `/products/[id]`, THE `Admin_Dashboard` SHALL stay on the same page and show a success toast — not navigate away.

---

### Requirement 2: Product Detail Page — `/products/[id]`

**User Story:** Як адмін, я хочу мати повноцінну сторінку редагування товару з чіткими секціями, щоб зручно керувати всіма аспектами товару без перевантаженого Dialog.

#### Acceptance Criteria

1. THE `Product_Detail_Page` SHALL display a `PageHeader` with the product name, breadcrumb "Товари / [Назва]", and action buttons: "Зберегти", "Видалити", "← Назад до товарів".
2. THE `Product_Detail_Page` SHALL organize content into clearly separated card sections: "Основна інформація", "Фотографії", "Розміри", "Зони друку", "Знижки", "Кольори та фото".
3. THE `Product_Detail_Page` basic info section SHALL use a two-column layout on desktop: left column (Назва, Slug, Опис, Категорія), right column (Ціна, Активний, Кастомізація).
4. WHEN `is_customizable` is OFF, THE `Product_Detail_Page` SHALL hide the "Зони друку" section entirely.
5. THE `Product_Detail_Page` "Кольори та фото" section SHALL render `<ProductColorVariantsList>` inline — no nested Dialog or navigation required.
6. WHEN the admin saves without a required field (name, slug), THE `Product_Detail_Page` SHALL display inline field-level validation errors below the respective inputs and scroll to the first error.
7. THE `Product_Detail_Page` price field SHALL display a `₴` prefix adornment.
8. THE `Product_Detail_Page` slug field SHALL auto-generate from the name and be editable — displayed as a muted monospace text below the name input, not a separate full-width field.
9. WHEN the admin navigates away with unsaved changes, THE `Product_Detail_Page` SHALL show a browser confirmation or an in-page "Є незбережені зміни" banner.

---

### Requirement 3: Products List Page — `/products`

**User Story:** Як адмін, я хочу бачити каталог товарів у вигляді зручної таблиці з пошуком і фільтрами, щоб швидко знаходити і керувати товарами.

#### Acceptance Criteria

1. THE `Products_List_Page` SHALL display a search input that filters products by name in real time (≤300ms, case-insensitive, client-side).
2. THE `Products_List_Page` SHALL display category filter chips and an "Активні / Неактивні / Всі" status filter.
3. THE `Products_List_Page` SHALL display a product count label (e.g. "12 товарів") that updates with active filters.
4. WHEN no products match filters, THE `Products_List_Page` SHALL show `EmptyState` with "Нічого не знайдено" and a "Скинути фільтри" button.
5. WHEN the products list is empty, THE `Products_List_Page` SHALL show `EmptyState` with "Товарів ще немає" and an "Додати товар" button.
6. THE `Products_List_Page` table SHALL display per row: drag handle, active toggle, thumbnail (32×32px), name (clickable → `/products/[id]`), category, price, color count, "Кастом" badge if applicable.
7. WHEN data is loading, THE `Products_List_Page` SHALL display a skeleton loader (5 animated rows) — not a "Завантаження..." text.
8. THE `Products_List_Page` SHALL support drag-to-reorder with optimistic UI updates — existing behavior preserved.
9. THE `Products_List_Page` SHALL have two tabs: "Товари" and "Категорії" — configuration tabs (Кольори, Ціни, Принти) move to `/settings/catalog`.

---

### Requirement 4: Categories Tab — `/products?tab=categories`

**User Story:** Як адмін, я хочу керувати категоріями прямо на сторінці товарів у вигляді карток, а створювати/редагувати через компактний Dialog.

#### Acceptance Criteria

1. THE `Products_List_Page` categories tab SHALL display categories as a card grid (responsive: 1→2→3 columns).
2. WHEN the admin clicks "Нова категорія" or the edit button on a category card, THE `Admin_Dashboard` SHALL open a `<Dialog>` (not navigate) — the form has ≤5 fields (назва, slug, порядок, активна, зображення).
3. THE category `<Dialog>` SHALL use shadcn/ui `<Switch>` for the active toggle — not `<input type="checkbox">`.
4. WHEN the admin deletes a category, THE `Admin_Dashboard` SHALL show an `<AlertDialog>` confirmation — not `window.confirm()`.
5. THE categories card grid SHALL show `EmptyState` when no categories exist.
6. THE categories card SHALL display: image thumbnail, name, slug, active badge, edit and delete buttons.

---

### Requirement 5: Catalog Settings — `/settings/catalog`

**User Story:** Як адмін, я хочу щоб системні налаштування каталогу (кольори, ціни друку, принти) були відокремлені від управління товарами, щоб не плутати бізнес-контент із конфігурацією.

#### Acceptance Criteria

1. THE `Admin_Dashboard` SHALL move "Кольори (Матеріали)", "Ціни друку", and "Принти" to a dedicated `/settings/catalog` page.
2. THE `/settings/catalog` page SHALL use a vertical tab layout (left nav) with sections: Кольори, Ціни друку, Принти.
3. THE `Sidebar` SHALL add a "Налаштування каталогу" link under the "Каталог" group pointing to `/settings/catalog`.
4. WHEN the admin creates or edits a material, THE `Admin_Dashboard` SHALL use a `<Dialog>` — the form has ≤3 fields (назва, колір, активний).
5. THE material `<Dialog>` color picker SHALL use a styled `<input type="color">` paired with a shadcn/ui `<Input>` for the hex value.
6. WHEN the admin deletes a material, THE `Admin_Dashboard` SHALL show an `<AlertDialog>` confirmation.

---

### Requirement 6: Color Variants — inline on Product Detail Page

**User Story:** Як адмін, я хочу керувати кольоровими варіантами товару прямо на сторінці товару, без переходів між Dialog-ами.

#### Acceptance Criteria

1. THE `Product_Detail_Page` "Кольори та фото" section SHALL render `<ProductColorVariantsList>` inline — no "Керувати кольорами" button that opens a separate Dialog.
2. THE `ProductColorVariantEditor` SHALL replace the native `<select>` for material selection with shadcn/ui `<Select>` showing a color swatch + name in each option.
3. THE `ProductColorVariantEditor` SHALL replace `<input type="checkbox">` for `is_active` with shadcn/ui `<Switch>` + `<Label>`.
4. WHEN a color variant has no images, THE `ProductColorVariantsList` SHALL show `EmptyState` with `ImageIcon` and "Фото не додано".
5. WHEN the admin deletes a color variant, THE `Admin_Dashboard` SHALL show `<AlertDialog>` — not `window.confirm()`.
6. THE `ProductColorVariantsList` SHALL display a color swatch circle (using `hex_code`) next to the material name in each variant card.

---

### Requirement 7: Orders Kanban — Quick Sheet + Detail Page

**User Story:** Як адмін, я хочу швидко переглядати деталі замовлення прямо з kanban без переходу, але також мати повноцінну сторінку для детальної роботи із замовленням.

#### Acceptance Criteria

1. THE `Orders_Kanban` SHALL display a `<Sheet>` (side panel, 480px wide) when the admin clicks on an order card — for quick status change and basic info review.
2. THE `Quick_Sheet` SHALL display: клієнт, контакти, товари, поточний статус, кнопки зміни статусу, теги, нотатки, посилання "Відкрити повне замовлення →".
3. THE `Quick_Sheet` SHALL NOT contain editable contact form fields — it is read-mostly with status actions only.
4. THE `Order_Detail_Page` at `/orders/[id]` SHALL display the full order with all editable fields: контактні дані, товари, статус, теги, нотатки, повідомлення.
5. THE `Order_Detail_Page` SHALL display a `PageHeader` with breadcrumb "Замовлення / #[id]" and action buttons.
6. WHEN the admin changes order status from the `Quick_Sheet`, THE `Orders_Kanban` SHALL update the card position in real time via optimistic UI.
7. THE `Orders_Page` SHALL wrap `useSearchParams()` in a `<Suspense>` boundary.

---

### Requirement 8: Orders Page — компонентний рефакторинг

**User Story:** Як розробник, я хочу щоб `orders/page.tsx` (1139 рядків) був розбитий на компоненти, щоб код був підтримуваним.

#### Acceptance Criteria

1. THE `Orders_Page` SHALL be refactored to ≤150 lines by extracting: `KanbanColumn`, `OrderCard`, `OrderQuickSheet` into `orders/_components/`.
2. THE `Orders_Page` SHALL import `PREDEFINED_TAGS` from `@udo-craft/shared` — not redefine locally.
3. THE `OrderCard` SHALL display: клієнт, сума, кількість товарів, теги, дата — enough to identify the order without opening it.
4. THE `KanbanColumn` SHALL display the column header with status label, order count badge, and total amount.

---

### Requirement 9: Консистентність компонентів

**User Story:** Як адмін, я хочу щоб всі форми і сторінки використовували однакові UI-компоненти, щоб інтерфейс виглядав і поводився як єдиний продукт.

#### Acceptance Criteria

1. THE `Admin_Dashboard` SHALL replace all native `<select>` elements with shadcn/ui `<Select>` across all pages.
2. THE `Admin_Dashboard` SHALL replace all `<input type="checkbox">` elements with shadcn/ui `<Switch>` or `<Checkbox>`.
3. THE `Admin_Dashboard` SHALL use `<PageHeader>` on every full-page route: `/products`, `/products/[id]`, `/products/new`, `/orders`, `/orders/[id]`, `/analytics`, `/clients`, `/messages`, `/settings`.
4. THE `Admin_Dashboard` SHALL use `<EmptyState>` for all zero-data states across all pages.
5. WHEN data is loading, THE `Admin_Dashboard` SHALL display skeleton loaders — not "Завантаження..." text.
6. THE `Admin_Dashboard` SHALL replace all `window.confirm()` calls with shadcn/ui `<AlertDialog>`.

---

### Requirement 10: Навігація та активні стани

**User Story:** Як адмін, я хочу завжди розуміти де я знаходжусь і бачити важливі лічильники в навігації.

#### Acceptance Criteria

1. THE `Sidebar` SHALL preserve existing unread messages badge and new orders badge — these work correctly and SHALL not be changed.
2. THE `Sidebar` SHALL display badges on collapsed icon-only mode.
3. THE `Sidebar` SHALL correctly highlight the active item when on `/products/[id]` (parent "Товари" item highlighted).
4. THE `Sidebar` SHALL add "Налаштування каталогу" link under the "Каталог" group.
5. THE `MobileHeader` SHALL display the current page title on mobile.

---

### Requirement 11: Форми — валідація та UX

**User Story:** Як адмін, я хочу отримувати чіткий зворотній зв'язок при заповненні форм.

#### Acceptance Criteria

1. THE `Admin_Dashboard` SHALL display inline field-level validation errors below required fields — not only toasts.
2. WHEN a form is saving, THE `Admin_Dashboard` SHALL disable the submit button and show a loading state.
3. THE `Admin_Dashboard` SHALL mark required fields with `*` in the label consistently across all forms.
4. WHEN a `<Dialog>` form is open and the admin presses `Escape`, THE `Admin_Dashboard` SHALL close it — default shadcn/ui behavior, SHALL not be overridden.
5. WHEN the admin successfully saves, THE `Admin_Dashboard` SHALL show a success toast.

---

### Requirement 12: Таблиці — консистентність

**User Story:** Як адмін, я хочу щоб всі таблиці мали однаковий вигляд і поведінку.

#### Acceptance Criteria

1. THE `Admin_Dashboard` SHALL use shadcn/ui `<Table>` consistently across products, categories, materials, clients.
2. THE `Admin_Dashboard` tables SHALL have descriptive `<TableHead>` labels — not empty headers for action columns (use `sr-only` span).
3. THE `Admin_Dashboard` tables SHALL have minimum row height 48px for touch targets.
4. THE `Admin_Dashboard` SHALL use `text-muted-foreground` for all secondary text — not `text-gray-500` or `text-neutral-500`.

---

### Requirement 13: Порожні стани та завантаження

**User Story:** Як адмін, я хочу бачити інформативні стани на всіх сторінках.

#### Acceptance Criteria

1. THE `Admin_Dashboard` SHALL use `<EmptyState>` on every page with possible zero data.
2. WHEN data is loading, THE `Admin_Dashboard` SHALL show skeleton loaders.
3. WHEN a fetch fails, THE `Admin_Dashboard` SHALL show an error state with a "Спробувати знову" button.
4. THE `Analytics_Page` SHALL show `EmptyState` when all metrics are zero.
5. THE `Messages_Page` SHALL show `EmptyState` when no conversations exist and when no conversation is selected.
6. THE `Clients_Page` SHALL show `EmptyState` with an "Додати клієнта" action.

---

### Requirement 14: Аналітика

**User Story:** Як адмін, я хочу бачити аналітику в зрозумілому форматі.

#### Acceptance Criteria

1. THE `Analytics_Page` SHALL preserve existing `MetricCard` components and date range picker.
2. WHEN analytics data is loading after date range change, THE `Analytics_Page` SHALL show skeleton over metric cards.
3. THE `Analytics_Page` charts SHALL use Tailwind CSS design tokens — not hardcoded hex values.
4. THE `Analytics_Page` charts SHALL use Recharts `<ResponsiveContainer>` for responsive reflow.

---

### Requirement 15: Повідомлення

**User Story:** Як адмін, я хочу зручно переглядати та відповідати на повідомлення клієнтів.

#### Acceptance Criteria

1. THE `Messages_Page` SHALL display a two-panel layout on desktop: conversation list (280px left), message thread (right).
2. THE `Messages_Page` conversation list SHALL display: client name, last message preview (60 chars), timestamp, unread dot.
3. WHEN the admin opens a conversation, THE `Messages_Page` SHALL mark messages as read and clear the sidebar badge.
4. THE `Messages_Page` SHALL preserve existing Supabase Realtime message appending.

---

### Requirement 16: Мобільна адаптивність

**User Story:** Як адмін, я хочу мати можливість переглядати адмін з планшета.

#### Acceptance Criteria

1. THE `Admin_Dashboard` SHALL preserve existing `MobileHeader` and sidebar slide-over on mobile.
2. THE `Products_List_Page` table SHALL be horizontally scrollable on mobile.
3. THE `Product_Detail_Page` SHALL use single-column layout on mobile.
4. THE `Orders_Kanban` SHALL be horizontally scrollable on mobile.

---

### Requirement 17: Якість коду — TypeScript

**User Story:** Як розробник, я хочу щоб код не використовував `any` типи.

#### Acceptance Criteria

1. THE `Admin_Dashboard` SHALL replace `(p as any).product_images` with `ProductImage[]` type from `@udo-craft/shared`.
2. THE `Admin_Dashboard` SHALL replace `(v as any).variant_images` with `ProductImage[]` type from `@udo-craft/shared`.
3. THE `Admin_Dashboard` SHALL type Supabase Realtime payloads using `Lead` type from `@udo-craft/shared`.
4. THE `Admin_Dashboard` SHALL run `tsc --noEmit` with zero errors after refactoring.

---

### Requirement 18: Продуктивність

**User Story:** Як адмін, я хочу щоб сторінки завантажувались швидко.

#### Acceptance Criteria

1. THE `Products_List_Page` SHALL fetch all lookup data in a single `Promise.all()` — existing behavior preserved.
2. THE `Admin_Dashboard` SHALL add `<Suspense>` boundaries around all `useSearchParams()` usages.
3. THE `Admin_Dashboard` SHALL add `Sentry.captureException()` in API route `catch` blocks where only `console.error` is used.

---

### Requirement 19: Доступність

**User Story:** Як адмін, я хочу щоб інтерфейс підтримував клавіатурну навігацію.

#### Acceptance Criteria

1. THE `Admin_Dashboard` icon-only buttons SHALL have `aria-label` attributes.
2. THE `Admin_Dashboard` status badges SHALL include text labels — not rely only on color.
3. THE `Admin_Dashboard` tab navigation SHALL follow ARIA tabs pattern with arrow key support.
4. THE `Admin_Dashboard` SHALL preserve existing focus ring styles (`focus-visible:ring-2 focus-visible:ring-ring`).
