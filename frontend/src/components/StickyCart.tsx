"use client";

import { useCartStore } from "@/lib/store";
import { useEffect, useState } from "react";

export default function StickyCart() {
  const items = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  const totalAmount = items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-primary text-primary-foreground shadow-2xl rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary-hover transition-colors" onClick={toggleCart}>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center font-bold">
            {totalItems}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Cart Total</span>
            <span className="font-extrabold text-lg">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          View Cart
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
