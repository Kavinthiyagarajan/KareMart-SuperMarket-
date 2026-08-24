"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, WishlistItemDto } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => !!state.token);
  
  const [wishlist, setWishlist] = useState<WishlistItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchWishlist = async () => {
      try {
        const items = await api.getWishlist();
        setWishlist(items);
      } catch (e) {
        console.error("Failed to fetch wishlist", e);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden min-h-full">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-900">Wishlist</h3>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading wishlist...</div>
      ) : wishlist.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Your wishlist is empty.</h3>
          <p className="text-slate-500 mb-6">Save products you love for later.</p>
          <button 
            onClick={() => router.push("/")}
            className="text-emerald-600 font-medium hover:underline"
          >
            Start shopping
          </button>
        </div>
      ) : (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
