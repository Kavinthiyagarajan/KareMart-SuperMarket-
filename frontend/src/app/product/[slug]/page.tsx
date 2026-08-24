"use client";
import React from "react";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { use, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { ProductReviews } from "@/components/ProductReviews";
import { useRecentlyViewedStore } from "@/lib/recentlyViewedStore";
import { useToastStore } from "@/lib/toastStore";

export default function ProductDetailsPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const slug = params.slug;
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);
  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addProduct);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.getProductBySlug(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product);
    }
  }, [product, addRecentlyViewed]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2 aspect-square bg-slate-100 rounded-3xl"></div>
        <div className="w-full md:w-1/2 space-y-6 pt-4">
          <div className="h-4 bg-slate-100 rounded w-1/4"></div>
          <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          <div className="h-12 bg-slate-100 rounded w-1/3"></div>
          <div className="h-24 bg-slate-100 rounded w-full"></div>
          <div className="h-12 bg-slate-200 rounded-full w-full mt-8"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-foreground mb-4">Product not found</h2>
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.availabilityStatus !== "IN_STOCK";

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-8 transition-colors">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Shopping
      </Link>

      <div className="bg-white rounded-[2rem] p-6 md:p-12 shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-12 lg:gap-20">
        {/* Product Image */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-slate-50/50 rounded-[1.5rem] p-8 aspect-square border border-slate-100">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="max-w-full max-h-[400px] object-contain mix-blend-multiply" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <svg className="w-32 h-32 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 flex flex-col py-4">
          <div className="text-sm font-semibold text-slate-400 tracking-widest uppercase mb-3">
            {product.brand || product.category?.name || "Grocery"}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
            {product.name}
          </h1>
          
          <p className="text-slate-500 text-lg mb-8 font-medium">
            {product.unit || "1 unit"}
            {product.sellingPrice && product.unit ? ` • ₹${product.sellingPrice} / ${product.unit.replace(/^1\s*/, '')}` : ''}
          </p>

          <div className="flex items-center gap-4 mb-10">
            <div className="text-4xl font-black text-slate-900">
              ₹{product.sellingPrice}
            </div>
            {product.mrp > product.sellingPrice && (
              <>
                <div className="text-xl text-slate-400 line-through">
                  ₹{product.mrp}
                </div>
                <div className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-md text-sm border border-red-100/50">
                  {product.discountPercent}% OFF
                </div>
              </>
            )}
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-foreground mb-2">Product Description</h3>
            <p className="text-slate-600 leading-relaxed">
              Experience the freshness of {product.name}. Carefully sourced from trusted partners, 
              ensuring the highest quality and taste for your family. Stored under strict quality control 
              and delivered right to your doorstep.
            </p>
          </div>

          <div className="mt-auto">
            {isOutOfStock ? (
              <div className="w-full bg-slate-100 text-slate-500 text-center font-bold py-4 rounded-full border border-border">
                Currently Out of Stock
              </div>
            ) : (
              <button 
                onClick={() => {
                  addItem(product);
                  addToast(`Added ${product.name} to cart`, 'success');
                }}
                className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-full hover:bg-primary-hover active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
      <RelatedProducts currentProduct={product} />
    </div>
  );
}

function RelatedProducts({ currentProduct }: { currentProduct: any }) {
  const { data: products } = useQuery({
    queryKey: ['related-products', currentProduct.id],
    queryFn: () => api.getRelatedProducts(currentProduct.id),
  });
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);

  if (!products || products.length === 0) return null;

  return (
    <div className="mt-16 bg-surface border border-border rounded-3xl p-6 md:p-12 shadow-sm">
      <h2 className="text-2xl font-bold text-foreground mb-6">Related Products</h2>
      
      <div className="flex items-center gap-6 overflow-x-auto pb-4">
        {products.map((p: any) => (
          <div key={p.id} className="min-w-[200px] flex-shrink-0">
            <Link href={`/product/${p.slug}`} className="group block text-center">
              <div className="w-32 h-32 mx-auto bg-slate-50 rounded-xl flex items-center justify-center p-4 border border-border group-hover:border-primary transition-colors">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-4xl">🛍️</div>
                )}
              </div>
              <div className="text-sm font-medium text-foreground mt-3 truncate group-hover:text-primary transition-colors">{p.name}</div>
              <div className="text-sm text-slate-500 font-bold mb-3">₹{p.sellingPrice}</div>
            </Link>
            <button 
              onClick={() => {
                addItem(p);
                addToast(`Added ${p.name} to cart`, 'success');
              }}
              className="w-full bg-slate-900 text-white font-bold py-2 px-4 rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-md"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
