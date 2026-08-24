"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import SmartSearch from "@/components/SmartSearch";
import { api } from "@/lib/api";

function NotificationBadge() {
  const { token } = useAuthStore();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (token) {
      api.getUnreadNotificationCount().then(res => setCount(res.count)).catch(console.error);
    }
  }, [token]);

  if (count === 0) return null;
  return (
    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
  );
}

export default function Header() {
  const setIsOpen = useCartStore((state) => state.setIsOpen);
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  
  const { username, role, logout: originalLogout, token } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && token) {
      useCartStore.getState().syncWithBackend();
    }
  }, [isMounted, token]);

  const logout = () => {
    originalLogout();
    useCartStore.getState().clearCart();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight text-foreground">
          <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span><span className="text-emerald-600 font-extrabold">K</span>are<span className="text-emerald-600 font-extrabold">M</span>art</span>
        </Link>
        <div className="flex-1 max-w-lg mx-8 hidden md:block">
          <SmartSearch />
        </div>
        <div className="flex items-center gap-4">
          <Link href="/deals" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Deals
          </Link>
          {isMounted && (
            username ? (
              <div className="flex items-center gap-3 text-sm font-medium">
                {role === 'ADMIN' && (
                  <Link href="/admin/products" className="text-xs font-bold text-white bg-slate-900 px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-800 transition-colors">
                    ADMIN
                  </Link>
                )}
                
                <Link href="/profile/notifications" className="relative p-2 text-slate-500 hover:text-slate-800 bg-transparent hover:bg-slate-100 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <NotificationBadge />
                </Link>

                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 text-slate-700 font-semibold transition-colors shadow-sm">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  Account
                </Link>
                <button onClick={logout} className="p-2 text-slate-400 hover:text-slate-700 bg-transparent hover:bg-slate-100 rounded-full transition-colors" aria-label="Logout">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm font-medium">
                <Link href="/login" className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors">
                  Sign in
                </Link>
                <Link href="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-semibold transition-colors shadow-sm">
                  Sign up
                </Link>
              </div>
            )
          )}
          
          <button 
            onClick={() => setIsOpen(true)}
            className="relative p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-full transition-colors text-slate-700 ml-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
