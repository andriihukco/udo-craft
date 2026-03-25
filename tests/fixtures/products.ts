import { faker } from '@faker-js/faker';
import type { Product, PrintZone } from '@udo-craft/shared';

/**
 * Creates a mock Product object with sensible defaults.
 * Override any field by passing partial overrides.
 */
export function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    slug: faker.helpers.slugify(faker.commerce.productName()).toLowerCase(),
    base_price_cents: faker.number.int({ min: 500, max: 50000 }),
    images: { front: faker.image.url(), back: faker.image.url() },
    px_to_mm_ratio: 0.5,
    collar_y_px: faker.number.int({ min: 50, max: 200 }),
    is_active: true,
    is_customizable: true,
    available_sizes: ['S', 'M', 'L', 'XL'],
    ...overrides,
  };
}

/**
 * Creates a mock PrintZone object for a given product ID.
 */
export function createMockPrintZone(
  productId: string,
  overrides: Partial<PrintZone> = {}
): PrintZone {
  return {
    id: faker.string.uuid(),
    product_id: productId,
    side: 'front',
    x: 200,
    y: 150,
    width: 400,
    height: 300,
    ...overrides,
  };
}

// ─── Boundary Value Datasets ────────────────────────────────────

export const PRODUCT_BOUNDARY_DATA = {
  zeroPriceCents: createMockProduct({ base_price_cents: 0 }),
  maxPriceCents: createMockProduct({ base_price_cents: 9999999 }),
  emptyImages: createMockProduct({ images: {} as Record<string, string> }),
  noSizes: createMockProduct({ available_sizes: [] }),
  singleSize: createMockProduct({ available_sizes: ['ONESIZE'] }),
  inactiveProduct: createMockProduct({ is_active: false }),
  nonCustomizable: createMockProduct({ is_customizable: false }),
  longName: createMockProduct({ name: 'A'.repeat(500) }),
  unicodeName: createMockProduct({ name: 'Футболка «Кирилиця» 日本語 🎨' }),
  zeroRatio: createMockProduct({ px_to_mm_ratio: 0 }),
  negativeCollar: createMockProduct({ collar_y_px: -10 }),
};

export const PRINT_ZONE_EDGE_CASES = {
  zeroDimensions: createMockPrintZone('test-uuid', { width: 0, height: 0 }),
  negativeDimensions: createMockPrintZone('test-uuid', { width: -10, height: -5 }),
  maxDimensions: createMockPrintZone('test-uuid', { width: 99999, height: 99999 }),
  negativePosition: createMockPrintZone('test-uuid', { x: -50, y: -50 }),
};
