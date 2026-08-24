'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/store';
import { api, CheckoutResponse, Order, Address } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { token } = useAuthStore();
  
  const [validation, setValidation] = useState<CheckoutResponse | null>(null);
  const [validating, setValidating] = useState(true);
  const [paymentState, setPaymentState] = useState<'IDLE' | 'PREPARING' | 'PROCESSING' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [paymentMethod, setPaymentMethod] = useState<'MOCK' | 'COD'>('MOCK');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);
  const [deliverySlot, setDeliverySlot] = useState('express');
  
  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | ''>('');
  const [paymentConfig, setPaymentConfig] = useState<{provider: string, razorpayKeyId: string}>({ provider: 'mock', razorpayKeyId: '' });
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  useEffect(() => {
    if (!token) return;
    const loadAddresses = async () => {
      try {
        const myAddresses = await api.getAddresses();
        setAddresses(myAddresses);
        const def = myAddresses.find(a => a.isDefault);
        if (def) setSelectedAddressId(def.id);
        else if (myAddresses.length > 0) setSelectedAddressId(myAddresses[0].id);
      } catch (e) {
        console.error("Failed to load addresses", e);
      }
    };
    loadAddresses();

    const loadConfig = async () => {
      try {
        const config = await api.getPaymentConfig();
        setPaymentConfig(config);
        
        if (config.provider === 'razorpay') {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          document.body.appendChild(script);
        }
      } catch (e) {
        console.error("Failed to load payment config", e);
      }
    };
    loadConfig();
  }, [token]);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    if (items.length === 0) {
      setValidating(false);
      return;
    }

    const validate = async () => {
      try {
        setValidating(true);
        const result = await api.validateCheckout({
          items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          addressId: selectedAddressId === '' ? undefined : Number(selectedAddressId),
          couponCode: appliedCouponCode || undefined
        });
        setValidation(result);
        
        // Check if coupon error came back from validation
        if (appliedCouponCode && result.errors.some(e => e.reason === 'INVALID_COUPON')) {
           setCouponError(result.errors.find(e => e.reason === 'INVALID_COUPON')?.message || 'Invalid coupon');
           setAppliedCouponCode('');
        }
      } catch (e) {
        setErrorMsg('Failed to connect to checkout service.');
      } finally {
        setValidating(false);
      }
    };
    validate();
  }, [items, token, router, selectedAddressId, appliedCouponCode]);

  const isFormValid = 
    (selectedAddressId !== '' || (formData.fullName.length > 2 && formData.address.length > 5)) && 
    (paymentMethod === 'COD' || (
      formData.cardNumber.length >= 16 && 
      formData.expiry.length >= 5 && 
      formData.cvc.length >= 3
    ));

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !validation?.success) return;

    setPaymentState('PREPARING');
    setErrorMsg('');

    try {
      // 1. Create Order
      const order = await api.placeOrder({
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        addressId: selectedAddressId === '' ? undefined : Number(selectedAddressId),
        couponCode: appliedCouponCode || undefined
      });
      
      setPaymentState('PROCESSING');

      // 2. Create Payment Intent
      const payment = await api.createPayment({
        orderNumber: order.orderNumber,
        paymentMethod: paymentMethod,
        idempotencyKey: idempotencyKey
      });

      if (payment.status === 'SUCCESS' || payment.status === 'COD_PENDING') {
        localStorage.setItem(`delivery_slot_${order.orderNumber}`, deliverySlot);
        setPaymentState('SUCCESS');
        setOrderPlaced(order);
        clearCart();
        return;
      }

      if (paymentConfig.provider === 'razorpay') {
        setPaymentState('VERIFYING');
        const options = {
          key: paymentConfig.razorpayKeyId,
          amount: Math.round(validation!.total * 100), // strictly for UI matching, backend holds authoritative value
          currency: "INR",
          name: "KareMart",
          description: "Order #" + order.orderNumber,
          order_id: payment.providerPaymentId,
          handler: async function (response: any) {
            try {
              const verifiedPayment = await api.verifyPayment(payment.id, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifiedPayment.status === 'SUCCESS') {
                localStorage.setItem(`delivery_slot_${order.orderNumber}`, deliverySlot);
                setPaymentState('SUCCESS');
                setOrderPlaced(order);
                clearCart();
              } else {
                setPaymentState('FAILED');
                setErrorMsg('Payment verification failed.');
                setIdempotencyKey(crypto.randomUUID());
              }
            } catch (e) {
              setPaymentState('FAILED');
              setErrorMsg('Failed to verify payment with server.');
              setIdempotencyKey(crypto.randomUUID());
            }
          },
          prefill: {
            name: formData.fullName,
          },
          theme: {
            color: "#059669"
          },
          modal: {
            ondismiss: function() {
              setPaymentState('FAILED');
              setErrorMsg('Payment was cancelled.');
              setIdempotencyKey(crypto.randomUUID());
              // Auto-cancel payment verify as failed
              api.verifyPayment(payment.id, { cancelled: "true" }).catch(console.error);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      }

      setPaymentState('VERIFYING');

      // 3. Verify Payment (Mock)
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate gateway

      const verificationData = {
         mockCardNumber: paymentMethod === 'MOCK' ? formData.cardNumber : ''
      };

      const verifiedPayment = await api.verifyPayment(payment.id, verificationData);

      if (verifiedPayment.status === 'SUCCESS') {
        localStorage.setItem(`delivery_slot_${order.orderNumber}`, deliverySlot);
        setPaymentState('SUCCESS');
        setOrderPlaced(order);
        clearCart();
      } else {
        setPaymentState('FAILED');
        setErrorMsg('Payment failed. Please check your details and try again.');
        setIdempotencyKey(crypto.randomUUID());
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An error occurred during checkout");
      setPaymentState('FAILED');
      setIdempotencyKey(crypto.randomUUID());
    }
  };

  if (!token) return null;

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 space-y-6">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Payment Successful!</h1>
        <p className="text-xl text-gray-500">Your order <span className="font-bold text-gray-900 dark:text-white">#{orderPlaced.orderNumber.substring(0,8).toUpperCase()}</span> has been placed.</p>
        <Link href="/profile" className="inline-block mt-8 bg-emerald-600 text-white font-bold px-8 py-4 rounded-full hover:bg-emerald-700 transition-colors">
          View My Orders
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !validation) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Your cart is empty</h2>
        <Link href="/" className="text-emerald-600 hover:underline">Continue Shopping &rarr;</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Secure Checkout</h1>
      
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-8 font-medium">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Payment Details */}
        <div className="w-full lg:w-3/5 space-y-8">
          <form onSubmit={handlePlaceOrder} className="space-y-10">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Shipping Information</h3>
                <Link href="/profile" className="text-sm text-primary hover:underline font-medium">Manage</Link>
              </div>
              
              {addresses.length > 0 ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Delivery Address</label>
                  <select 
                    value={selectedAddressId} 
                    onChange={e => setSelectedAddressId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">-- Use Custom Address Below --</option>
                    {addresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.type} - {addr.recipientName}, {addr.city} {addr.pinCode}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {selectedAddressId === '' && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Address</label>
                    <textarea required rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="123 Smart St, Tech City, 90210"></textarea>
                  </div>
                </div>
              )}
            </div>
            
            {/* Delivery Time Selection */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Select Delivery Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliverySlot('express')}
                  className={`p-4 rounded-xl border text-left transition-all ${deliverySlot === 'express' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'}`}
                >
                  <div className="font-bold text-sm text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Express
                  </div>
                  <div className="text-xs text-gray-500">Within 30 Mins</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliverySlot('today')}
                  className={`p-4 rounded-xl border text-left transition-all ${deliverySlot === 'today' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'}`}
                >
                  <div className="font-bold text-sm text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Today
                  </div>
                  <div className="text-xs text-gray-500">6 PM - 8 PM</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliverySlot('tomorrow')}
                  className={`p-4 rounded-xl border text-left transition-all ${deliverySlot === 'tomorrow' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'}`}
                >
                  <div className="font-bold text-sm text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                    Tomorrow
                  </div>
                  <div className="text-xs text-gray-500">8 AM - 10 AM</div>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Payment Method
                </h3>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('MOCK')}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${paymentMethod === 'MOCK' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                  >
                    {paymentConfig.provider === 'razorpay' ? 'Razorpay (Online)' : 'Credit Card'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('COD')}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${paymentMethod === 'COD' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                  >
                    Cash on Delivery
                  </button>
                </div>
              </div>

              {paymentMethod === 'MOCK' && paymentConfig.provider !== 'razorpay' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number (Mock)</label>
                    <input type="text" required maxLength={19} value={formData.cardNumber} onChange={e => setFormData({...formData, cardNumber: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none font-mono" placeholder="4242 4242 4242 4242" />
                    <p className="text-xs text-gray-500 mt-1">Hint: Test fail by ending order total in 999.99 or starting card with 4111</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                      <input type="text" required maxLength={5} value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none font-mono" placeholder="MM/YY" />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVC</label>
                      <input type="text" required maxLength={4} value={formData.cvc} onChange={e => setFormData({...formData, cvc: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none font-mono" placeholder="123" />
                    </div>
                  </div>
                </div>
              )}
              {paymentMethod === 'MOCK' && paymentConfig.provider === 'razorpay' && (
                 <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 text-center">
                    You will be securely redirected to Razorpay to complete your payment.
                 </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={!isFormValid || paymentState !== 'IDLE' && paymentState !== 'FAILED' || validating || !validation?.success}
              className="w-full bg-emerald-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {paymentState === 'PREPARING' ? "Preparing Order..." : 
               paymentState === 'PROCESSING' ? "Connecting to Provider..." :
               paymentState === 'VERIFYING' ? "Verifying Payment..." :
               paymentState === 'SUCCESS' ? "Success!" :
               validating ? "Calculating Totals..." : 
               validation?.success ? (paymentState === 'FAILED' ? `Retry Payment ₹${validation.total.toFixed(2)}` : `Pay ₹${validation.total.toFixed(2)}`) : 
               "Cart contains errors"}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-2/5">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 sticky top-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h3>
            
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={item.product.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                    {item.product.imageUrl && <img src={item.product.imageUrl} className="w-full h-full object-contain" alt="" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground">{item.product.name}</h4>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-medium text-sm text-foreground">
                    ₹{(item.product.sellingPrice * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value); setCouponError(''); }}
                  disabled={!!appliedCouponCode}
                  placeholder="Enter code"
                  className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none uppercase" 
                />
                {!appliedCouponCode ? (
                  <button 
                    type="button"
                    onClick={() => {
                      if (!couponInput.trim()) return;
                      setCouponError('');
                      setAppliedCouponCode(couponInput.trim());
                    }}
                    disabled={!couponInput.trim()}
                    className="px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    Apply
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => {
                      setAppliedCouponCode('');
                      setCouponInput('');
                      setCouponError('');
                    }}
                    className="px-4 py-3 bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200"
                  >
                    Remove
                  </button>
                )}
              </div>
              {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{validation ? `₹${validation.subtotal.toFixed(2)}` : '...'}</span>
              </div>
              
              {(() => {
                if (!validation) return null;
                const totalMrp = items.reduce((acc, item) => acc + (item.product.mrp * item.quantity), 0);
                const savings = totalMrp - validation.subtotal;
                if (savings > 0) {
                  return (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>MRP Discount Savings</span>
                      <span>-₹{savings.toFixed(2)}</span>
                    </div>
                  );
                }
                return null;
              })()}

              {validation && validation.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount ({validation.couponCode})</span>
                  <span>-₹{validation.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax (5%)</span>
                <span>{validation ? `₹${validation.tax.toFixed(2)}` : '...'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                <span>Total</span>
                <span>{validation ? `₹${validation.total.toFixed(2)}` : '...'}</span>
              </div>
            </div>

            {validation && !validation.success && (
              <div className="mt-6 bg-red-50 p-4 rounded-xl text-sm text-red-600 border border-red-100">
                <p className="font-bold mb-2">Cart Errors:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {validation.errors.map((e, i) => <li key={i}>{e.message}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
