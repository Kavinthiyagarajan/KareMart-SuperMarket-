'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  api,
  OrderDetails,
  OrderActionEligibilityDto,
  CancellationReason,
  ReturnReason,
  RefundStatus
} from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import { useToastStore } from '@/lib/toastStore';
import Link from 'next/link';
import {
  Package,
  CheckCircle2,
  Truck,
  Home,
  Phone,
  Star,
  Check,
  HelpCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  ChevronRight
} from 'lucide-react';

const CANCELLATION_REASONS: { key: CancellationReason; label: string }[] = [
  { key: 'CHANGED_MIND', label: 'Changed my mind' },
  { key: 'ORDERED_BY_MISTAKE', label: 'Ordered by mistake' },
  { key: 'DELIVERY_DELAY', label: 'Delivery issue / delay' },
  { key: 'OTHER', label: 'Other reason' }
];

const RETURN_REASONS: { key: ReturnReason; label: string }[] = [
  { key: 'DAMAGED_INCORRECT_ITEM', label: 'Damaged or incorrect item received' },
  { key: 'PRODUCT_ISSUE', label: 'Product quality or freshness issue' },
  { key: 'ORDERED_BY_MISTAKE', label: 'Ordered by mistake' },
  { key: 'OTHER', label: 'Other issue' }
];

const REFUND_STATUS_CONFIG: Record<RefundStatus, { label: string; bg: string; text: string }> = {
  NOT_REQUESTED: { label: 'Not Applicable', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
  REQUESTED: { label: 'Refund Requested', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
  APPROVED: { label: 'Refund Approved', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300' },
  PROCESSING: { label: 'Processing Refund', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
  COMPLETED: { label: 'Refund Completed', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
  REJECTED: { label: 'Refund Rejected', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300' }
};

export default function OrderDetailsPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const router = useRouter();
  const { token } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [eligibility, setEligibility] = useState<OrderActionEligibilityDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancellationReason>('CHANGED_MIND');
  const [cancelNotes, setCancelNotes] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState<ReturnReason>('DAMAGED_INCORRECT_ITEM');
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const loadData = async () => {
    if (!orderNumber) return;
    try {
      const [orderData, eligData] = await Promise.all([
        api.getOrderDetails(orderNumber),
        api.getOrderActionEligibility(orderNumber).catch(() => null)
      ]);
      if (orderData) {
        setOrder(orderData);
        setEligibility(eligData);
      } else {
        setError('Order not found or unauthorized access.');
      }
    } catch {
      setError('Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    if (orderNumber) {
      const slot = localStorage.getItem(`delivery_slot_${orderNumber}`);
      if (slot) setDeliverySlot(slot);
      loadData();
    }
  }, [orderNumber, token, router]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmittingCancel(true);
    try {
      await api.cancelOrder(order.orderNumber, {
        reason: cancelReason,
        notes: cancelNotes
      });
      addToast('Order cancelled successfully.', 'success');
      setShowCancelModal(false);
      await loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmittingReturn(true);
    try {
      await api.requestReturn(order.orderNumber, {
        reason: returnReason,
        notes: returnNotes
      });
      addToast('Return & refund request submitted successfully.', 'success');
      setShowReturnModal(false);
      await loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to submit return request.', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

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

  const isOrderCancelled = order.status === 'CANCELLED';
  const isOrderDelivered = order.status === 'DELIVERED';

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
          
          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
            {/* Cancel Action */}
            {eligibility?.canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded-xl font-bold text-sm transition-colors border border-red-200 dark:border-red-800 flex items-center gap-1.5 shadow-sm"
              >
                <XCircle className="w-4 h-4" /> Cancel Order
              </button>
            )}

            {/* Return Action */}
            {eligibility?.canRequestReturn && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 rounded-xl font-bold text-sm transition-colors border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" /> Request Return
              </button>
            )}

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
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
            >
              <Package className="w-4 h-4" /> Buy Again
            </button>
            
            {!isOrderCancelled && (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-medium text-sm">
                Status: {order.status}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Banner */}
      {isOrderCancelled && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 dark:bg-red-800/40 p-3 rounded-2xl flex-shrink-0">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold">Order Cancelled</h4>
              <p className="text-sm opacity-90">
                {eligibility?.cancellation?.reason 
                  ? `Reason: ${eligibility.cancellation.reason.replace(/_/g, ' ')}` 
                  : (order.paymentStatus === 'FAILED' ? 'Payment failed or expired.' : 'This order has been cancelled.')}
              </p>
            </div>
          </div>
          {eligibility?.cancellation?.refundStatus && eligibility.cancellation.refundStatus !== 'NOT_REQUESTED' && (
            <div className="bg-white dark:bg-gray-800 px-4 py-2.5 rounded-2xl border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Refund Status:</span>
              <span className={`font-bold px-2 py-0.5 rounded-md text-xs ${REFUND_STATUS_CONFIG[eligibility.cancellation.refundStatus].bg} ${REFUND_STATUS_CONFIG[eligibility.cancellation.refundStatus].text}`}>
                {REFUND_STATUS_CONFIG[eligibility.cancellation.refundStatus].label} (₹{eligibility.cancellation.refundAmount?.toFixed(2)})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Return Request Banner */}
      {eligibility?.returnRequest && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-800/40 p-3 rounded-2xl flex-shrink-0">
              <RotateCcw className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold">Return Request #{eligibility.returnRequest.id}</h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                  {eligibility.returnRequest.status}
                </span>
              </div>
              <p className="text-sm opacity-90 mt-0.5">
                Reason: <span className="font-semibold">{eligibility.returnRequest.reason.replace(/_/g, ' ')}</span>
                {eligibility.returnRequest.adminNotes && ` • Note: ${eligibility.returnRequest.adminNotes}`}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 px-4 py-2.5 rounded-2xl border border-purple-200 dark:border-purple-800 text-sm flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Refund Status:</span>
            <span className={`font-bold px-2 py-0.5 rounded-md text-xs ${REFUND_STATUS_CONFIG[eligibility.returnRequest.refundStatus].bg} ${REFUND_STATUS_CONFIG[eligibility.returnRequest.refundStatus].text}`}>
              {REFUND_STATUS_CONFIG[eligibility.returnRequest.refundStatus].label} (₹{eligibility.returnRequest.refundAmount.toFixed(2)})
            </span>
          </div>
        </div>
      )}

      {!isOrderCancelled && (
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

              return stages.map((stage) => {
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
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Live Order Summary</h3>
            <span className="text-xs font-semibold text-gray-500">{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</span>
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

          {/* Need help with this order */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Need help with this order?</h4>
                <p className="text-xs text-gray-500">Find answers about tracking, delivery, or cancellation.</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Need assistance with cancellations, returns, or refunds? Visit our Help Center or check your Returns Hub.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                href="/profile/returns"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-white rounded-xl text-xs font-semibold transition-colors shadow-sm text-center"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                Returns & Refunds
              </Link>
              <Link
                href="/help?category=orders"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-white rounded-xl text-xs font-semibold transition-colors shadow-sm text-center"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                Help Center
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* CANCEL ORDER MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-200 dark:border-gray-700 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cancel Order</h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to cancel order <span className="font-bold text-gray-900 dark:text-white">#{order.orderNumber.substring(0, 8).toUpperCase()}</span>? This action is permanent and will release all reserved items.
            </p>

            {order.paymentMethod !== 'COD' && order.paymentStatus === 'SUCCESS' && (
              <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs leading-relaxed flex items-start gap-2.5">
                <DollarSign className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-bold">Online Refund Request</p>
                  <p className="opacity-90">A refund request for ₹{order.total.toFixed(2)} will be registered in your account upon cancellation.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value as CancellationReason)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {CANCELLATION_REASONS.map((r) => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  rows={3}
                  placeholder="Let us know what went wrong..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={submittingCancel}
                  className="flex-1 px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-sm transition-colors"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST RETURN MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-200 dark:border-gray-700 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-purple-600 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Return & Refund</h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Submit a return request for delivered order <span className="font-bold text-gray-900 dark:text-white">#{order.orderNumber.substring(0, 8).toUpperCase()}</span>.
            </p>

            <div className="mb-6 p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center font-bold">
                <span>Eligible Refund Amount:</span>
                <span className="text-sm">₹{order.total.toFixed(2)}</span>
              </div>
              <p className="text-[11px] opacity-80">Refunds are processed after KareMart operations reviews and confirms the returned item status.</p>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Reason for Return
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Details / Explanation (Optional)
                </label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue with the item(s)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  disabled={submittingReturn}
                  className="flex-1 px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="flex-1 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
