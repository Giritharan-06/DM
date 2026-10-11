import { it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../apps/website/app/api/public/leads/route';
const request = (value: unknown, origin = 'http://localhost:3000') =>
  new NextRequest('http://localhost:3000/api/public/leads', {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
it('rejects invalid enquiry before accessing the database', async () => {
  const response = await POST(request({ name: 'x' }));
  expect(response.status).toBe(400);
});
it('rejects a foreign origin', async () => {
  expect((await POST(request({}, 'https://untrusted.example'))).status).toBe(
    403,
  );
});
it('does not claim success without database configuration', async () => {
  vi.stubEnv('DATABASE_URL', '');
  vi.stubEnv('TURNSTILE_SECRET_KEY', '');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const response = await POST(
      request({
        name: 'Test Contact',
        businessName: 'Demo business',
        phone: '+919876543210',
        email: 'contact@example.com',
        industry: 'Other',
        service: 'Website Development',
        budget: 'Let’s discuss',
        goal: 'Improve website discovery',
        consent: true,
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toHaveProperty('error');
  } finally {
    vi.unstubAllEnvs();
    log.mockRestore();
  }
});
