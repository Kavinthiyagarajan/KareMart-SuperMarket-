'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { api, Product } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

export default function BuyAgainPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [buyAgainProducts, setBuyAgainProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    
    api.getBuyAgainProducts()
      .then(res => setBuyAgainProducts(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden min-h-full">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">Buy Again</h3>
      </div>
      
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading products...</div>
      ) : buyAgainProducts.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Nothing to show yet.</h3>
          <p className="text-slate-500 mb-6">Products you purchase will appear here so you can reorder them easily.</p>
        </div>
      ) : (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {buyAgainProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
