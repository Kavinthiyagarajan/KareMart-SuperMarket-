'use client';

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { role } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (role !== 'ADMIN') {
      router.replace('/login');
    }
  }, [role, router]);

  if (!isMounted || role !== 'ADMIN') {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-xs text-slate-500 mt-1">KareMart Operations</p>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <Link href="/admin" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/orders" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Orders Management
          </Link>
          <Link href="/admin/products" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Catalog & Sync
          </Link>
          <Link href="/" className="block px-4 py-3 rounded-lg hover:bg-slate-800 text-emerald-400 mt-8 transition-colors">
            &larr; Back to Storefront
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
