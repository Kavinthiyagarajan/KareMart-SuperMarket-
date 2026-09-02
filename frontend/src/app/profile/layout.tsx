'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/store';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { username, token, logout: originalLogout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    
    api.getUnreadNotificationCount()
      .then(res => setUnreadCount(res.count))
      .catch(console.error);
  }, [token, router, pathname]);

  const handleLogout = () => {
    originalLogout();
    useCartStore.getState().resetLocalCart();
    router.push('/login');
  };

  if (!token) return null;

  const links = [
    { name: 'Account Overview', path: '/profile', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'My Orders', path: '/profile/orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { name: 'Returns & Refunds', path: '/profile/returns', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { name: 'Buy Again', path: '/profile/buy-again', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { name: 'Wishlist', path: '/profile/wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { name: 'Saved Addresses', path: '/profile/addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { name: 'Notifications', path: '/profile/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { name: 'Support & Inquiries', path: '/support', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { name: 'Help Center & FAQ', path: '/help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 sticky top-24">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">KareMart Account</h2>
            <p className="text-sm text-slate-500 mt-1">{username}</p>
          </div>
          
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 mt-4 md:mt-0 snap-x">
            {links.map(link => {
              const isActive = pathname === link.path || (link.path !== '/profile' && pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap snap-start ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <svg className="w-5 h-5 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                  </svg>
                  {link.name}
                  {link.name === 'Notifications' && unreadCount > 0 && (
                    <span className="md:ml-auto ml-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
            <button onClick={handleLogout} className="flex items-center gap-2 md:gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-600 hover:bg-red-50 md:mt-4 border border-transparent hover:border-red-100 whitespace-nowrap snap-start">
              <svg className="w-5 h-5 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </nav>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
