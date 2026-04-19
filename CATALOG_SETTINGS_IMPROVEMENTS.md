# Catalog Settings Improvements

## Summary
Enhanced the catalog settings page with better organization, print type management, and improved discount visualization.

## Changes Made

### 1. Nested Tab Structure
**File**: `apps/admin/src/components/print-type-pricing-manager.tsx`

Three main tabs for better organization:
- **Ціни друку** (Print Pricing) - Manage pricing for each print type
- **Типи друку** (Print Types) - Edit and disable print types
- **Знижки** (Discounts) - View discount tiers

### 2. Print Types Management
**New Section**: `PrintTypesSection()`

Features:
- **View all print types** in a grid layout (2 columns on desktop)
- **Edit print types**: Change label, description, and color
- **Enable/Disable**: Toggle visibility with Eye/EyeOff icons
- **Visual indicators**: Color swatch preview for each type
- **Modal editing**: Clean dialog for editing print type details

Print types included:
- DTF / Принт (Direct-to-Film printing)
- Вишивка (Embroidery)
- Шовкодрук (Screen printing)
- Сублімація (Sublimation)
- Нашивка (Patch/Appliqué)

### 3. Discount Chart Visualization
**New Section**: `DiscountChartSection()`

Features:
- **Clear table layout** showing all discount tiers
- **Visual discount badges** with percentage in colored boxes
- **Price examples** showing original vs. discounted price
- **Quantity ranges** with infinity symbol for unlimited
- **Informational note** explaining automatic discount application

Discount tiers:
- 1-9 units: 0% (no discount)
- 10-49 units: 5% discount
- 50-99 units: 12% discount
- 100+ units: 15% discount

### 4. Print Pricing Tab (Enhanced)
**Existing functionality improved**:
- Nested print type selector (color-coded buttons)
- Table layout with active toggle
- Inline quantity tier display
- Edit/Delete actions on hover
- Modal editing for detailed changes

### 5. Better Nested Structure
**Layout hierarchy**:
```
Catalog Settings
├── Tab 1: Print Pricing
│   ├── Print Type Selector (color buttons)
│   └── Pricing Table
│       ├── Active Toggle
│       ├── Size Label
│       ├── Size Range
│       ├── Quantity Tiers
│       └── Actions (Edit, Delete)
├── Tab 2: Print Types
│   └── Print Type Cards (Grid)
│       ├── Color Indicator
│       ├── Label & Description
│       ├── Toggle (Eye/EyeOff)
│       └── Edit Button
└── Tab 3: Discounts
    └── Discount Table
        ├── Quantity Range
        ├── Discount Percentage
        └── Price Example
```

## UI Components Used

- **Tabs**: Custom horizontal tab navigation
- **Cards**: Print type display in grid
- **Table**: Pricing and discount data
- **Dialog**: Modal editing for print types and pricing
- **AlertDialog**: Confirmation for deletions
- **Switch**: Active/Inactive toggles
- **Button**: Actions and navigation
- **Input**: Text and number inputs

## State Management

### PrintTypePricingManager (Main)
- `activeTab`: Current tab selection
- `activeType`: Selected print type for pricing
- `rows`: Pricing rows for active type
- `editingRow`: Row being edited
- `editDialogOpen`: Edit dialog visibility
- `deleteTarget`: Row marked for deletion

### PrintTypesSection
- `printTypes`: List of print types
- `editingType`: Type being edited
- `editDialogOpen`: Edit dialog visibility

## API Integration

### Print Pricing
- `GET /api/print-type-pricing?print_type={type}` - Fetch pricing rows
- `PUT /api/print-type-pricing/{id}` - Update pricing row
- `DELETE /api/print-type-pricing/{id}` - Delete pricing row
- `POST /api/print-type-pricing` - Create new pricing row

### Print Types
- Currently managed in-memory (can be extended to API)

## Build Status
✅ Admin app builds successfully
✅ All components render correctly
✅ No TypeScript errors
✅ Responsive design (mobile & desktop)

## User Experience Improvements

1. **Better Organization**: Three clear sections for different concerns
2. **Visual Hierarchy**: Color-coded print types for quick identification
3. **Inline Editing**: Modal dialogs for detailed edits without page navigation
4. **Clear Pricing**: Discount table shows real-world examples
5. **Accessibility**: Proper labels, ARIA attributes, and keyboard navigation
6. **Responsive**: Works on mobile and desktop screens
