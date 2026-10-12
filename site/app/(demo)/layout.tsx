import type { Metadata } from 'next';
import Link from 'next/link';
import { repositoryUrl } from '@site/components/links';
import { siteUrl } from '../site-url';
import './tailwind.css';
import '@/app/ux-planner/theme.css';
import './demo.css';

// The demo is its own document: the product stylesheet and fonts load here and never reach the landing.
export const metadata: Metadata = {
  title: 'UX Planner demo',
  description: 'The real UX Planner interface on a sample workspace. Changes are kept in this tab until you close it.',
  metadataBase: siteUrl,
  alternates: { canonical: '/demo' },
  robots: { index: false },
};

export default function DemoRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <noscript>
          <style>{'.demo-loading{display:none}'}</style>
          <p className="demo-noscript">
            The demo runs the real interface in your browser and needs JavaScript. <Link href="/">Back to UX Planner</Link> ·{' '}
            <a href={repositoryUrl} target="_blank" rel="noopener">Clone on GitHub</a>
          </p>
        </noscript>
        {children}
      </body>
    </html>
  );
}
