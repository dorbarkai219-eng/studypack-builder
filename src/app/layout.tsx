import type { Metadata } from "next";
import { Heebo, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  title: "StudyPack — ערכת הכנה למבחן מהחומר שלך",
  description:
    "מערכת לבניית ערכות הכנה למבחן מחומרי הקורס שלך — דף נוסחאות, מצגת לימוד, תכנית יומית, ותרגול עם משוב AI. עברית, RTL, וחינם להתחיל.",
};

/**
 * Clerk is optional — when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is unset
 * we render plain children so dev runs without auth keys. When set,
 * ClerkProvider wires up the session, the middleware enforces it on
 * protected routes, and getUserId() in lib/auth returns the real id.
 */
function MaybeClerkProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }
  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MaybeClerkProvider>
      <html
        lang="he"
        dir="rtl"
        className={`${heebo.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full">
          {/* Keyboard-only skip link — focusable, otherwise sr-only. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-navy focus:px-3 focus:py-1.5 focus:text-sm focus:font-semibold focus:text-paper"
          >
            דלג לתוכן הראשי
          </a>
          <div id="main">{children}</div>
        </body>
      </html>
    </MaybeClerkProvider>
  );
}
