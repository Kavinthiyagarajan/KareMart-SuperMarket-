"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useRecentlyViewedStore } from "@/lib/recentlyViewedStore";

import HeroBanner from "@/components/home/HeroBanner";
import CategoryGrid from "@/components/home/CategoryGrid";
import ValuePropStrip from "@/components/home/ValuePropStrip";
import { DealsSection } from "@/components/home/DealsSection";
import DealOfDay from "@/components/home/DealOfDay";
import BuyAgain from "@/components/home/BuyAgain";
import { Recommended } from "@/components/home/Recommended";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const categoryParam = searchParams.get('category') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const availabilityParam = searchParams.get('availability') || '';
  const sortParam = searchParams.get('sort') || 'relevance';

  const [category, setCategory] = useState(categoryParam);
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [availability, setAvailability] = useState(availabilityParam);
  const [sort, setSort] = useState(sortParam);

  useEffect(() => {
    setCategory(categoryParam);
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
    setAvailability(availabilityParam);
    setSort(sortParam);
  }, [categoryParam, minPriceParam, maxPriceParam, availabilityParam, sortParam]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) params.set('category', category); else params.delete('category');
    if (minPrice) params.set('minPrice', minPrice); else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice); else params.delete('maxPrice');
    if (availability) params.set('availability', availability); else params.delete('availability');
    if (sort && sort !== 'relevance') params.set('sort', sort); else params.delete('sort');
    router.push(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setAvailability('');
    setSort('relevance');
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('availability');
    params.delete('sort');
    router.push(`/?${params.toString()}`);
  };

  const handleSelectCategory = (slug: string) => {
    setCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('category', slug); else params.delete('category');
    router.push(`/?${params.toString()}`);
  };

  const { 
    data, 
    isLoading, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['products', q, categoryParam, minPriceParam, maxPriceParam, availabilityParam, sortParam],
    queryFn: ({ pageParam = 0 }) => api.searchProducts({
      q: q || undefined,
      category: categoryParam || undefined,
      minPrice: minPriceParam ? parseFloat(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
      availability: availabilityParam || undefined,
      sort: sortParam !== 'relevance' ? sortParam : undefined
    }, pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.number + 1,
  });

  const products = data?.pages.flatMap(page => page.content) || [];
  const dealProduct = products.length > 0 ? products[0] : null;

  return (
    <div className="space-y-12">
      <HeroBanner />
      <ValuePropStrip />

      {!q && !categoryParam && (
        <DealsSection />
      )}

      {!q && (
        <CategoryGrid onSelectCategory={handleSelectCategory} currentCategory={category} />
      )}

      {!q && !categoryParam && (
        <Recommended />
      )}

      {!q && !categoryParam && dealProduct && (
        <DealOfDay product={dealProduct} />
      )}

      {!q && <BuyAgain />}

      <section id="product-catalog">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold text-foreground">
            {q ? `Search Results for "${q}"` : category ? `Category: ${category}` : "All Products"}
          </h2>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              <span className="text-sm font-medium text-slate-700">Filters</span>
            </div>
            
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min ₹" className="w-24 bg-slate-50 border-none rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary" />
            <span className="text-slate-400">-</span>
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max ₹" className="w-24 bg-slate-50 border-none rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary" />
            
            <select value={availability} onChange={e => setAvailability(e.target.value)} className="w-32 bg-slate-50 border-none rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary text-slate-700">
              <option value="">Any Stock</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
            
            <select value={sort} onChange={e => setSort(e.target.value)} className="w-40 bg-slate-50 border-none rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary text-slate-700">
              <option value="relevance">Relevance</option>
              <option value="nameAsc">Name (A-Z)</option>
              <option value="priceAsc">Price (Low-High)</option>
              <option value="priceDesc">Price (High-Low)</option>
            </select>
            
            <div className="flex-1"></div>
            
            {(minPrice || maxPrice || availability || sort !== 'relevance') && (
              <button onClick={clearFilters} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2">Clear</button>
            )}
            <button onClick={applyFilters} className="px-5 py-1.5 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors">Apply</button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[340px] bg-surface border border-border rounded-2xl animate-pulse p-4 flex flex-col">
                <div className="h-48 bg-slate-100 rounded-xl mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-2"></div>
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="mt-auto flex justify-between items-center">
                  <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 border border-destructive/20 bg-destructive/5 rounded-2xl">
            <p className="text-destructive font-medium">Failed to load products.</p>
            <p className="text-sm text-slate-500 mt-2">Please ensure the backend is running.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 border border-border bg-surface rounded-2xl">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-medium text-foreground">
              {q ? "No products matched your search or filters." : "No products available yet."}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {q ? "Try searching with different keywords or clearing filters." : "Try syncing from the partner API."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {hasNextPage && (
              <div className="mt-12 text-center">
                <button 
                  onClick={() => fetchNextPage()} 
                  disabled={isFetchingNextPage}
                  className="px-8 py-3 bg-slate-200 text-slate-700 font-semibold rounded-full hover:bg-slate-300 disabled:opacity-50 transition-colors"
                >
                  {isFetchingNextPage ? 'Loading more...' : 'Load More Products'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Recently Viewed */}
      <RecentlyViewedSection />
    </div>
  );
}

function RecentlyViewedSection() {
  const [mounted, setMounted] = useState(false);
  const recentlyViewed = useRecentlyViewedStore((state) => state.products);
  const clearHistory = useRecentlyViewedStore((state) => state.clearHistory);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || recentlyViewed.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">Recently Viewed</h2>
        <button onClick={clearHistory} className="text-sm text-slate-500 hover:text-destructive transition-colors">
          Clear History
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recentlyViewed.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading shop...</div>}>
      <HomeContent />
    </Suspense>
  );
}
