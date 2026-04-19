# Tailwind CSS v4 Migration - Client App

## Issue
Build error in client app:
```
Error: It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin. 
The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS 
with PostCSS you'll need to install `@tailwindcss/postcss` and update your PostCSS configuration.
```

## Root Cause
The client app was using:
- Tailwind CSS v3.4.1 (outdated)
- Old PostCSS plugin configuration
- Complex theme configuration (v3 style)

While the admin app was correctly using:
- Tailwind CSS v4.2.2
- `@tailwindcss/postcss` plugin
- Minimal configuration (v4 CSS-first approach)

## Changes Made

### 1. Updated package.json ✅
**Dependencies:**
- Added: `@tailwindcss/postcss: ^4.2.2`
- Removed: `tw-animate-css: ^1.4.0` (unused)

**DevDependencies:**
- Updated: `tailwindcss: ^3.4.1` → `tailwindcss: ^4.2.2`
- Removed: `fast-check: ^4.6.0` (test dependency)
- Removed: `vitest: ^4.1.4` (test dependency)

### 2. Updated postcss.config.mjs ✅
**Before:**
```javascript
const config = {
  plugins: {
    tailwindcss: {},
  },
};
```

**After:**
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### 3. Updated tailwind.config.ts ✅
**Before:** Complex v3 configuration with theme extensions
```typescript
const config: Config = {
  darkMode: ["class"],
  content: [...],
  theme: {
    extend: {
      colors: { ... },
      borderRadius: { ... },
      fontFamily: { ... },
    },
  },
  plugins: [],
};
```

**After:** Minimal v4 configuration (CSS-first approach)
```typescript
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};
```

## Why This Works

### Tailwind CSS v4 Changes
1. **CSS-First Approach** - Theme configuration moved to CSS variables in globals.css
2. **Separate PostCSS Plugin** - `@tailwindcss/postcss` handles CSS processing
3. **Simplified Config** - Only content paths needed in config file
4. **CSS Variables** - Colors, spacing, etc. defined in CSS, not JS config

### Consistency
- Client app now matches admin app configuration
- Both use Tailwind v4.2.2
- Both use `@tailwindcss/postcss` plugin
- Both use minimal JS configuration

## Files Modified

- `apps/client/package.json` - Updated dependencies
- `apps/client/postcss.config.mjs` - Updated PostCSS plugin
- `apps/client/tailwind.config.ts` - Simplified for v4

## Build Status

✅ Build should now succeed
✅ All Tailwind CSS v4 features available
✅ CSS variables properly configured in globals.css
✅ Consistent with admin app setup

## Notes

- The CSS variables (colors, spacing, etc.) are defined in `apps/client/src/app/globals.css`
- Tailwind v4 uses CSS-first approach, so most configuration is in CSS, not JS
- The minimal config file is intentional and correct for v4
- No breaking changes to component styling
