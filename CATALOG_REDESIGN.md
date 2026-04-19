# Catalog Redesign - Separate Pages Structure

## Overview
Redesigned the catalog settings to follow a standard, modular structure with separate pages for each concern instead of nested tabs.

## New Structure

```
/catalog                          → Main catalog hub
├── /colors                       → Materials/Colors management
├── /categories                   → Product categories
├── /products                     → Product catalog
├── /print-sizes                  → Print size configuration
└── /print-types                  → Print types & discounts
```

## Pages Created

### 1. Catalog Hub (`/catalog`)
**File**: `apps/admin/src/app/(dashboard)/catalog/page.tsx`

- **Purpose**: Central navigation for all catalog sections
- **Layout**: Grid of 5 cards with icons and descriptions
- **Features**:
  - Visual card layout with hover effects
  - Icon indicators for each section
  - Direct navigation to each subsection
  - Responsive design (1 column mobile, 2 columns desktop)

### 2. Colors/Materials (`/catalog/colors`)
**File**: `apps/admin/src/app/(dashboard)/catalog/colors/page.tsx`

- **Purpose**: Manage material colors and swatches
- **Features**:
  - Table layout with drag-and-drop reordering
  - Active/Inactive toggle per color
  - Color preview swatch
  - Edit/Delete actions
  - Modal dialog for editing
  - Confirmation dialog for deletion

### 3. Print Types & Discounts (`/catalog/print-types`)
**File**: `apps/admin/src/app/(dashboard)/catalog/print-types/page.tsx`

- **Purpose**: Manage print types and discount tiers
- **Sections**:
  - **Print Types**: Grid of cards showing all print types
    - Edit label, description, color
    - Enable/Disable toggle (Eye/EyeOff icons)
    - Modal editing dialog
  - **Discounts**: Table showing all discount tiers
    - Quantity ranges
    - Discount percentages
    - Price examples

### 4. Categories (`/catalog/categories`)
**File**: `apps/admin/src/app/(dashboard)/catalog/categories/page.tsx`

- **Purpose**: Placeholder for category management
- **Status**: Ready for implementation

### 5. Products (`/catalog/products`)
**File**: `apps/admin/src/app/(dashboard)/catalog/products/page.tsx`

- **Purpose**: Placeholder for product catalog management
- **Status**: Ready for implementation

### 6. Print Sizes (`/catalog/print-sizes`)
**File**: `apps/admin/src/app/(dashboard)/catalog/print-sizes/page.tsx`

- **Purpose**: Placeholder for print size configuration
- **Status**: Ready for implementation

## Design Principles

1. **Separation of Concerns**: Each section has its own page
2. **Standard Flow**: Consistent navigation and layout across all pages
3. **Clear Hierarchy**: Hub page → Detail pages
4. **Modular**: Easy to add/remove sections
5. **Responsive**: Works on mobile and desktop
6. **Accessible**: Proper labels, ARIA attributes, keyboard navigation

## Navigation

Users can access catalog sections via:
1. **Main Navigation**: Click "Каталог" in sidebar (if added)
2. **Hub Page**: `/catalog` shows all sections
3. **Direct URLs**: `/catalog/colors`, `/catalog/print-types`, etc.

## Components Used

- **PageHeader**: Consistent page titles
- **Table**: Data display with sorting/filtering
- **Card**: Section cards on hub page
- **Dialog**: Modal editing
- **AlertDialog**: Confirmation dialogs
- **Switch**: Toggle controls
- **Button**: Actions

## State Management

Each page manages its own state:
- `materials`: Color list
- `printTypes`: Print type list
- `editingItem`: Currently edited item
- `deleteTarget`: Item marked for deletion
- `modalOpen`: Dialog visibility

## API Integration

### Colors/Materials
- `GET /api/materials` - Fetch all materials
- `POST /api/materials` - Create material
- `PATCH /api/materials/{id}` - Update material
- `DELETE /api/materials/{id}` - Delete material

### Print Types
- Currently managed in-memory (can be extended to API)

## Build Status

✅ New pages created with no TypeScript errors
✅ Responsive design implemented
✅ Navigation structure ready
⏳ Full build pending (existing TypeScript errors in other files)

## Next Steps

1. Implement categories page
2. Implement products page
3. Implement print sizes page
4. Add navigation link in sidebar
5. Fix existing TypeScript errors in other files
6. Test all pages in browser
