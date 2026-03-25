import { describe, it, expect } from 'vitest';
import {
  ProductSchema,
  PrintZoneSchema,
  LeadSchema,
  OrderItemSchema,
  LeadStatusEnum,
  PrintZoneSideEnum,
} from '../index';

// ─── ProductSchema ──────────────────────────────────────────────

describe('ProductSchema', () => {
  const validProduct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Classic Hoodie',
    slug: 'classic-hoodie',
    base_price_cents: 2999,
    images: { front: 'https://example.com/front.png', back: 'https://example.com/back.png' },
    px_to_mm_ratio: 0.5,
    collar_y_px: 120,
    is_active: true,
    is_customizable: true,
    available_sizes: ['S', 'M', 'L', 'XL'],
  };

  it('validates a complete product', () => {
    expect(() => ProductSchema.parse(validProduct)).not.toThrow();
  });

  it('rejects missing required name', () => {
    const { name, ...noName } = validProduct;
    expect(() => ProductSchema.parse(noName)).toThrow();
  });

  it('rejects missing required slug', () => {
    const { slug, ...noSlug } = validProduct;
    expect(() => ProductSchema.parse(noSlug)).toThrow();
  });

  it('rejects missing required base_price_cents', () => {
    const { base_price_cents, ...noPrice } = validProduct;
    expect(() => ProductSchema.parse(noPrice)).toThrow();
  });

  it('rejects non-integer price', () => {
    expect(() =>
      ProductSchema.parse({ ...validProduct, base_price_cents: 29.99 })
    ).toThrow();
  });

  it('rejects invalid UUID id', () => {
    expect(() =>
      ProductSchema.parse({ ...validProduct, id: 'not-a-uuid' })
    ).toThrow();
  });

  it('applies default for is_active when undefined', () => {
    const { is_active, ...partial } = validProduct;
    const result = ProductSchema.parse(partial);
    expect(result.is_active).toBe(true);
  });

  it('applies default for is_customizable when undefined', () => {
    const { is_customizable, ...partial } = validProduct;
    const result = ProductSchema.parse(partial);
    expect(result.is_customizable).toBe(false);
  });

  it('applies default available_sizes when undefined', () => {
    const { available_sizes, ...partial } = validProduct;
    const result = ProductSchema.parse(partial);
    expect(result.available_sizes).toEqual(['S', 'M', 'L', 'XL']);
  });

  it('accepts empty sizes array', () => {
    expect(() =>
      ProductSchema.parse({ ...validProduct, available_sizes: [] })
    ).not.toThrow();
  });

  it('accepts empty images object', () => {
    expect(() =>
      ProductSchema.parse({ ...validProduct, images: {} })
    ).not.toThrow();
  });

  it('rejects entirely empty object', () => {
    expect(() => ProductSchema.parse({})).toThrow();
  });

  it('accepts zero price (no minimum validation)', () => {
    expect(() =>
      ProductSchema.parse({ ...validProduct, base_price_cents: 0 })
    ).not.toThrow();
  });

  it('accepts unicode product names', () => {
    expect(() =>
      ProductSchema.parse({ ...validProduct, name: 'Футболка «Кирилиця» 日本語 🎨' })
    ).not.toThrow();
  });
});

// ─── PrintZoneSchema ────────────────────────────────────────────

describe('PrintZoneSchema', () => {
  const validZone = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    product_id: '550e8400-e29b-41d4-a716-446655440000',
    side: 'front' as const,
    x: 200,
    y: 150,
    width: 400,
    height: 300,
  };

  it('validates a complete print zone', () => {
    expect(() => PrintZoneSchema.parse(validZone)).not.toThrow();
  });

  it('accepts "back" side', () => {
    expect(() =>
      PrintZoneSchema.parse({ ...validZone, side: 'back' })
    ).not.toThrow();
  });

  it('rejects invalid side', () => {
    expect(() =>
      PrintZoneSchema.parse({ ...validZone, side: 'top' })
    ).toThrow();
  });

  it('rejects non-integer dimensions', () => {
    expect(() =>
      PrintZoneSchema.parse({ ...validZone, width: 100.5 })
    ).toThrow();
  });

  it('rejects missing product_id', () => {
    const { product_id, ...noProductId } = validZone;
    expect(() => PrintZoneSchema.parse(noProductId)).toThrow();
  });

  it('accepts zero dimensions (no minimum validation — potential gap)', () => {
    expect(() =>
      PrintZoneSchema.parse({ ...validZone, width: 0, height: 0 })
    ).not.toThrow();
  });

  it('accepts negative positions (no minimum validation — potential gap)', () => {
    expect(() =>
      PrintZoneSchema.parse({ ...validZone, x: -50, y: -50 })
    ).not.toThrow();
  });
});

// ─── LeadSchema ─────────────────────────────────────────────────

describe('LeadSchema', () => {
  const validLead = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    status: 'new' as const,
    customer_data: {
      name: 'Іван Петренко',
      email: 'ivan@example.com',
      social_channel: 'https://t.me/ivan',
    },
    total_amount_cents: 50000,
  };

  it('validates a complete lead', () => {
    expect(() => LeadSchema.parse(validLead)).not.toThrow();
  });

  it('rejects missing customer name', () => {
    expect(() =>
      LeadSchema.parse({
        ...validLead,
        customer_data: { email: 'test@test.com' },
      })
    ).toThrow();
  });

  it('rejects missing customer email', () => {
    expect(() =>
      LeadSchema.parse({
        ...validLead,
        customer_data: { name: 'Test' },
      })
    ).toThrow();
  });

  it('rejects invalid email format', () => {
    expect(() =>
      LeadSchema.parse({
        ...validLead,
        customer_data: { name: 'Test', email: 'not-an-email' },
      })
    ).toThrow();
  });

  it('allows optional social_channel', () => {
    const lead = {
      ...validLead,
      customer_data: { name: 'Test', email: 'test@example.com' },
    };
    expect(() => LeadSchema.parse(lead)).not.toThrow();
  });

  it('rejects invalid social_channel URL', () => {
    expect(() =>
      LeadSchema.parse({
        ...validLead,
        customer_data: {
          name: 'Test',
          email: 'test@example.com',
          social_channel: 'not-a-url',
        },
      })
    ).toThrow();
  });

  it('rejects non-integer total_amount_cents', () => {
    expect(() =>
      LeadSchema.parse({ ...validLead, total_amount_cents: 100.5 })
    ).toThrow();
  });
});

// ─── OrderItemSchema ────────────────────────────────────────────

describe('OrderItemSchema', () => {
  const validItem = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    lead_id: '550e8400-e29b-41d4-a716-446655440002',
    product_id: '550e8400-e29b-41d4-a716-446655440000',
    size: 'M',
    color: 'black',
    quantity: 50,
  };

  it('validates a complete order item', () => {
    expect(() => OrderItemSchema.parse(validItem)).not.toThrow();
  });

  it('rejects quantity of 0', () => {
    expect(() =>
      OrderItemSchema.parse({ ...validItem, quantity: 0 })
    ).toThrow();
  });

  it('rejects negative quantity', () => {
    expect(() =>
      OrderItemSchema.parse({ ...validItem, quantity: -5 })
    ).toThrow();
  });

  it('rejects non-integer quantity', () => {
    expect(() =>
      OrderItemSchema.parse({ ...validItem, quantity: 2.5 })
    ).toThrow();
  });

  it('validates with technical_metadata', () => {
    const itemWithMeta = {
      ...validItem,
      technical_metadata: {
        offset_top_mm: 120,
        print_size_mm: [250, 300] as [number, number],
      },
    };
    expect(() => OrderItemSchema.parse(itemWithMeta)).not.toThrow();
  });

  it('rejects invalid print_size_mm tuple (1 element)', () => {
    expect(() =>
      OrderItemSchema.parse({
        ...validItem,
        technical_metadata: {
          offset_top_mm: 120,
          print_size_mm: [250],
        },
      })
    ).toThrow();
  });

  it('rejects invalid print_size_mm tuple (3 elements)', () => {
    expect(() =>
      OrderItemSchema.parse({
        ...validItem,
        technical_metadata: {
          offset_top_mm: 120,
          print_size_mm: [250, 300, 400],
        },
      })
    ).toThrow();
  });

  it('allows optional custom_print_url', () => {
    expect(() =>
      OrderItemSchema.parse({
        ...validItem,
        custom_print_url: 'https://example.com/print.png',
      })
    ).not.toThrow();
  });

  it('rejects invalid custom_print_url', () => {
    expect(() =>
      OrderItemSchema.parse({
        ...validItem,
        custom_print_url: 'not-a-url',
      })
    ).toThrow();
  });

  it('allows optional mockup_url', () => {
    expect(() =>
      OrderItemSchema.parse({
        ...validItem,
        mockup_url: 'https://example.com/mockup.png',
      })
    ).not.toThrow();
  });
});

// ─── Enums ──────────────────────────────────────────────────────

describe('LeadStatusEnum', () => {
  it.each(['new', 'in_progress', 'production', 'completed', 'archived'])(
    'accepts valid status: %s',
    (status) => {
      expect(() => LeadStatusEnum.parse(status)).not.toThrow();
    }
  );

  it.each(['cancelled', 'pending', 'deleted', ''])(
    'rejects invalid status: %s',
    (status) => {
      expect(() => LeadStatusEnum.parse(status)).toThrow();
    }
  );

  it('rejects null', () => {
    expect(() => LeadStatusEnum.parse(null)).toThrow();
  });

  it('rejects undefined', () => {
    expect(() => LeadStatusEnum.parse(undefined)).toThrow();
  });
});

describe('PrintZoneSideEnum', () => {
  it.each(['front', 'back'])('accepts valid side: %s', (side) => {
    expect(() => PrintZoneSideEnum.parse(side)).not.toThrow();
  });

  it.each(['top', 'bottom', 'left', 'right', ''])(
    'rejects invalid side: %s',
    (side) => {
      expect(() => PrintZoneSideEnum.parse(side)).toThrow();
    }
  );
});
