import { faker } from '@faker-js/faker';
import type { Lead, OrderItem, LeadStatus } from '@udo-craft/shared';

/**
 * Creates a mock Lead object with sensible defaults.
 */
export function createMockLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: faker.string.uuid(),
    status: 'new',
    customer_data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      social_channel: faker.internet.url(),
    },
    total_amount_cents: faker.number.int({ min: 1000, max: 500000 }),
    ...overrides,
  };
}

/**
 * Creates a mock OrderItem object for a given lead ID.
 */
export function createMockOrderItem(
  leadId: string,
  overrides: Partial<OrderItem> = {}
): OrderItem {
  return {
    id: faker.string.uuid(),
    lead_id: leadId,
    product_id: faker.string.uuid(),
    size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL']),
    color: faker.helpers.arrayElement(['black', 'white', 'gray', 'navy']),
    quantity: faker.number.int({ min: 1, max: 500 }),
    custom_print_url: faker.image.url(),
    mockup_url: faker.image.url(),
    technical_metadata: {
      offset_top_mm: faker.number.float({ min: 0, max: 300 }),
      print_size_mm: [
        faker.number.float({ min: 50, max: 400 }),
        faker.number.float({ min: 50, max: 500 }),
      ],
    },
    ...overrides,
  };
}

// ─── Parameterized Status Transitions ────────────────────────────

export const VALID_STATUS_TRANSITIONS: [LeadStatus, LeadStatus][] = [
  ['new', 'in_progress'],
  ['in_progress', 'production'],
  ['production', 'completed'],
  ['completed', 'archived'],
  ['in_progress', 'new'],
  ['production', 'in_progress'],
];

export const ALL_STATUSES: LeadStatus[] = [
  'new', 'in_progress', 'production', 'completed', 'archived',
];

// ─── Discount Tier Test Data ─────────────────────────────────────

export const DISCOUNT_TIERS = [
  { quantity: 1, expectedDiscount: 0, label: 'No discount (qty=1)' },
  { quantity: 9, expectedDiscount: 0, label: 'Below first tier (qty=9)' },
  { quantity: 10, expectedDiscount: 0.05, label: 'First tier boundary (qty=10)' },
  { quantity: 49, expectedDiscount: 0.05, label: 'First tier max (qty=49)' },
  { quantity: 50, expectedDiscount: 0.12, label: 'Second tier boundary (qty=50)' },
  { quantity: 99, expectedDiscount: 0.12, label: 'Second tier max (qty=99)' },
  { quantity: 100, expectedDiscount: 0.15, label: 'Third tier boundary (qty=100)' },
  { quantity: 1000, expectedDiscount: 0.15, label: 'Well above third tier (qty=1000)' },
];
