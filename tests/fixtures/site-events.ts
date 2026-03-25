import { faker } from '@faker-js/faker';

type SiteEventType =
  | 'pageview'
  | 'session_start'
  | 'form_submit'
  | 'customize_start'
  | 'customize_complete';

/**
 * Creates a mock site_event record.
 */
export function createMockSiteEvent(
  overrides: Record<string, unknown> = {}
) {
  return {
    id: faker.string.uuid(),
    event_type: faker.helpers.arrayElement<SiteEventType>([
      'pageview',
      'session_start',
      'form_submit',
      'customize_start',
      'customize_complete',
    ]),
    session_id: faker.string.uuid(),
    visitor_id: faker.string.uuid(),
    page: faker.helpers.arrayElement(['/', '/customize/abc', '/checkout']),
    referrer: faker.internet.url(),
    user_agent: faker.internet.userAgent(),
    metadata: {},
    created_at: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

/**
 * Creates a batch of events of a specific type.
 */
export function createEventBatch(count: number, type: SiteEventType) {
  return Array.from({ length: count }, () =>
    createMockSiteEvent({ event_type: type })
  );
}
