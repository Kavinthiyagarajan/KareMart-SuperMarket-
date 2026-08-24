"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/lib/api";

export default function DealOfDay({ product }: { product: Product }) {
  const [timeLeft, setTimeLeft] = useState({ h: 12, m: 0, s: 0 });

  useEffect(() => {
    // Generate a deterministically random end time for today
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const timer = setInterval(() => {
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ h: 0, m: 0, s: 0 });
      } else {
        setTimeLeft({
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-1 shadow-lg text-white">
      <div className="bg-surface text-foreground rounded-[22px] p-6 h-full flex flex-col md:flex-row gap-8 items-center border border-white/20">
        <div className="flex-1 space-y-4 w-full text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold px-3 py-1 rounded-full text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            Deal of the Day
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">{product.name}</h2>
          <p className="text-slate-500 line-clamp-2">Grab this exclusive offer before time runs out. Highest quality guaranteed.</p>
          
          <div className="flex items-end justify-center md:justify-start gap-3 mt-4">
            <span className="text-4xl font-black text-red-600">₹{product.sellingPrice}</span>
            <span className="text-xl text-slate-400 line-through mb-1">₹{product.mrp}</span>
          </div>

          <div className="flex gap-4 justify-center md:justify-start mt-6 pt-4 border-t border-border">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-bold text-xl">{String(timeLeft.h).padStart(2, '0')}</div>
              <span className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Hours</span>
            </div>
            <div className="text-2xl font-bold text-slate-300 mt-2">:</div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-bold text-xl">{String(timeLeft.m).padStart(2, '0')}</div>
              <span className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Mins</span>
            </div>
            <div className="text-2xl font-bold text-slate-300 mt-2">:</div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-xl flex items-center justify-center font-bold text-xl">{String(timeLeft.s).padStart(2, '0')}</div>
              <span className="text-[10px] text-red-500 uppercase mt-1 font-bold">Secs</span>
            </div>
          </div>
          
          <div className="mt-4 max-w-sm mx-auto md:mx-0">
            {(() => {
              // Deterministically generate a 'claimed' percentage for visual effect
              // based on product id so it's consistent
              const seed = product.id * 17;
              const claimedPct = 60 + (seed % 35); // 60% to 95%
              
              return (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Already Sold: {claimedPct}%</span>
                    <span>Available: {product.availableQuantity}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div 
                      className="bg-red-500 h-2.5 rounded-full" 
                      style={{ width: `${claimedPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })()}
          </div>
          
          <div className="pt-4">
            <Link 
              href={`/product/${product.slug}`}
              className="inline-block w-full md:w-auto text-center bg-red-600 text-white font-bold px-8 py-3 rounded-full hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
            >
              Shop Deal Now
            </Link>
          </div>
        </div>
        <div className="w-full md:w-1/2 aspect-square max-h-[300px] relative bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex items-center justify-center">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="text-slate-300">No Image</div>
          )}
          {product.discountPercent && product.discountPercent > 0 ? (
             <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 font-black px-4 py-2 rounded-full rotate-12 shadow-lg text-lg">
               {product.discountPercent}% OFF
             </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
