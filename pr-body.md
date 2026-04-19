Staging verified (both admin and client Ready on Vercel preview).

Changes:
- Tailwind v4 migration (admin + client)
- Catalog restructure: /catalog (Товари, Категорії, Кольори, Розміри) + /prints (Принти, Типи друку, Розміри друку)
- Size chart grid: full CRUD in admin catalog, modal viewer on client product page
- Product form improvements: working selects, size chip picker, print zones
- Sidebar nav synced with catalog tabs
- Fix: @tiptap/core + @tiptap/pm added as root deps (novel peer deps)
- Fix: product creation null constraint (images, px_to_mm_ratio, collar_y_px)
- Various UI consistency fixes
