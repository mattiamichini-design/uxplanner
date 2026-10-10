import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "UX Planner", template: "%s · UX Planner" },
  description: "Plan personas, journeys, flows, and stories alongside your project.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
