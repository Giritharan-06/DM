import { z } from 'zod';
const optionalUrl = z
  .union([
    z.literal(''),
    z
      .url()
      .refine(
        (value) => new URL(value).protocol === 'https:',
        'Use an HTTPS link.',
      ),
  ])
  .default('');
export const websiteSettingsSchema = z.object({
  email: z.union([z.literal(''), z.email()]).default(''),
  phone: z.string().trim().max(30).default(''),
  whatsapp: z
    .string()
    .trim()
    .regex(/^(?:\+?[\d ()-]{7,22})?$/, 'Enter a number with country code.')
    .default(''),
  instagram: optionalUrl,
  facebook: optionalUrl,
  linkedin: optionalUrl,
  youtube: optionalUrl,
  bookingUrl: optionalUrl,
  whatsappEnabled: z.boolean().default(true),
});
export type WebsiteSettings = z.infer<typeof websiteSettingsSchema>;
export function publicWebsiteSettings(
  value: unknown,
  fallback: Record<string, string | undefined> = {},
): WebsiteSettings {
  const record =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  const defaults = websiteSettingsSchema.parse({});
  for (const key of Object.keys(defaults) as (keyof WebsiteSettings)[]) {
    const parsed = websiteSettingsSchema.shape[key].safeParse(
      record[key] ?? fallback[key],
    );
    if (parsed.success) Object.assign(defaults, { [key]: parsed.data });
  }
  return defaults;
}
