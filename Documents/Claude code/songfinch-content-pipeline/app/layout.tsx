import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Content Pipeline",
  description:
    "Brand → Threads → Articles. GEO-grade content with un-AI voice.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <TooltipProvider delayDuration={200}>
          <header className="sticky top-0 z-50 bg-zinc-950 text-zinc-100 border-b border-zinc-900">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-400 to-pink-500 group-hover:scale-105 transition-transform" />
                <span className="font-semibold tracking-tight text-sm">
                  Content Pipeline
                </span>
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <NavLink href="/">Today</NavLink>
                <NavLink href="/brand">Brand</NavLink>
                <NavLink href="/threads">Threads</NavLink>
                <NavLink href="/schedule">Schedule</NavLink>
                <NavLink href="/monitor">Monitor</NavLink>
                <NavLink href="/admin/runs">Runs</NavLink>
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
            {children}
          </main>
          <footer className="border-t border-zinc-100">
            <div className="max-w-7xl mx-auto px-6 h-12 flex items-center text-xs text-muted-foreground tabular-nums">
              <span>Local · Gemini 2.5</span>
            </div>
          </footer>
        </TooltipProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "bg-zinc-950 text-zinc-100 border-zinc-900 [&_button]:bg-zinc-100 [&_button]:text-zinc-950",
            },
          }}
        />
      </body>
    </html>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
    >
      {children}
    </Link>
  );
}
