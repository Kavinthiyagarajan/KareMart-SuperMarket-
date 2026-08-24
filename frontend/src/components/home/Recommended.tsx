"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRecentlyViewedStore } from "@/lib/recentlyViewedStore";
import ProductCard from "@/components/ProductCard";
import { Sparkles } from "lucide-react";

export function Recommended() {
  const { data: popularProducts } = useQuery({
    queryKey: ['popular-products'],
    queryFn: () => api.getPopularProducts(),
  });

  if (!popularProducts || popularProducts.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          Popular Products
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {popularProducts.slice(0, 5).map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
