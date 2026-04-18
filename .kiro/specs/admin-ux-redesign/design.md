# Design Document — Admin UX Redesign

## Overview

Редизайн адмін-панелі базується на трьох принципах:

1. **Правильна навігаційна архітектура** — Dialog тільки для малих форм (≤5 полів), окрема сторінка для складних сутностей
2. **Консистентність** — shadcn/ui скрізь, `PageHeader` і `EmptyState` на кожній сторінці
3. **Сучасний UX** — skeleton loaders, inline validation, optimistic updates, breadcrumbs

### Правило вибору UI-патерну

| Сутність | Патерн | Обґрунтування |
|---|---|---|
| Товар (новий/редагування) | Окрема сторінка `/products/[id]` | Багато секцій, зображення, кольори, розміри |
| Замовлення (деталі) | Окрема сторінка `/orders/[id]` | Контактні дані, товари, повідомлення |
| Замовлення (quick view) | `<Sheet>` з kanban | Швидкий перегляд без втрати контексту |
| Категорія | `<Dialog>` | ≤5 полів: назва, slug, порядок, активна, фото |
| Матеріал | `<Dialog>` | ≤3 поля: назва, колір, активний |
| Видалення | `<AlertDialog>` | Підтвердження деструктивної дії |

---

## Route Architecture

```
/products                    → Products List Page (таблиця + пошук)
/products?tab=categories     → Categories Tab (картки)
/products/new                → Product New Page (форма створення)
/products/[id]               → Product Detail Page (форма редагування)
/orders                      → Orders Kanban
/orders/[id]                 → Order Detail Page
/settings/catalog            → Catalog Settings (кольори, ціни, принти)
```

---

## File Structure

```
apps/admin/src/
├── app/(dashboard)/
│   ├── products/
│   │   ├── page.tsx                          ← List page (≤150 рядків)
│   │   ├── new/
│   │   │   └── page.tsx                      ← New product page
│   │   ├── [id]/
│   │   │   └── page.tsx                      ← Product detail page
│   │   └── _components/
│   │       ├── ProductsTab.tsx               ← Таблиця з пошуком/фільтром
│   │       ├── ProductTableRow.tsx           ← Один рядок таблиці
│   │       ├── ProductsTableSkeleton.tsx     ← Skeleton loader
│   │       ├── CategoriesTab.tsx             ← Картки категорій
│   │       ├── CategoryDialog.tsx            ← Dialog ≤5 полів
│   │       ├── ProductForm.tsx               ← Shared форма (new + edit pages)
│   │       ├── ProductFormSections/
│   │       │   ├── BasicInfoSection.tsx
│   │       │   ├── ImagesSection.tsx
│   │       │   ├── SizesSection.tsx
│   │       │   ├── PrintAreasSection.tsx
│   │       │   ├── DiscountsSection.tsx
│   │       │   └── ColorsSection.tsx
│   │       └── useProductsData.ts            ← Fetch hook
│   ├── orders/
│   │   ├── page.tsx                          ← Kanban (≤150 рядків)
│   │   ├── [id]/
│   │   │   └── page.tsx                      ← Order detail page
│   │   └── _components/
│   │       ├── KanbanColumn.tsx
│   │       ├── OrderCard.tsx
│   │       └── OrderQuickSheet.tsx           ← Sheet для quick view
│   └── settings/
│       └── catalog/
│           └── page.tsx                      ← Кольори, ціни, принти
└── components/
    ├── page-header.tsx                       ← Існує, використовувати скрізь
    ├── empty-state.tsx                       ← Існує, використовувати скрізь
    ├── product-color-variants.tsx            ← Рефакторинг: Select + Switch
    └── catalog-categories.tsx               ← Логіка переноситься в CategoriesTab
```

---

## Component Design

### 1. Products List Page — `/products`

```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: "Товари"                        [+ Додати товар] │
├─────────────────────────────────────────────────────────────┤
│ [Товари] [Категорії]                                         │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Пошук...]  14 товарів          [Активні ▾]              │
│ [Всі] [Футболки ×] [Худі] [Шоппер]                          │
├──┬──┬────────────────────┬──────────┬──────┬────────┬───────┤
│  │◉ │ [img] Назва        │ Категорія│ Ціна │Кольори │       │
├──┼──┼────────────────────┼──────────┼──────┼────────┼───────┤
│⠿ │◉ │ [▪] Футболка базова│ Футболки │ ₴299 │ 4      │ ✏ 🗑  │
│  │  │   [Кастом]         │          │      │        │       │
└──┴──┴────────────────────┴──────────┴──────┴────────┴───────┘
```

**Компонент `ProductsTab`:**
```typescript
interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  onRefresh: () => void;
}

// Внутрішній стан (client-side фільтрація):
const [search, setSearch] = useState("");
const [categoryFilter, setCategoryFilter] = useState("");
const [statusFilter, setStatusFilter] = useState<"all"|"active"|"inactive">("all");

const filtered = useMemo(() => products
  .filter(p => !categoryFilter || p.category_id === categoryFilter)
  .filter(p => statusFilter === "all" || (statusFilter === "active" ? p.is_active : !p.is_active))
  .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase())),
  [products, categoryFilter, statusFilter, search]
);
```

**Компонент `ProductTableRow`:**
```typescript
// Thumbnail: перше зображення з product_images або images fallback
const thumbUrl = product.product_images?.[0]?.url
  ?? Object.values(product.images || {})[0];

// Рядок таблиці:
<TableRow className="group hover:bg-muted/40 cursor-pointer" onClick={() => router.push(`/products/${product.id}`)}>
  <TableCell onClick={e => e.stopPropagation()}> {/* drag handle */} </TableCell>
  <TableCell onClick={e => e.stopPropagation()}> {/* Switch toggle */} </TableCell>
  <TableCell>
    {thumbUrl
      ? <img src={thumbUrl} className="w-8 h-8 rounded border object-contain bg-white" />
      : <div className="w-8 h-8 rounded border bg-muted flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground/40" /></div>
    }
  </TableCell>
  <TableCell>
    <div className="flex items-center gap-2">
      <span className="font-medium text-sm">{product.name}</span>
      {product.is_customizable && <Badge variant="secondary" className="text-[10px] h-4">Кастом</Badge>}
      {!product.is_active && <span className="text-xs text-muted-foreground">· Неактивний</span>}
    </div>
  </TableCell>
  {/* ... category, price, color count, actions */}
</TableRow>
```

### 2. Product Detail Page — `/products/[id]` та `/products/new`

Обидві сторінки використовують спільний `<ProductForm>` компонент.

```
┌─────────────────────────────────────────────────────────────┐
│ ← Товари / Футболка базова              [Зберегти] [Видалити]│
├──────────────────────────────┬──────────────────────────────┤
│ ОСНОВНА ІНФОРМАЦІЯ           │                              │
│ ┌────────────────────────┐   │  Ціна (₴)                    │
│ │ Назва *                │   │  ┌──────────────────────┐    │
│ │ Футболка базова        │   │  │ ₴  299               │    │
│ └────────────────────────┘   │  └──────────────────────┘    │
│ slug: futbolka-bazova        │                              │
│                              │  [◉ Активний]                │
│ Категорія                    │  [◉ Кастомізація]            │
│ [Футболки ▾]                 │                              │
│                              │                              │
│ Опис                         │                              │
│ [textarea]                   │                              │
├──────────────────────────────┴──────────────────────────────┤
│ ФОТОГРАФІЇ                                                   │
│ <ProductImageManager />                                      │
├─────────────────────────────────────────────────────────────┤
│ РОЗМІРИ ТА ТАБЛИЦЯ                                          │
│ [Select існуючої ▾]  або редактор рядків                    │
├─────────────────────────────────────────────────────────────┤
│ ЗОНИ ДРУКУ  (тільки якщо is_customizable)                   │
│ [Передня частина] [Спина] [Рукав]                           │
├─────────────────────────────────────────────────────────────┤
│ ЗНИЖКИ ЗА КІЛЬКІСТЬ                                         │
│ [+ Рівень]  від 10 шт. → 5%  ×                              │
├─────────────────────────────────────────────────────────────┤
│ КОЛЬОРИ ТА ФОТО                                             │
│ <ProductColorVariantsList productId={id} />                 │
│ (inline, без окремого Dialog)                               │
└─────────────────────────────────────────────────────────────┘
```

**`ProductForm` компонент:**
```typescript
interface ProductFormProps {
  product?: Product;           // undefined = новий товар
  categories: Category[];
  sizeCharts: SizeChart[];
  printAreas: PrintArea[];
  onSave: (data: ProductFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

// Секції рендеряться як окремі <Card> компоненти
// Кожна секція — окремий файл у ProductFormSections/
// ColorsSection рендериться тільки при product?.id (після першого збереження)
```

**Breadcrumb + PageHeader:**
```typescript
<PageHeader
  eyebrow="Каталог"
  title={product ? product.name : "Новий товар"}
  actions={
    <>
      <Button variant="outline" onClick={() => router.push("/products")}>← Назад</Button>
      {product && <Button variant="destructive" size="sm" onClick={handleDelete}>Видалити</Button>}
      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Зберегти
      </Button>
    </>
  }
/>
```

### 3. Category Dialog — `<CategoryDialog>`

```typescript
// Dialog ≤5 полів — правильний патерн
interface CategoryDialogProps {
  category?: Category;   // undefined = нова
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// Поля: Назва, Slug (auto), Порядок, Активна (Switch), Зображення URL
// max-w-md — компактний Dialog
```

### 4. Orders Kanban — Quick Sheet

```
Kanban card click → <Sheet side="right" className="w-[480px]">
┌─────────────────────────────────────────┐
│ Замовлення #abc123          [×]          │
│ Іван Петренко · ivan@example.com         │
│ +380 67 123 4567                         │
├─────────────────────────────────────────┤
│ ТОВАРИ                                   │
│ • Футболка базова × 2  ₴598             │
│ • Худі класик × 1      ₴799             │
│ ─────────────────────────────           │
│ Разом: ₴1,397                           │
├─────────────────────────────────────────┤
│ СТАТУС                                   │
│ [Нове] [В роботі ●] [Виробництво]       │
│ [Готово] [Архів]                        │
├─────────────────────────────────────────┤
│ ТЕГИ                                     │
│ [терміново ×] [VIP ×] [+ Додати]        │
├─────────────────────────────────────────┤
│ НОТАТКИ                                  │
│ [textarea — read-only preview]           │
├─────────────────────────────────────────┤
│ [Відкрити повне замовлення →]           │
└─────────────────────────────────────────┘
```

**`OrderQuickSheet` компонент:**
```typescript
interface OrderQuickSheetProps {
  orderId: string | null;
  onClose: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
}
// Read-mostly: показує дані, дозволяє змінити статус і теги
// Для редагування контактів → посилання на /orders/[id]
```

### 5. Order Detail Page — `/orders/[id]`

```
┌─────────────────────────────────────────────────────────────┐
│ ← Замовлення / #abc123                    [Зберегти]        │
├──────────────────────────────┬──────────────────────────────┤
│ КОНТАКТНІ ДАНІ               │ СТАТУС                       │
│ Ім'я: [input]                │ [Select статусу ▾]           │
│ Email: [input]               │                              │
│ Телефон: [input]             │ ТЕГИ                         │
│ Компанія: [input]            │ [tag chips + add]            │
├──────────────────────────────┤                              │
│ ТОВАРИ                       │ НОТАТКИ                      │
│ [order items list]           │ [textarea]                   │
├──────────────────────────────┴──────────────────────────────┤
│ ПОВІДОМЛЕННЯ                                                 │
│ [messages thread]                                           │
└─────────────────────────────────────────────────────────────┘
```

### 6. Catalog Settings — `/settings/catalog`

```typescript
// Вертикальні вкладки (left nav):
// [Кольори] [Ціни друку] [Принти]
// Кожна секція — окремий компонент
// Матеріали: таблиця + Dialog для create/edit
// Ціни друку: PrintTypePricingManager (існує)
// Принти: PrintPresetsTab (існує)
```

### 7. `useProductsData` hook

```typescript
// apps/admin/src/app/(dashboard)/products/_components/useProductsData.ts
export function useProductsData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [printAreas, setPrintAreas] = useState<PrintArea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [p, cat, mat, sc, pa] = await Promise.all([
      fetch("/api/products").then(r => r.ok ? r.json() : []),
      fetch("/api/categories").then(r => r.ok ? r.json() : []),
      fetch("/api/materials").then(r => r.ok ? r.json() : []),
      fetch("/api/size-charts").then(r => r.ok ? r.json() : []),
      fetch("/api/print-areas").then(r => r.ok ? r.json() : []),
    ]);
    setProducts(p); setCategories(cat); setMaterials(mat);
    setSizeCharts(sc); setPrintAreas(pa);
    setLoading(false);
  }, []);

  const refreshProducts = useCallback(async () => {
    const r = await fetch("/api/products");
    if (r.ok) setProducts(await r.json());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { products, categories, materials, sizeCharts, printAreas, loading, refresh: fetchAll, refreshProducts };
}
```

---

## Consistency Patterns

### PageHeader — на кожній сторінці

```typescript
// List pages:
<PageHeader title="Товари" actions={<Button onClick={() => router.push("/products/new")}>+ Додати товар</Button>} />

// Detail pages:
<PageHeader
  eyebrow="Каталог"
  title={product.name}
  actions={<><Button variant="outline">← Назад</Button><Button>Зберегти</Button></>}
/>
```

### EmptyState — стандартні варіанти

```typescript
// Пошук без результатів:
<EmptyState icon={SearchX} title="Нічого не знайдено"
  description="Спробуйте змінити запит або скинути фільтри"
  action={<Button variant="outline" size="sm" onClick={reset}>Скинути фільтри</Button>} />

// Порожній список:
<EmptyState icon={Shirt} title="Товарів ще немає"
  action={<Button size="sm" onClick={() => router.push("/products/new")}>+ Додати товар</Button>} />
```

### Skeleton Loader

```typescript
function ProductsTableSkeleton() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {[4, 8, 8, 32, 16, 12, 12, 8].map((w, j) => (
        <TableCell key={j}>
          <div className={`h-4 w-${w} bg-muted rounded animate-pulse`} />
        </TableCell>
      ))}
    </TableRow>
  ));
}
```

### Відступи — стандарт

```typescript
// Сторінки з таблицями: таблиця на повну ширину, filter bar px-4
// Сторінки з картками/формами:
<div className="p-4 md:p-6 space-y-6">

// Секції на detail page:
<Card><CardHeader><CardTitle>Назва секції</CardTitle></CardHeader>
<CardContent className="space-y-4">...</CardContent></Card>

// Типографіка:
// text-sm — контент таблиць
// text-xs text-muted-foreground — метадані
// НЕ text-gray-500, НЕ text-neutral-500
```

---

## TypeScript Improvements

```typescript
// Розширити локальний тип Product:
interface Product {
  // ... існуючі поля
  product_images?: ProductImage[];  // замість (p as any).product_images
}

interface ProductColorVariant {
  // ... існуючі поля
  variant_images?: ProductImage[];  // замість (v as any).variant_images
}

// Realtime payload:
import type { Lead } from "@udo-craft/shared";
type RealtimeLeadPayload = { eventType: "INSERT"|"UPDATE"|"DELETE"; new: Lead; old: Partial<Lead> };

// PREDEFINED_TAGS:
import { PREDEFINED_TAGS } from "@udo-craft/shared"; // не перевизначати локально
```

---

## Correctness Properties (PBT)

### Property 1: Фільтрація — монотонність
```
∀ query, products: filterByName(products, query).length ≤ products.length
```

### Property 2: Пошук — case-insensitivity
```
∀ product, query: matchesSearch(product, query) === matchesSearch(product, query.toUpperCase())
```

### Property 3: Скидання фільтрів — повнота
```
∀ products: applyFilters(products, "", "all").length === products.length
```

### Property 4: Slug — ідемпотентність
```
∀ name: slugify(slugify(name)) === slugify(name)
```

### Property 5: Reorder — збереження елементів
```
∀ items, fromId, toId:
  reorder(items, fromId, toId).length === items.length
  ∧ new Set(reorder(items, fromId, toId).map(i => i.id)) deepEquals new Set(items.map(i => i.id))
```
