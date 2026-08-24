"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Database, ShoppingBag, Code, ShieldCheck, X } from "lucide-react";

export function DemoBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeedingOrders, setIsSeedingOrders] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setIsVisible(v => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isVisible || process.env.NODE_ENV === "production") return null;

  const handleSeedCatalog = async () => {
    setIsSeeding(true);
    try {
      await api.seedCatalog();
      alert("Catalog seeded successfully!");
      window.location.reload();
    } catch (e) {
      alert("Failed to seed catalog");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSeedOrders = async () => {
    setIsSeedingOrders(true);
    try {
      await api.seedOrders();
      alert("Orders seeded successfully!");
    } catch (e) {
      alert("Failed to seed orders");
    } finally {
      setIsSeedingOrders(false);
    }
  };

  const roles = [
    { name: "Customer", path: "/", icon: <ShoppingBag className="w-4 h-4 mr-2" /> },
    { name: "Admin Console", path: "/admin", icon: <ShieldCheck className="w-4 h-4 mr-2" /> },
    { name: "Order Manager", path: "/admin/orders", icon: <Database className="w-4 h-4 mr-2" /> }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-900 text-white border-t border-slate-700 p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 text-primary p-2 rounded-lg">
          <Code className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-sm">Demo Controller</div>
          <div className="text-xs text-slate-400">Shift+D to toggle</div>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto">
        {roles.map((role, idx) => (
          <button
            key={idx}
            onClick={() => router.push(role.path)}
            className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {role.icon}
            {role.name}
          </button>
        ))}

        <div className="w-px h-6 bg-slate-700 mx-2"></div>

        <button
          onClick={handleSeedCatalog}
          disabled={isSeeding}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          {isSeeding ? "Seeding..." : "Seed Catalog"}
        </button>

        <button
          onClick={handleSeedOrders}
          disabled={isSeedingOrders}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          {isSeedingOrders ? "Generating..." : "Seed Orders"}
        </button>

        <button onClick={() => setIsVisible(false)} className="p-2 hover:bg-slate-800 rounded-lg ml-2">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
