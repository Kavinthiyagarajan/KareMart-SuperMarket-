"use client";

import Image from "next/link";
import Link from "next/link";
import { Product, api } from "@/lib/api";
import { useCartStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { useToastStore } from "@/lib/toastStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.availabilityStatus !== "IN_STOCK" || product.availableQuantity === 0;
  const addItem = useCartStore((state) => state.addItem);
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const addToast = useToastStore((state) => state.addToast);
  const router = useRouter();
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      api.checkWishlist(product.id).then(res => setIsWishlisted(res.exists)).catch(() => {});
    }
  }, [isAuthenticated, product.id]);

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addItem(product);
      addToast(`Added ${product.name} to cart`, 'success');
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    setIsWishlistLoading(true);
    try {
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
        setIsWishlisted(false);
        addToast(`Removed ${product.name} from wishlist`, 'info');
      } else {
        await api.addToWishlist(product.id);
        setIsWishlisted(true);
        addToast(`Added ${product.name} to wishlist`, 'success');
      }
    } catch (e) {
      console.error("Wishlist toggle failed", e);
      addToast("Failed to update wishlist", 'error');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const getBadges = () => {
    if (isOutOfStock) {
      return <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-sm tracking-wide uppercase shadow-sm">Out of Stock</span>;
    } 
    if (product.discountPercent && product.discountPercent > 0) {
      return <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-sm tracking-wide uppercase shadow-sm">{product.discountPercent}% OFF</span>;
    }
    return null;
  };

  return (
    <div className="group relative bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full">
      <button 
        onClick={handleWishlistToggle} 
        disabled={isWishlistLoading}
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <svg 
          className={`w-5 h-5 transition-colors ${isWishlisted ? 'text-red-500 fill-current' : 'text-slate-400'}`} 
          fill={isWishlisted ? "currentColor" : "none"} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isWishlisted ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start pointer-events-none">
        {getBadges()}
      </div>
      
      <Link href={`/product/${product.slug}`} className="relative h-48 w-full bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
        {product.imageUrl && !imgError ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            onError={() => setImgError(true)}
            className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="text-slate-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1 bg-white">
        <div className="text-[11px] text-slate-400 font-medium tracking-wider uppercase mb-1.5">
          {product.brand || product.category?.name || "Grocery"}
        </div>
        
        <Link href={`/product/${product.slug}`} className="text-sm font-medium text-slate-800 line-clamp-2 hover:text-primary transition-colors mb-1">
          {product.name}
        </Link>
        
        <div className="text-xs text-slate-500 mb-4">
          {product.unit || "1 unit"} 
          {product.sellingPrice && product.unit ? ` • ₹${product.sellingPrice} / ${product.unit.replace(/^1\s*/, '')}` : ''}
        </div>
        
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900">₹{product.sellingPrice}</span>
            {product.mrp > product.sellingPrice && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
              </div>
            )}
          </div>
          
          {isOutOfStock ? (
            <Link
              href={`/support?productId=${product.id}&productName=${encodeURIComponent(product.name)}&type=PRODUCT_AVAILABILITY`}
              className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200 shadow-sm"
              title="Ask about availability"
            >
              Inquire
            </Link>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-95"
              aria-label="Add to cart"
            >
              Add
            </button>
          )}
        </div>
      </div>
      
      {isOutOfStock && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-20 pointer-events-none">
        </div>
      )}
    </div>
  );
}
