/**
 * Bug Condition Exploration Tests
 *
 * These tests run on UNFIXED code and are designed to confirm that each bug
 * condition described in the spec is observable. They do NOT fix anything.
 *
 * Expected outcomes on unfixed code:
 *  - C1 (PRINT_TYPES duplicate)   → PASS  (duplication confirmed — arrays are identical)
 *  - C1 (MockupViewer duplicate)  → PASS  (duplication confirmed — both files export MockupViewer)
 *  - C3a (native select)          → PASS  (bug confirmed — source contains native <select>)
 *  - C3b (hardcoded hex)          → PASS  (bug confirmed — #1B3BFF found in LayersPanel source)
 *  - C4a (permission stub)        → PASS  (bug confirmed — verifyPermission resolves without throwing)
 *  - C4b (missing Zod, client)    → PASS  (bug confirmed — no safeParse/CreateLeadSchema in source)
 *  - C4b (missing Zod, admin)     → PASS  (bug confirmed — no safeParse/CreateLeadSchema in source)
 *
 * After the fix is applied (Task 14 checkpoint), these tests will FAIL,
 * confirming the bugs have been resolved.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

// Resolve paths relative to the monorepo root (two levels up from packages/shared/src/__tests__)
const ROOT = resolve(__dirname, "../../../../");

function readSource(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf-8");
}

// ---------------------------------------------------------------------------
// C1 — Duplicate PRINT_TYPES
// ---------------------------------------------------------------------------
describe("C1 — Duplicate PRINT_TYPES", () => {
  it("PRINT_TYPES array exists in both apps and is identical (confirms duplication)", () => {
    const clientSource = readSource("apps/client/src/components/ProductCanvas.tsx");
    const adminSource = readSource("apps/admin/src/components/print-types.ts");

    // Extract the PRINT_TYPES array literal from each file
    function extractPrintTypes(source: string): string {
      const match = source.match(/export const PRINT_TYPES\s*=\s*(\[[\s\S]*?\])\s*as const/);
      if (!match) throw new Error("PRINT_TYPES not found in source");
      // Normalise whitespace for comparison
      return match[1].replace(/\s+/g, " ").trim();
    }

    const clientArray = extractPrintTypes(clientSource);
    const adminArray = extractPrintTypes(adminSource);

    // Both arrays should be present (confirming duplication exists)
    expect(clientArray).toBeTruthy();
    expect(adminArray).toBeTruthy();

    // They should be identical (confirming the duplicate is in sync — the bug condition)
    expect(clientArray).toEqual(adminArray);

    // Counterexample: PRINT_TYPES is defined in TWO separate files with no shared package home
    console.log("Counterexample C1-PRINT_TYPES: identical array found in both:");
    console.log("  apps/client/src/components/ProductCanvas.tsx");
    console.log("  apps/admin/src/components/print-types.ts");
  });
});

// ---------------------------------------------------------------------------
// C1 — Duplicate MockupViewer
// ---------------------------------------------------------------------------
describe("C1 — Duplicate MockupViewer", () => {
  it("MockupViewer is exported from both apps with no shared package home (confirms duplication)", () => {
    const clientSource = readSource("apps/client/src/components/MockupViewer.tsx");
    const adminSource = readSource("apps/admin/src/components/mockup-viewer.tsx");

    // Both files should export MockupViewer
    expect(clientSource).toMatch(/export function MockupViewer/);
    expect(adminSource).toMatch(/export function MockupViewer/);

    // Both files should NOT import from @udo-craft/ui (no shared home yet)
    expect(clientSource).not.toMatch(/@udo-craft\/ui/);
    expect(adminSource).not.toMatch(/@udo-craft\/ui/);

    // Both files should define the same props interface shape
    expect(clientSource).toMatch(/interface MockupViewerProps/);
    expect(adminSource).toMatch(/interface MockupViewerProps/);

    // Both should have the same key structural features (lg layout, toggle buttons)
    expect(clientSource).toMatch(/size === "lg"/);
    expect(adminSource).toMatch(/size === "lg"/);

    // Counterexample: MockupViewer defined in two separate files, not in @udo-craft/ui
    console.log("Counterexample C1-MockupViewer: component defined in both:");
    console.log("  apps/client/src/components/MockupViewer.tsx");
    console.log("  apps/admin/src/components/mockup-viewer.tsx");
    console.log("  Neither imports from @udo-craft/ui");
  });
});

// ---------------------------------------------------------------------------
// C3a — Native <select> in LayersPanel
// ---------------------------------------------------------------------------
describe("C3a — Native select in LayersPanel", () => {
  it("LayersPanel source contains native <select> elements (confirms UI inconsistency bug)", () => {
    const source = readSource("apps/client/src/components/LayersPanel.tsx");

    // Count occurrences of native <select in the source
    const nativeSelectMatches = source.match(/<select\b/g) ?? [];
    const count = nativeSelectMatches.length;

    // On unfixed code, there are 2 native selects (print type + size label)
    expect(count).toBeGreaterThan(0);

    // Also confirm Shadcn Select is NOT used (no shared package import)
    expect(source).not.toMatch(/from "@\/components\/ui\/select"/);

    // Counterexample: found native <select> elements
    console.log(`Counterexample C3a-NativeSelect: found ${count} native <select> element(s) in LayersPanel.tsx`);
    console.log("  Expected: Shadcn <Select> from @/components/ui/select");
    console.log("  Actual: native HTML <select> elements");
  });
});

// ---------------------------------------------------------------------------
// C3b — Hardcoded hex #1B3BFF in LayersPanel
// ---------------------------------------------------------------------------
describe("C3b — Hardcoded hex in LayersPanel", () => {
  it("LayersPanel source contains hardcoded #1B3BFF hex color (confirms theme bypass bug)", () => {
    const source = readSource("apps/client/src/components/LayersPanel.tsx");

    // The hex should appear in the touch ghost cssText
    expect(source).toMatch(/#1B3BFF/i);

    // Confirm it's in the touch ghost context
    expect(source).toMatch(/ghost\.style\.cssText[\s\S]*?#1B3BFF/);

    // Counterexample: hardcoded hex found
    const lineNumber = source.split("\n").findIndex((l) => l.includes("#1B3BFF")) + 1;
    console.log(`Counterexample C3b-HardcodedHex: #1B3BFF found at line ~${lineNumber} in LayersPanel.tsx`);
    console.log("  Expected: var(--color-primary) or Tailwind primary token");
    console.log("  Actual: hardcoded hex #1B3BFF in ghost.style.cssText");
  });
});

// ---------------------------------------------------------------------------
// C4a — Permission stub always true
// ---------------------------------------------------------------------------
describe("C4a — Permission stub always true", () => {
  it("verifyPermission source contains hardcoded 'true' stub (confirms unimplemented permission check)", () => {
    const source = readSource("apps/admin/src/lib/api/errors.ts");

    // The function should exist on unfixed code
    expect(source).toMatch(/export async function verifyPermission/);

    // The stub pattern: hasPermission is hardcoded to true with a TODO comment
    expect(source).toMatch(/const hasPermission\s*=\s*true/);
    expect(source).toMatch(/TODO.*[Ii]mplement/);

    // The function never actually throws ForbiddenError because hasPermission is always true
    // Confirm the throw is guarded by the always-true variable
    expect(source).toMatch(/if \(!hasPermission\)/);

    // Counterexample: verifyPermission always grants access
    const stubLine = source.split("\n").findIndex((l) => l.includes("const hasPermission = true")) + 1;
    console.log(`Counterexample C4a-PermissionStub: found at line ~${stubLine} in apps/admin/src/lib/api/errors.ts`);
    console.log("  Expected: actual Supabase role check or function removed entirely");
    console.log("  Actual: const hasPermission = true; // TODO: Implement actual permission check");
  });
});

// ---------------------------------------------------------------------------
// C4b — Missing Zod validation in client /api/leads POST handler
// ---------------------------------------------------------------------------
describe("C4b — Missing Zod validation (client leads route)", () => {
  it("client leads route.ts does NOT contain safeParse or CreateLeadSchema (confirms missing validation)", () => {
    const source = readSource("apps/client/src/app/api/leads/route.ts");

    // On unfixed code, neither safeParse nor CreateLeadSchema should be present
    expect(source).not.toMatch(/safeParse/);
    expect(source).not.toMatch(/CreateLeadSchema/);

    // Confirm the loose check is present instead (the current "validation")
    expect(source).toMatch(/if \(!status \|\| !customer_data\)/);

    // Counterexample: no Zod validation found
    console.log("Counterexample C4b-MissingZod (client): apps/client/src/app/api/leads/route.ts");
    console.log("  Expected: CreateLeadSchema.safeParse(body) with structured error response");
    console.log("  Actual: loose !status || !customer_data check, no Zod schema validation");
  });
});

// ---------------------------------------------------------------------------
// C4b — Missing Zod validation in admin /api/leads POST handler
// ---------------------------------------------------------------------------
describe("C4b — Missing Zod validation (admin leads route)", () => {
  it("admin leads route.ts does NOT contain safeParse or CreateLeadSchema (confirms missing validation)", () => {
    const source = readSource("apps/admin/src/app/api/leads/route.ts");

    // On unfixed code, neither safeParse nor CreateLeadSchema should be present
    expect(source).not.toMatch(/safeParse/);
    expect(source).not.toMatch(/CreateLeadSchema/);

    // Confirm the loose check is present instead
    expect(source).toMatch(/if \(!status \|\| !customer_data/);

    // Counterexample: no Zod validation found
    console.log("Counterexample C4b-MissingZod (admin): apps/admin/src/app/api/leads/route.ts");
    console.log("  Expected: CreateLeadSchema.safeParse(body) with structured error response");
    console.log("  Actual: loose !status || !customer_data check, no Zod schema validation");
  });
});
