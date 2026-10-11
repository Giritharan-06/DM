import { Landing } from '@/components/landing';
import { connection } from 'next/server';
import { db, systemSettings } from '@zyroz/database';
import { eq } from 'drizzle-orm';
import { publicWebsiteSettings } from '@zyroz/validation';
export default async function Page() {
  await connection();
  let settings: unknown;
  if (process.env.DATABASE_URL) {
    try {
      const [row] = await db()
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'website'));
      settings = row?.value;
    } catch {
      console.warn(
        'Public website settings unavailable; using configured contact fallback.',
      );
    }
  }
  const profile = publicWebsiteSettings(settings, {
    email: process.env.BUSINESS_EMAIL,
    phone: process.env.BUSINESS_PHONE,
    whatsapp: process.env.BUSINESS_WHATSAPP,
  });
  return <Landing contact={profile} />;
}
