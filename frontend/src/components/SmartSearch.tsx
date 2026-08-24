"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, Product } from "@/lib/api";
import Link from "next/link";

export default function SmartSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await api.searchProducts({ q: query.trim() }, 0, 3);
        setSuggestions(result.content);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updatedSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    
    setIsFocused(false);
    router.push(`/?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search premium products..." 
        className="w-full bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
      />
      {query ? (
        <button 
          onClick={() => {
            setQuery('');
            setSuggestions([]);
            router.push('/');
          }}
          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <svg className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )}

      {/* Autosuggest Dropdown */}
      {isFocused && (query.trim() || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          {!query.trim() && recentSearches.length > 0 && (
            <div className="p-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Searches</h4>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setQuery(term);
                      handleSearch(term);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() && (
            <div className="p-2">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500 animate-pulse">Searching...</div>
              ) : suggestions.length > 0 ? (
                <>
                  <h4 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Matches</h4>
                  {suggestions.map((product) => (
                    <Link 
                      key={product.id} 
                      href={`/product/${product.slug}`}
                      onClick={() => setIsFocused(false)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                    >
                      <div className="w-12 h-12 bg-white rounded-lg p-1 border border-border flex items-center justify-center flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 rounded"></div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
                        <div className="text-xs text-slate-500 truncate">{product.category?.name || 'Grocery'}</div>
                      </div>
                      <div className="text-sm font-bold text-primary whitespace-nowrap">
                        ₹{product.sellingPrice}
                      </div>
                    </Link>
                  ))}
                  <button 
                    onClick={() => handleSearch(query)}
                    className="w-full text-center py-3 mt-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors"
                  >
                    View all results for "{query}"
                  </button>
                </>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  No products found matching "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
