import Link from "next/link";
import { Suspense } from "react";
import { Barlow_Condensed, Roboto_Mono } from "next/font/google";
import Nav from "@/app/components/Nav";
import "./globals.css";

const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["600", "700"] });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin", "latin-ext"] });

export const metadata = {
  title: "PoolUp",
  description: "Find VIT-AP batchmates going your way and split the auto fare.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${barlow.variable} ${robotoMono.variable} antialiased`}>
      <body className="min-h-dvh">
        {/* Nav reads the URL, unknown while prerendering /pools/[id]; the fallback is the same bar without links. */}
        <Suspense fallback={<header><div className="h-16 bg-yellow" /><div className="h-2.5 bg-ink" /></header>}>
          <Nav />
        </Suspense>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</main>
        {/* Extra bottom padding on phones clears the fixed "Create a pool" button on /pools. */}
        <footer className="mx-auto flex w-full max-w-6xl gap-4 px-4 pt-4 pb-28 text-sm text-muted sm:px-6 lg:pb-8">
          <Link href="/terms" className="underline underline-offset-4 hover:text-ink">Terms</Link>
          <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">Privacy</Link>
        </footer>
      </body>
    </html>
  );
}
