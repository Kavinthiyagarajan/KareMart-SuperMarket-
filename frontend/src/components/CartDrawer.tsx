"use client";

import { useCartStore } from "@/lib/store";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity } = useCartStore();
  const router = useRouter();

  if (!isOpen) return null;

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalMrp = items.reduce((acc, item) => acc + (item.product.mrp * item.quantity), 0);
  const subtotal = items.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
  const savings = totalMrp - subtotal;

  const closeCart = () => setIsOpen(false);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeCart}></div>

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Your Cart ({totalItems})</h2>
          <button onClick={closeCart} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {items.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-slate-900">Your cart is waiting</p>
              <p className="text-sm mt-1 mb-8">Add items to start shopping</p>
              <button onClick={closeCart} className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors">Start shopping</button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60">
                  <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                  </div>
                  <div className="flex-1 flex flex-col py-1">
                    <h4 className="font-semibold text-sm line-clamp-1 text-slate-900">{item.product.name}</h4>
                    <span className="text-xs text-slate-500 mb-3">{item.product.unit}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="font-bold text-slate-900">₹{item.product.sellingPrice}</div>
                      
                      <div className="flex items-center gap-3 border border-slate-200 rounded-lg px-2 py-1">
                        <button onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))} className="text-slate-400 hover:text-slate-900">-</button>
                        <span className="text-xs font-medium w-4 text-center text-slate-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="text-slate-400 hover:text-slate-900">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <CartUpsells cartItems={items} />
              
              {savings > 0 && (
                <div className="bg-emerald-50 text-emerald-700 text-sm p-4 rounded-2xl border border-emerald-100 flex items-center justify-between font-medium">
                  <span>Total Savings</span>
                  <span>₹{savings.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-white">
             <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="text-xl font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
             </div>
             <button 
                onClick={() => {
                  setIsOpen(false);
                  router.push('/checkout');
                }}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]"
              >
                Proceed to Checkout
              </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

function CartUpsells({ cartItems }: { cartItems: any[] }) {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(0, 10),
  });
  const addItem = useCartStore((state) => state.addItem);

  if (!products) return null;

  // Filter out items already in cart
  const cartItemIds = new Set(cartItems.map(i => i.product.id));
  const upsells = products.content
    .filter(p => !cartItemIds.has(p.id) && p.availabilityStatus === 'IN_STOCK')
    .slice(0, 4);

  if (upsells.length === 0) return null;

  return (
    <div className="pt-6 border-t border-border mt-6">
      <h3 className="text-sm font-bold text-foreground mb-4">You Might Also Like</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
        {upsells.map(product => (
          <div key={product.id} className="min-w-[140px] w-[140px] snap-start bg-slate-50 border border-border rounded-xl p-3 flex flex-col hover:border-primary/30 transition-colors">
            <Link href={`/product/${product.slug}`} onClick={() => useCartStore.getState().setIsOpen(false)} className="w-full h-24 mb-2 flex items-center justify-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-xl">🛍️</div>
              )}
            </Link>
            <div className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-1 flex-1">
              {product.name}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-black text-foreground">₹{product.sellingPrice}</span>
              <button 
                onClick={() => addItem(product)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
