"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface AdminOrderDetails {
  orderNumber: string;
  customerId: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  couponCode: string | null;
  createdAt: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  providerPaymentId: string | null;
  delivery: {
    status: string;
    trackingUrl: string | null;
    estimatedDeliveryTime: string | null;
  } | null;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export default function AdminOrderDetailsPage() {
  const { orderNumber } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<AdminOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAdminOrderDetails(orderNumber as string);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone and will release reserved inventory.")) {
      return;
    }
    
    setCancelling(true);
    try {
      await api.cancelAdminOrder(orderNumber as string);
      await fetchOrderDetails(); // Refresh to get the latest status
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl">
          <h3 className="font-bold mb-2">Error Loading Order</h3>
          <p>{error || "Order not found"}</p>
          <button 
            onClick={() => router.push('/admin/orders')}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            &larr; Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const canCancel = order.status === 'PENDING_PAYMENT' || order.status === 'CONFIRMED';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <button 
            onClick={() => router.push('/admin/orders')}
            className="text-slate-400 hover:text-white transition-colors text-sm mb-4 inline-flex items-center"
          >
            &larr; Back to Orders
          </button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-3">
            Order #{order.orderNumber}
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${
              order.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              order.status === 'PENDING_PAYMENT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              {order.status}
            </span>
          </h1>
          <p className="text-slate-400 mt-2" suppressHydrationWarning>Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        
        {canCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {cancelling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                Cancelling...
              </>
            ) : (
              'Cancel Order'
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items and Totals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-200 mb-6 border-b border-slate-700 pb-2">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0">
                  <div>
                    <h3 className="font-medium text-slate-200">{item.productName}</h3>
                    <p className="text-sm text-slate-400">Qty: {item.quantity} &times; ₹{item.unitPrice.toFixed(2)}</p>
                  </div>
                  <div className="font-semibold text-slate-200">
                    ₹{item.totalPrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-200 mb-6 border-b border-slate-700 pb-2">Payment Summary</h2>
            <div className="space-y-3 text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span>₹{order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white pt-4 border-t border-slate-700">
                <span>Total</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer, Payment, Delivery */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2">Customer Info</h2>
            <p className="text-slate-300">
              <span className="block text-sm text-slate-500 mb-1">Customer ID (Username)</span>
              {order.customerId}
            </p>
          </div>

          {/* Payment Info */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2">Payment Info</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-sm text-slate-500 mb-1">Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                  order.paymentStatus === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                  order.paymentStatus === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {order.paymentStatus || 'PENDING'}
                </span>
              </div>
              <div>
                <span className="block text-sm text-slate-500 mb-1">Method</span>
                <span className="text-slate-300">{order.paymentMethod || 'N/A'}</span>
              </div>
              {order.providerPaymentId && (
                <div>
                  <span className="block text-sm text-slate-500 mb-1">Provider ID</span>
                  <span className="text-slate-300 font-mono text-sm break-all">{order.providerPaymentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2">Delivery Info</h2>
            {order.delivery ? (
              <div className="space-y-4">
                <div>
                  <span className="block text-sm text-slate-500 mb-1">Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                    order.delivery.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' :
                    order.delivery.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {order.delivery.status}
                  </span>
                </div>
                {order.delivery.estimatedDeliveryTime && (
                  <div>
                    <span className="block text-sm text-slate-500 mb-1">ETA</span>
                    <span className="text-slate-300" suppressHydrationWarning>{new Date(order.delivery.estimatedDeliveryTime).toLocaleString()}</span>
                  </div>
                )}
                {order.delivery.trackingUrl && (
                  <div>
                    <span className="block text-sm text-slate-500 mb-1">Tracking</span>
                    <a href={order.delivery.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all text-sm">
                      {order.delivery.trackingUrl}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No delivery information available yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
