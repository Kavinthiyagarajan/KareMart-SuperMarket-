"use client";

import { useEffect, useState } from "react";
import { api, Product, OrderDetails } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export default function BuyAgain() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchPastProducts = async () => {
      try {
        setLoading(true);
        const buyAgainProducts = await api.getBuyAgainProducts();
        setProducts(buyAgainProducts.slice(0, 10)); // Limit to 10 max
      } catch (error) {
        console.error("Failed to load buy again items", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPastProducts();
  }, [token]);

  if (!mounted || !token || (products.length === 0 && !loading)) {
    return null; // Only show for logged in users with past orders
  }

  return (
    <section className="my-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Buy Again
        </h2>
        <Link href="/profile" className="text-sm text-primary font-medium hover:underline">
          View Order History
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[200px] h-64 bg-surface border border-border rounded-2xl animate-pulse p-4"></div>
          ))}
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide snap-x">
          {products.map(product => (
            <div key={product.id} className="min-w-[250px] md:min-w-[280px] snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
