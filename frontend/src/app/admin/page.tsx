"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { IndianRupee, ShoppingCart, PackageOpen, Users, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardSummary {
  orders: {
    total: number;
    pendingPayment: number;
    confirmed: number;
    cancelled: number;
  };
  sales: {
    totalConfirmed: number;
    todayConfirmed: number;
    thisMonthConfirmed: number;
  };
  customers: {
    totalRegistered: number;
  };
  inventory: {
    activeProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockProducts: {
      productNumber: string;
      name: string;
      availableQuantity: number;
      availabilityStatus: string;
    }[];
  };
  payments: {
    successful: number;
    failed: number;
    pending: number;
  };
  delivery: {
    created: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
  };
  coupons: {
    active: number;
    usageCount: number;
  };
}

interface RecentOrder {
  orderNumber: string;
  createdAt: string;
  customerId: string;
  total: number;
  status: string;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const summaryData = await api.getAdminDashboardSummary();
      setSummary(summaryData);

      // Fetch latest 7 orders for chart
      const ordersData = await api.getAdminOrders(0, 7);
      setRecentOrders(ordersData.content);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl">
        <h3 className="font-bold mb-2">Dashboard Error</h3>
        <p>{error || "Unable to load data"}</p>
        <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const aov = summary.orders.confirmed > 0 ? summary.sales.totalConfirmed / summary.orders.confirmed : 0;
  
  // Calculate max order value for chart scaling
  const maxOrderValue = recentOrders.length > 0 ? Math.max(...recentOrders.map(o => o.total)) : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {summary.inventory.lowStockCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/50 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <div>
              <h3 className="text-amber-500 font-bold">Low Stock Warning</h3>
              <p className="text-sm text-amber-400/80">You have {summary.inventory.lowStockCount} items running low on inventory.</p>
            </div>
          </div>
          <Link href="/admin/products" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors text-sm">
            Restock
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          Executive Operations
        </h1>
        <p className="text-slate-400 mt-2">Monitor revenue, fulfillment, and key performance indicators.</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IndianRupee className="w-16 h-16 text-emerald-500" />
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-white mb-2">₹{summary.sales.totalConfirmed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400"><TrendingUp className="w-3 h-3" /> Month: ₹{summary.sales.thisMonthConfirmed.toFixed(0)}</span>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingCart className="w-16 h-16 text-blue-500" />
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Total Orders</h3>
          <p className="text-3xl font-bold text-white mb-2">{summary.orders.total}</p>
          <div className="flex justify-between text-xs">
            <span className="text-blue-400">{summary.orders.confirmed} Confirmed</span>
            <span className="text-amber-400">{summary.orders.pendingPayment} Pending</span>
          </div>
        </div>

        {/* AOV */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-purple-500" />
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Avg. Order Value</h3>
          <p className="text-3xl font-bold text-white mb-2">₹{aov.toFixed(2)}</p>
          <div className="text-xs text-slate-400">Calculated over confirmed orders</div>
        </div>

        {/* Inventory */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PackageOpen className="w-16 h-16 text-amber-500" />
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Active Catalog</h3>
          <p className="text-3xl font-bold text-white mb-2">{summary.inventory.activeProducts}</p>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400">In Stock</span>
            <span className="text-red-400">{summary.inventory.outOfStockCount} Out</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Performance Visual */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Recent Sales Trend</h2>
          <div className="h-64 flex items-end justify-between gap-2 relative">
             {/* Y-axis grid lines */}
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
               <div className="border-t border-white w-full"></div>
               <div className="border-t border-white w-full"></div>
               <div className="border-t border-white w-full"></div>
               <div className="border-t border-white w-full"></div>
             </div>
             
             {/* Bars */}
             {recentOrders.slice().reverse().map((order) => {
               const heightPercent = maxOrderValue > 0 ? (order.total / maxOrderValue) * 100 : 0;
               return (
                 <div key={order.orderNumber} className="relative flex flex-col items-center flex-1 group h-full justify-end z-10">
                   <div 
                     className="w-full max-w-[40px] bg-emerald-500 rounded-t-sm transition-all duration-500 hover:bg-emerald-400 relative"
                     style={{ height: `${Math.max(5, heightPercent)}%` }}
                   >
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                       ₹{order.total.toFixed(2)}
                     </div>
                   </div>
                   <div className="mt-3 text-[10px] text-slate-400 truncate w-full text-center" suppressHydrationWarning>
                     {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Action Feed */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">Action Queue</h2>
              <Link href="/admin/orders" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">Manage &rarr;</Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">No recent orders found.</p>
            ) : (
              <div className="space-y-4 flex-1">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.orderNumber} className="flex justify-between items-center border-b border-slate-700/50 pb-4 last:border-0 last:pb-0">
                    <div>
                      <Link href={`/admin/orders/${order.orderNumber}`} className="font-medium text-slate-200 hover:text-emerald-400 transition-colors text-sm">
                        #{order.orderNumber.substring(0, 8)}
                      </Link>
                      <p className="text-xs text-slate-400 mt-1">₹{order.total.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${
                        order.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400' :
                        order.status === 'SHIPPED' ? 'bg-amber-500/10 text-amber-400' :
                        order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' :
                        order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

