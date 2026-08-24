"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import CategoryGrid from "@/components/home/CategoryGrid";

function DealsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const categoryParam = searchParams.get('category') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const availabilityParam = searchParams.get('availability') || '';
  const sortParam = searchParams.get('sort') || 'discountDesc';

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
    if (sort && sort !== 'discountDesc') params.set('sort', sort); else params.delete('sort');
    router.push(`/deals?${params.toString()}`);
  };

  const clearFilters = () => {
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setAvailability('');
    setSort('discountDesc');
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('availability');
    params.delete('sort');
    router.push(`/deals`);
  };

  const handleSelectCategory = (slug: string) => {
    setCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('category', slug); else params.delete('category');
    router.push(`/deals?${params.toString()}`);
  };

  const { 
    data, 
    isLoading, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['deals', categoryParam, minPriceParam, maxPriceParam, availabilityParam, sortParam],
    queryFn: ({ pageParam = 0 }) => api.getDeals({
      category: categoryParam || undefined,
      minPrice: minPriceParam ? parseFloat(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
      availability: availabilityParam || undefined,
      sort: sortParam
    }, pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.number + 1,
  });

  const products = data?.pages.flatMap(page => page.content) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Deals Header Section */}
      <div className="bg-red-50 rounded-3xl p-8 md:p-12 border border-red-100 flex flex-col items-center text-center">
        <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 font-bold rounded-full text-sm mb-6 uppercase tracking-widest shadow-sm">
          Special Offers
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          KareMart <span className="text-red-600">Deals</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
          Save more on everyday supermarket essentials. Shop trusted products at reduced prices.
        </p>
      </div>

      <CategoryGrid onSelectCategory={handleSelectCategory} currentCategory={category} />

      <section>
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold text-slate-900">
            {category ? `Deals: ${category}` : "All Deals"}
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
            
            <select value={sort} onChange={e => setSort(e.target.value)} className="w-48 bg-slate-50 border-none rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary text-slate-700">
              <option value="discountDesc">Discount (High to Low)</option>
              <option value="priceAsc">Price (Low to High)</option>
              <option value="priceDesc">Price (High to Low)</option>
              <option value="nameAsc">Name (A-Z)</option>
            </select>
            
            <div className="flex-1"></div>
            
            {(minPrice || maxPrice || availability || sort !== 'discountDesc') && (
              <button onClick={clearFilters} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2">Clear</button>
            )}
            <button onClick={applyFilters} className="px-5 py-1.5 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors">Apply</button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[340px] bg-white border border-slate-200 rounded-2xl animate-pulse p-4 flex flex-col">
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
          <div className="text-center py-12 border border-red-100 bg-red-50 rounded-2xl">
            <p className="text-red-600 font-medium">Failed to load deals.</p>
            <p className="text-sm text-slate-500 mt-2">Please ensure the backend is running.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 border border-slate-200 bg-white rounded-2xl">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <p className="text-lg font-medium text-slate-900">
              No deals available right now.
            </p>
            <button 
              onClick={() => router.push('/')}
              className="mt-6 px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-colors"
            >
              Browse All Products
            </button>
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
                  className="px-8 py-3 bg-slate-100 text-slate-700 font-semibold rounded-full hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  {isFetchingNextPage ? 'Loading more...' : 'Load More Deals'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading deals...</div>}>
      <DealsContent />
    </Suspense>
  );
}
