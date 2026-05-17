import { expect, test, describe } from 'vitest';
import { extractIp } from './rate-limit';
import { NextRequest } from 'next/server';

describe('rateLimit', () => {
  test('extractIp extracts forwarded for header', () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1'
      }
    });
    expect(extractIp(req)).toBe('192.168.1.1');
  });

  test('extractIp falls back to unknown', () => {
    const req = new NextRequest('http://localhost:3000/api/test');
    expect(extractIp(req)).toBe('unknown');
  });
});
