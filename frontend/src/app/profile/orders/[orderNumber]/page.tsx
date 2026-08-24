'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, OrderDetails } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Link from 'next/link';
import { Package, CheckCircle2, Truck, Home, Phone, Star, Check } from 'lucide-react';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const router = useRouter();
  const { token } = useAuthStore();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    if (orderNumber) {
      const slot = localStorage.getItem(`delivery_slot_${orderNumber}`);
      if (slot) setDeliverySlot(slot);

      api.getOrderDetails(orderNumber)
        .then((data) => {
          if (data) {
            setOrder(data);
          } else {
            setError('Order not found or unauthorized access.');
          }
        })
        .catch(() => setError('Failed to load order details.'))
        .finally(() => setLoading(false));
    }
  }, [orderNumber, token, router]);

  if (!token) return null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Oops!</h2>
        <p className="text-red-500 mb-6">{error || 'Order not found.'}</p>
        <Link href="/profile" className="text-emerald-600 hover:underline">
          &larr; Back to Profile
        </Link>
      </div>
    );
  }

  const slotLabels: Record<string, string> = {
    'express': 'Express (Within 30 Mins)',
    'today': 'Today (6 PM - 8 PM)',
    'tomorrow': 'Tomorrow Morning (8 AM - 10 AM)'
  };

  return (
    <div className="w-full space-y-8 pb-12">
      <div>
        <Link href="/profile" className="text-sm text-emerald-600 hover:underline font-medium flex items-center gap-1">
          &larr; Back to Order History
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between mt-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Order #{order.orderNumber.substring(0, 8).toUpperCase()}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1" suppressHydrationWarning>
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button 
              onClick={async () => {
                const { useCartStore } = await import('@/lib/store');
                const store = useCartStore.getState();
                const { useToastStore } = await import('@/lib/toastStore');
                
                try {
                  const result = await api.reorder(order.orderNumber);
                  await store.syncWithBackend();
                  
                  if (result.itemsUnavailable > 0) {
                    useToastStore.getState().addToast(`${result.itemsAdded} items added. ${result.itemsUnavailable} unavailable (${result.unavailableProductNames.join(', ')}).`, 'info');
                  } else {
                    useToastStore.getState().addToast(`All ${result.itemsAdded} items added to cart`, 'success');
                  }
                  
                  store.setIsOpen(true);
                } catch (e) {
                  useToastStore.getState().addToast('Failed to add items to cart', 'error');
                }
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
            >
              <Package className="w-4 h-4" /> Buy Again
            </button>
            {order.status !== 'CANCELLED' && (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg font-medium text-sm">
                Status: {order.status}
              </div>
            )}
          </div>
        </div>
      </div>

      {order.status === 'CANCELLED' ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <div>
            <h4 className="text-lg font-bold">Order Cancelled</h4>
            <p className="text-sm opacity-90">{order.paymentStatus === 'FAILED' ? 'Payment failed or expired.' : 'Order was cancelled.'}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-8">Tracking Progress</h3>
          
          <div className="relative flex justify-between items-center z-10 before:content-[''] before:absolute before:left-[10%] before:right-[10%] before:top-[24px] before:-translate-y-1/2 before:h-1 before:bg-gray-200 dark:before:bg-gray-700 before:-z-10">
            {(() => {
              const stages = [
                { id: 'placed', label: 'Order Placed', icon: CheckCircle2, active: true },
                { id: 'packed', label: 'Packed', icon: Package, active: ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
                { id: 'shipped', label: 'Out for Delivery', icon: Truck, active: ['SHIPPED', 'DELIVERED'].includes(order.status) },
                { id: 'delivered', label: 'Delivered', icon: Home, active: order.status === 'DELIVERED' }
              ];

              return stages.map((stage, idx) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.id} className="flex flex-col items-center w-1/4 group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500 ${
                      stage.active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-2 border-gray-200 dark:border-gray-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`mt-3 text-sm font-semibold text-center transition-colors duration-500 ${stage.active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                      {stage.label}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {['SHIPPED', 'DELIVERED'].includes(order.status) && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden relative">
              <img src="https://ui-avatars.com/api/?name=John+Doe&background=10b981&color=fff" alt="Driver" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Your Delivery Partner</p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">John Doe</h4>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1 text-yellow-500 font-medium"><Star className="w-4 h-4 fill-yellow-500" /> 4.8</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="font-mono">MH-12-AB-3456</span>
              </div>
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <button className="flex-1 md:flex-none px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-900 dark:text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Phone className="w-4 h-4" /> Call
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Items */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Live Order Summary</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50 p-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-6 flex justify-between items-center group hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-2xl transition-colors">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center font-bold text-gray-500">
                    {item.quantity}x
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{item.productName}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">₹{item.unitPrice.toFixed(2)} each</p>
                  </div>
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  ₹{item.lineTotal.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 dark:bg-gray-750/50 p-8 space-y-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-white">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount ({order.couponCode})</span>
                <span>-₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span className="font-medium text-gray-900 dark:text-white">₹{order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl text-gray-900 dark:text-white pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
              <span>Total Amount</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Payment & Delivery */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Payment Method</h3>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center">
                {order.paymentMethod === 'COD' ? (
                  <span className="font-bold text-gray-700 dark:text-gray-300">COD</span>
                ) : (
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </p>
                <p className={`text-sm font-medium flex items-center gap-1 mt-0.5 ${order.paymentStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {order.paymentStatus === 'SUCCESS' ? <Check className="w-3 h-3" /> : null}
                  {order.paymentStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Delivery Details</h3>
            
            {deliverySlot && (
              <div className="mb-6 p-4 rounded-xl border border-emerald-100 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800">
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Chosen Slot</p>
                <p className="text-emerald-900 dark:text-emerald-300 font-medium">
                  {slotLabels[deliverySlot] || deliverySlot}
                </p>
              </div>
            )}

            {order.delivery && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Current Status</p>
                  <p className="text-gray-900 dark:text-white font-medium capitalize">
                    {order.delivery.status.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </div>
                
                {order.delivery.estimatedDeliveryTime && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Estimated Arrival</p>
                    <p className="text-gray-900 dark:text-white font-medium" suppressHydrationWarning>
                      {new Date(order.delivery.estimatedDeliveryTime).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {order.delivery.trackingUrl && (
                  <div className="pt-2">
                    <a href={order.delivery.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full justify-center px-4 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-bold transition-colors">
                      Track via {order.delivery.provider}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
