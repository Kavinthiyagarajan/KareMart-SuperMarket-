"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { useState, useEffect } from "react";

export function DealsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['home-deals'],
    queryFn: () => api.getDeals({ sort: 'discountDesc' }, 0, 4)
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) return null;

  const deals = data?.content || [];
  if (deals.length === 0) return null;

  return (
    <section className="bg-red-50/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12 border-y border-red-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Deals You'll Love
            </h2>
            <p className="text-sm text-slate-600 mt-1">Special offers on everyday essentials</p>
          </div>
          <Link 
            href="/deals"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-red-200 text-red-700 font-semibold rounded-full hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
          >
            View All Deals
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {deals.slice(0, 4).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
