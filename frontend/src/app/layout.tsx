import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import CartDrawer from "@/components/CartDrawer";
import ToastContainer from "@/components/ToastContainer";
import StickyCart from "@/components/StickyCart";
import { DemoBar } from "@/components/demo/DemoBar";
import { ShowcaseBanner } from "@/components/demo/ShowcaseBanner";

export const metadata: Metadata = {
  title: "KareMart | Everyday Essentials",
  description: "Your trusted online supermarket.",
};

import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>
          <Suspense fallback={<div className="h-16 border-b border-border bg-surface/80"></div>}>
            <Header />
          </Suspense>
          <CartDrawer />
          <StickyCart />
          {process.env.NODE_ENV === 'development' && <DemoBar />}
          <ToastContainer />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
