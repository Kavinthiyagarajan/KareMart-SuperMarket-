'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { api, OrderSummary } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    
    api.getMyOrders(0, 50)
      .then(res => setOrders(res.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-900">Order History</h3>
      </div>
      
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Your orders will appear here.</h3>
          <p className="text-slate-500 mb-6">You haven't placed any orders yet.</p>
          <button onClick={() => router.push('/')} className="text-emerald-600 font-medium hover:underline">
            Start shopping
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {orders.map(order => (
            <div 
              key={order.orderNumber} 
              onClick={() => router.push(`/profile/orders/${order.orderNumber}`)} 
              className="p-6 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center"
            >
              <div>
                <div className="font-medium text-slate-900">Order #{order.orderNumber.substring(0,8).toUpperCase()}</div>
                <div className="text-sm text-slate-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">₹{order.total.toFixed(2)}</div>
                <div className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md inline-block mt-2 uppercase tracking-wide">
                  {order.status.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
