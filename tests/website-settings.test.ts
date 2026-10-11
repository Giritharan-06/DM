import { describe, expect, it } from 'vitest';
import {
  publicWebsiteSettings,
  websiteSettingsSchema,
} from '@zyroz/validation';
describe('public website settings', () => {
  it('rejects script and insecure social links', () => {
    expect(
      websiteSettingsSchema.safeParse({ instagram: 'javascript:alert(1)' })
        .success,
    ).toBe(false);
    expect(
      websiteSettingsSchema.safeParse({ bookingUrl: 'http://example.com' })
        .success,
    ).toBe(false);
  });
  it('only exposes validated public fields', () => {
    const result = publicWebsiteSettings({
      instagram: 'javascript:alert(1)',
      email: 'hello@example.com',
      secret: 'private',
      whatsapp: '+91 98765 43210',
    });
    expect(result.instagram).toBe('');
    expect(result.email).toBe('hello@example.com');
    expect(result).not.toHaveProperty('secret');
    expect(result.whatsapp).toBe('+91 98765 43210');
  });
  it('preserves intentionally blank settings over environment values', () => {
    expect(
      publicWebsiteSettings({ email: '' }, { email: 'fallback@example.com' })
        .email,
    ).toBe('');
    expect(
      publicWebsiteSettings(undefined, { email: 'fallback@example.com' }).email,
    ).toBe('fallback@example.com');
  });
  it('saves visibility and empty profiles without invented destinations', () => {
    const result = websiteSettingsSchema.parse({ whatsappEnabled: false });
    expect(result.whatsappEnabled).toBe(false);
    expect(result.whatsapp).toBe('');
    expect(result.facebook).toBe('');
  });
});
