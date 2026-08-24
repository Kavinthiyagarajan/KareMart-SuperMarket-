"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface AdminOrderSummary {
  orderNumber: string;
  customerId: string;
  status: string;
  total: number;
  createdAt: string;
  paymentStatus: string;
  deliveryStatus: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingRow, setUpdatingRow] = useState<string | null>(null);

  const fetchOrders = async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getAdminOrders(p, 20, statusFilter, searchQuery);
      setOrders(response.content);
      setTotalPages(response.totalPages);
      setPage(p);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(0);
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(0);
  };

  const handleStatusUpdate = async (orderNumber: string, newStatus: string) => {
    setUpdatingRow(orderNumber);
    try {
      await api.updateAdminOrderStatus(orderNumber, newStatus);
      // Immediately reflect the change in local state
      setOrders(orders.map(o => o.orderNumber === orderNumber ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingRow(null);
    }
  };

  const tabs = [
    { label: 'All', value: 'All' },
    { label: 'Pending Payment', value: 'PENDING_PAYMENT' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  const allowedTransitions: Record<string, string[]> = {
    'PENDING_PAYMENT': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['SHIPPED', 'CANCELLED'],
    'SHIPPED': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [],
    'CANCELLED': []
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Fulfillment Queue
          </h1>
          <p className="text-gray-400 mt-2">Manage incoming orders and update delivery statuses.</p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            Search
          </button>
        </form>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden mb-8">
        
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-700 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                statusFilter === tab.value
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-750'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 m-6 rounded-lg">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/50">
                <th className="py-4 font-semibold px-6">Order</th>
                <th className="py-4 font-semibold px-6">Date</th>
                <th className="py-4 font-semibold px-6">Customer</th>
                <th className="py-4 font-semibold px-6">Total</th>
                <th className="py-4 font-semibold px-6">Payment</th>
                <th className="py-4 font-semibold px-6 w-48">Status Updater</th>
                <th className="py-4 font-semibold px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.orderNumber} className={`border-b border-slate-700/50 hover:bg-slate-750/50 transition-colors ${updatingRow === order.orderNumber ? 'opacity-50' : ''}`}>
                    <td className="py-4 px-6 font-mono text-sm">#{order.orderNumber.substring(0, 8)}</td>
                    <td className="py-4 px-6 text-sm" suppressHydrationWarning>{new Date(order.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-4 px-6 text-sm truncate max-w-[120px]" title={order.customerId}>{order.customerId}</td>
                    <td className="py-4 px-6 font-semibold">₹{order.total.toFixed(2)}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${order.paymentStatus === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {order.paymentStatus || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.orderNumber, e.target.value)}
                        disabled={updatingRow === order.orderNumber || allowedTransitions[order.status]?.length === 0}
                        className={`w-full text-xs font-bold uppercase px-3 py-2 rounded-lg border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer ${
                          order.status === 'CONFIRMED' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                          order.status === 'SHIPPED' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                          order.status === 'DELIVERED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          order.status === 'CANCELLED' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                          'bg-slate-800 border-slate-600 text-slate-300'
                        }`}
                      >
                        <option value={order.status}>{order.status}</option>
                        {allowedTransitions[order.status]?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        href={`/admin/orders/${order.orderNumber}`}
                        className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors bg-blue-500/10 px-4 py-2 rounded-lg hover:bg-blue-500/20"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-6 flex justify-between items-center border-t border-slate-700 bg-slate-900/30">
            <button
              disabled={page === 0}
              onClick={() => fetchOrders(page - 1)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400 font-medium">
              Page <span className="text-slate-200">{page + 1}</span> of <span className="text-slate-200">{totalPages}</span>
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => fetchOrders(page + 1)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
