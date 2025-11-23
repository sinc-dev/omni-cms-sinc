import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Omni CMS",
  description: "Content management for SyncUni.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-muted`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <header className="flex h-16 items-center justify-between border-b bg-background/80 px-4 lg:px-6">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">
                  SyncUni
                </span>
                <span className="text-sm font-semibold tracking-tight">
                  Omni CMS
                </span>
              </div>
              {/* Placeholder for user menu or environment switcher */}
              <div className="h-8 w-8 rounded-full bg-muted" />
            </header>
            <main className="flex-1 bg-muted/40 px-4 pb-8 pt-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
