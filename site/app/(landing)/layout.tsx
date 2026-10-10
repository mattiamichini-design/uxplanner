import type { Metadata } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { siteUrl } from '../site-url';
import '@/styles/tokens.css';
import '../landing.css';

// All three families are self-hosted, preloaded and get size-matched fallbacks from next/font. Archivo and
// JetBrains Mono are SIL OFL. Clash Display is ITF FFL: site/scripts/fetch-fonts.mjs downloads the official
// variable file from Fontshare before dev and build, so it is served by this site but never committed.
const archivo = Archivo({ subsets: ['latin', 'latin-ext'], variable: '--font-archivo' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const clashDisplay = localFont({ src: '../fonts/ClashDisplay-Variable.woff2', weight: '200 700', variable: '--font-clash-display' });

const title = 'UX Planner — Plan the user experience in the same repo as the code';
const description =
  'A local app that reads your personas, journeys, flows and stories from Markdown and JSON files in your project. Edit a journey on the board and the file changes with it.';

// opengraph-image.png and twitter-image.png in this segment supply the share image.
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: '/', siteName: 'UX Planner', title, description, locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${clashDisplay.variable} ${archivo.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
