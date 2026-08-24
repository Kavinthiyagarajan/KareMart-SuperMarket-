"use client";

import { useState, useEffect } from "react";
import { Layers } from "lucide-react";

export function ShowcaseBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    
    // Check if demo mode was toggled on via localStorage or if we just want it shown by default in dev
    setIsVisible(true);
  }, []);

  if (!isVisible || process.env.NODE_ENV === "production") return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-4 text-center">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-blue-200" />
        <span>Built with <strong>Next.js 14 App Router</strong></span>
      </div>
      <div className="hidden md:block w-1 h-1 rounded-full bg-blue-400"></div>
      <div className="hidden md:flex items-center gap-2">
        <span><strong>Spring Boot 3</strong> Backend</span>
      </div>
      <div className="hidden md:block w-1 h-1 rounded-full bg-blue-400"></div>
      <div className="hidden lg:flex items-center gap-2">
        <span><strong>PostgreSQL</strong> via Flyway</span>
      </div>
    </div>
  );
}
