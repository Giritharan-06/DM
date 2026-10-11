import type { Metadata } from 'next';
import '@zyroz/ui/styles.css';
import './website.css';
import './reference.css';
import './premium.css';
import './cards.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000',
  ),
  title: 'ZYROZ — Your next chapter of growth',
  description:
    'Smart digital marketing for ambitious businesses. Explore strategy, creative, advertising and websites with ZYROZ.',
  openGraph: {
    title: 'Grow Your Business in the Digital World.',
    description:
      'A clearer strategy. A stronger brand. Your next chapter starts here.',
    type: 'website',
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
