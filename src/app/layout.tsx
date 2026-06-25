import type { Metadata } from "next";
import { Heebo, Geist_Mono } from "next/font/google";
import "./globals.css";

// Hebrew-covering UI/body font (also has Latin) + a mono for formulas.
const heebo = Heebo({
  variable: "--font-heb",
  subsets: ["latin", "hebrew"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyPack Builder",
  description: "Coordinated, exam-ready study packs from your course materials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${heebo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Keyboard-only skip link — focusable, otherwise sr-only. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-navy focus:px-3 focus:py-1.5 focus:text-sm focus:font-semibold focus:text-paper"
        >
          Skip to main content
        </a>
        <div id="main">{children}</div>
      </body>
    </html>
  );
}
