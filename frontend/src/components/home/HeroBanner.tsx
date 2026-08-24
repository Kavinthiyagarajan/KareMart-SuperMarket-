"use client";

import { useState, useEffect } from "react";

export default function HeroBanner() {
  const slides = [
    {
      title: "Everyday Essentials",
      subtitle: "Smart Shopping",
      desc: "Shop trusted supermarket essentials with transparent pricing, secure checkout, and easy order tracking.",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      img: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=1000",
      cta: "Shop Essentials"
    },
    {
      title: "Reliable Delivery",
      subtitle: "Transparent Pricing",
      desc: "Stock up your pantry with packaged goods and household items, securely delivered.",
      bg: "bg-blue-50 dark:bg-blue-950/20",
      img: "https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&q=80&w=1000",
      cta: "Order Now"
    }
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative rounded-3xl overflow-hidden min-h-[320px] shadow-sm border border-border group grid">
      {slides.map((slide, index) => (
        <div 
          key={index}
          className={`col-start-1 row-start-1 transition-opacity duration-1000 flex flex-col md:flex-row items-stretch justify-between ${index === current ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'} ${slide.bg}`}
        >
          <div className="p-8 md:p-12 lg:p-16 md:py-20 max-w-2xl relative z-20 w-full md:w-1/2 flex flex-col items-start justify-center min-h-[320px]">
            <span className="inline-block px-3 py-1 bg-primary/20 text-primary-hover font-bold rounded-full text-sm mb-4 uppercase tracking-wider">
              {slide.subtitle}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-4 leading-tight">
              {slide.title}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-md">
              {slide.desc}
            </p>
            <button 
              onClick={() => document.getElementById('product-catalog')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-full hover:bg-primary-hover transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1"
            >
              {slide.cta}
            </button>
          </div>
          <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden hidden sm:block">
             <div 
               className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear"
               style={{ 
                 backgroundImage: `url('${slide.img}')`,
                 transform: index === current ? 'scale(1.1)' : 'scale(1)'
               }}
             >
               <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/20 md:block hidden"></div>
             </div>
          </div>
        </div>
      ))}
      
      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === current ? 'bg-primary w-8' : 'bg-slate-300 dark:bg-slate-700'}`}
          />
        ))}
      </div>
    </div>
  );
}
