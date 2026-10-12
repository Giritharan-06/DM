import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@zyroz/auth';
import { db, userRoles } from '@zyroz/database';
import { eq } from 'drizzle-orm';
import { Shell } from '@/components/shell';
import { websiteUrl } from '@/lib/website-url';
export const dynamic = 'force-dynamic';
export default async function Workspace({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET)
    return (
      <div className="setup">
        <span className="logo"><Image className="brand-icon" src="/zyroz-mark.png" alt="" width={80} height={80} />Zyroz Digital</span>
        <h1>Your workspace is almost ready.</h1>
        <p>
          Configure DATABASE_URL and BETTER_AUTH_SECRET in the root .env, run
          migrations, then create the owner account. See the setup guide in
          README.md.
        </p>
        <a
          className="button primary"
          href={websiteUrl}
        >
          Explore the website ↗
        </a>
        {process.env.NODE_ENV==='development' && <Link className="button secondary" href="/preview">Preview CRM design →</Link>}
      </div>
    );
  const session = await auth().api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');
  const [role] = await db()
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id));
  if (!role)
    return (
      <div className="setup">
        <h1>Access pending</h1>
        <p>Ask the owner to assign your account a workspace role.</p>
        <Link href="/sign-in">Return to sign in</Link>
      </div>
    );
  return (
    <Shell
      user={{ id: session.user.id, name: session.user.name, role: role.role }}
    >
      {children}
    </Shell>
  );
}
