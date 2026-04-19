# Admin UI Improvements

## Summary
Fixed multiple UI/UX issues in the admin dashboard to improve consistency and functionality.

## Changes Made

### 1. Catalog Settings Layout - Horizontal Tabs
**File**: `apps/admin/src/app/(dashboard)/settings/catalog/page.tsx`

- **Before**: Vertical sidebar navigation with left panel
- **After**: Horizontal tab bar (matching products page layout)
- Tabs: Кольори, Ціни друку, Принти
- Consistent with the products page navigation pattern
- Better use of screen space

### 2. Print Pricing Manager - Table Layout
**File**: `apps/admin/src/components/print-type-pricing-manager.tsx`

- **Before**: Expandable card-based layout with inline editing
- **After**: Clean table layout with modal editing
- Features:
  - Active toggle (Switch) for each pricing row
  - Consistent table styling with other admin pages
  - Edit button opens modal dialog for detailed editing
  - Delete confirmation via AlertDialog
  - Print type color-coded tabs at top
  - Quantity tiers displayed inline in table
  - Hover actions (Edit, Delete buttons)

### 3. Materials Drag & Drop Fix
**File**: `apps/admin/src/app/(dashboard)/settings/catalog/page.tsx`

- **Fixed**: Drag and drop event handling
- Added `onDragLeave` handler to properly clear drag state
- Added `onDragEnd` handler to reset drag state
- Improved visual feedback with `bg-primary/5` background on drag over
- Added `cursor-move` class to table rows
- Better event prevention with `e.preventDefault()` in onDrop

## UI Consistency Improvements

### Print Pricing Table
- **Active Toggle**: Switch component in first column (consistent with materials table)
- **Size Label**: Clickable to open edit dialog
- **Range**: Shows min-max cm values
- **Tiers**: Displays all quantity tiers inline (e.g., "1 шт → 100 ₴, 10 шт → 80 ₴")
- **Actions**: Edit and Delete buttons appear on hover
- **Header**: Clear section title with description

### Materials Table (Existing)
- Drag handle with GripVertical icon
- Active toggle (Switch)
- Color swatch preview
- Name (clickable to edit)
- HEX code
- Edit/Delete actions on hover

## Technical Details

### New Components
- `PrintPricingSection()`: Wrapper component for print pricing manager
- `EditDialog()`: Modal for editing pricing rows with quantity tiers editor
- `QtyTiersEditor()`: Reusable component for managing quantity tiers

### State Management
- `editingRow`: Currently selected row for editing
- `editDialogOpen`: Controls edit dialog visibility
- `deleteTarget`: Row marked for deletion
- `activeType`: Currently selected print type

### API Integration
- `GET /api/print-type-pricing?print_type={type}`: Fetch pricing rows
- `PUT /api/print-type-pricing/{id}`: Update pricing row
- `DELETE /api/print-type-pricing/{id}`: Delete pricing row
- `POST /api/print-type-pricing`: Create new pricing row

## Build Status
✅ Admin app builds successfully with all changes
✅ No TypeScript errors
✅ All imports resolved correctly
