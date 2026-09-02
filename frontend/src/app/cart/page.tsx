"use client";

import { useCartStore } from "@/lib/store";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, ArrowRight, ShoppingBag, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    useCartStore.getState().syncWithBackend();
  }, []);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalMrp = items.reduce((acc, item) => acc + (item.product.mrp * item.quantity), 0);
  const subtotal = items.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
  const savings = totalMrp - subtotal;
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const { data: productsData } = useQuery({
    queryKey: ['cart-upsell-products'],
    queryFn: () => api.getProducts(0, 10),
  });

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-slate-500">
        Loading cart...
      </div>
    );
  }

  const cartItemIds = new Set(items.map(i => i.product.id));
  const upsells = productsData?.content
    ?.filter(p => !cartItemIds.has(p.id) && p.availabilityStatus === 'IN_STOCK')
    ?.slice(0, 4) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-8 border-b border-slate-200 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => clearCart()}
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
          >
            <Trash2 size={16} />
            Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-xl mx-auto">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={44} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm">
            Looks like you haven't added anything to your cart yet. Explore our fresh packaged supermarket products!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-md active:scale-98"
          >
            <ArrowLeft size={18} />
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const itemTotal = item.product.sellingPrice * item.quantity;
              const itemMrpTotal = item.product.mrp * item.quantity;
              const itemSavings = itemMrpTotal - itemTotal;

              return (
                <div
                  key={item.product.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-5 items-center justify-between"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2 border border-slate-100"
                    >
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-slate-300 text-xs">No img</span>
                      )}
                    </Link>
                    <div className="flex-1">
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="font-bold text-slate-900 hover:text-emerald-600 transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">{item.product.unit} • {item.product.brand}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-slate-900">₹{item.product.sellingPrice}</span>
                        {item.product.mrp > item.product.sellingPrice && (
                          <span className="text-xs text-slate-400 line-through">₹{item.product.mrp}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        className="text-slate-500 hover:text-slate-900 font-bold px-1"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold w-5 text-center text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="text-slate-500 hover:text-slate-900 font-bold px-1"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <div className="font-extrabold text-slate-900 text-base">₹{itemTotal.toFixed(2)}</div>
                      {itemSavings > 0 && (
                        <div className="text-[11px] font-semibold text-emerald-600">
                          Save ₹{itemSavings.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Recommendations */}
            {upsells.length > 0 && (
              <div className="pt-8 mt-8 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recommended for You</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {upsells.map(product => (
                    <div
                      key={product.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col hover:border-emerald-500/30 transition-colors shadow-sm"
                    >
                      <Link href={`/product/${product.slug}`} className="w-full h-24 mb-3 flex items-center justify-center p-2 bg-slate-50 rounded-xl">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="text-2xl">🛍️</div>
                        )}
                      </Link>
                      <div className="text-xs font-semibold text-slate-900 line-clamp-2 mb-1 flex-1">
                        {product.name}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-extrabold text-slate-900">₹{product.sellingPrice}</span>
                        <button
                          onClick={() => useCartStore.getState().addItem(product)}
                          className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors font-bold"
                          title="Add to cart"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>

              {savings > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <span>Total Savings</span>
                  <span>-₹{savings.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (5%)</span>
                <span className="font-semibold text-slate-900">₹{tax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-lg">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-extrabold text-2xl text-slate-900">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight size={18} />
            </button>

            <Link
              href="/"
              className="w-full block text-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
