import type { Metadata } from 'next';
import '@zyroz/ui/styles.css';
import './crm.css';
import './reference.css';
import './workbench.css';
import './brand-theme.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import { Providers } from '@/components/providers';
export const metadata: Metadata = {
  title: { default: 'Zyroz Digital Workspace', template: '%s · Zyroz Digital' },
  icons: { icon: '/zyroz-mark.png', apple: '/zyroz-mark.png' },
  description: 'The connected workspace for your agency.',
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
