'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { api, OrderSummary, Address, WishlistItemDto, Product, NotificationDto } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfileOverviewPage() {
  const { username, token } = useAuthStore();
  const router = useRouter();
  
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItemDto[]>([]);
  const [buyAgain, setBuyAgain] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [ordersRes, addrsRes, wishRes, buyRes, notifRes] = await Promise.all([
          api.getMyOrders(0, 3).catch(() => ({ content: [] })),
          api.getAddresses().catch(() => []),
          api.getWishlist().catch(() => []),
          api.getBuyAgainProducts().catch(() => []),
          api.getNotifications(0, 3).catch(() => ({ content: [] }))
        ]);
        
        setOrders(ordersRes.content || []);
        setAddresses(addrsRes || []);
        setWishlist(wishRes || []);
        setBuyAgain(buyRes || []);
        setNotifications(notifRes.content || []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, [token]);

  if (!token) return null;

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Account Center...</div>;
  }

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl font-bold">
          {username ? username.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{username}</h1>
          <p className="text-slate-500">KareMart Customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Recent Orders</h3>
            <Link href="/profile/orders" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All</Link>
          </div>
          <div className="flex-1 p-5">
            {orders.length === 0 ? (
              <p className="text-slate-500 text-sm">Your orders will appear here.</p>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.orderNumber} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-slate-900">#{order.orderNumber.substring(0,8).toUpperCase()}</p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-900">₹{order.total.toFixed(2)}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-500">{order.status.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buy Again Preview */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Buy Again</h3>
            <Link href="/profile/buy-again" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All</Link>
          </div>
          <div className="flex-1 p-5">
            {buyAgain.length === 0 ? (
              <p className="text-slate-500 text-sm">Products you purchase will appear here.</p>
            ) : (
              <div className="flex gap-4 overflow-hidden">
                {buyAgain.slice(0, 3).map(p => (
                  <div key={p.id} className="w-20 text-center flex-shrink-0">
                    <div className="w-20 h-20 bg-slate-50 rounded-lg mb-2 overflow-hidden border border-slate-100 flex items-center justify-center p-2">
                      <img src={p.imageUrl} alt={p.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <p className="text-[10px] text-slate-700 font-medium truncate">{p.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Default Address</h3>
            <Link href="/profile/addresses" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Manage ({addresses.length})</Link>
          </div>
          <div className="flex-1 p-5">
            {!defaultAddress ? (
              <p className="text-slate-500 text-sm">No addresses saved.</p>
            ) : (
              <div>
                <p className="font-bold text-sm text-slate-900">{defaultAddress.recipientName}</p>
                <p className="text-sm text-slate-600 mt-1">{defaultAddress.addressLine1}</p>
                <p className="text-sm text-slate-600">{defaultAddress.city}, {defaultAddress.state} {defaultAddress.pinCode}</p>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Preview */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Wishlist</h3>
            <Link href="/profile/wishlist" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All ({wishlist.length})</Link>
          </div>
          <div className="flex-1 p-5">
            {wishlist.length === 0 ? (
              <p className="text-slate-500 text-sm">Save products you love for later.</p>
            ) : (
              <div className="flex gap-4 overflow-hidden">
                {wishlist.slice(0, 3).map(w => (
                  <div key={w.id} className="w-20 text-center flex-shrink-0">
                    <div className="w-20 h-20 bg-slate-50 rounded-lg mb-2 overflow-hidden border border-slate-100 flex items-center justify-center p-2">
                      <img src={w.product.imageUrl} alt={w.product.name} className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Notifications Preview */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col md:col-span-2">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Recent Notifications</h3>
            <Link href="/profile/notifications" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All</Link>
          </div>
          <div className="flex-1 p-5">
            {notifications.length === 0 ? (
              <p className="text-slate-500 text-sm">You're all caught up.</p>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 2).map(notif => (
                  <div key={notif.id} className="flex gap-3">
                    <div className="mt-1">
                      <span className={`flex w-2.5 h-2.5 rounded-full ${!notif.read ? 'bg-emerald-500' : 'bg-slate-200'}`}></span>
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
