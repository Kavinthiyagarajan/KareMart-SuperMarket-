'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, InventoryTransaction } from '@/lib/api';

export default function AdminInventoryHistory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const productId = searchParams.get('productId') ? parseInt(searchParams.get('productId')!) : undefined;
  const transactionType = searchParams.get('transactionType') || undefined;
  const orderNumber = searchParams.get('orderNumber') || undefined;

  const [filterType, setFilterType] = useState(transactionType || '');
  const [filterOrder, setFilterOrder] = useState(orderNumber || '');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await api.getInventoryHistory(page, 50, productId, transactionType, orderNumber);
        setTransactions(data.content);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error('Error fetching inventory history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [page, productId, transactionType, orderNumber, router]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (productId) query.set('productId', productId.toString());
    if (filterType) query.set('transactionType', filterType);
    if (filterOrder) query.set('orderNumber', filterOrder);
    
    router.push(`/admin/inventory/history?${query.toString()}`);
    setPage(0);
  };

  const getBadgeColor = (type: string) => {
    if (type.includes('ADD') || type.includes('RELEASE')) return 'bg-green-100 text-green-800';
    if (type.includes('SUBTRACT') || type.includes('RESERVATION')) return 'bg-red-100 text-red-800';
    if (type.includes('SET')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading && transactions.length === 0) {
    return <div className="p-8 text-center text-gray-600">Loading history...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Audit History</h1>
        {productId && (
          <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700">
            Filtering for Product ID: {productId}
          </span>
        )}
      </div>

      <form onSubmit={handleFilter} className="mb-6 flex gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="ADMIN_ADD">ADMIN_ADD</option>
            <option value="ADMIN_SUBTRACT">ADMIN_SUBTRACT</option>
            <option value="ADMIN_SET">ADMIN_SET</option>
            <option value="ORDER_RESERVATION">ORDER_RESERVATION</option>
            <option value="RESERVATION_RELEASE">RESERVATION_RELEASE</option>
            <option value="RESERVATION_COMMIT">RESERVATION_COMMIT</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
          <input 
            type="text" 
            value={filterOrder}
            onChange={(e) => setFilterOrder(e.target.value)}
            placeholder="Search by order..."
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
            Filter
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Actor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason / Order</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No transactions found</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{tx.productId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 text-xs">{tx.previousStock}</span>
                      <span className="text-gray-300">→</span>
                      <span className={`font-bold ${tx.quantityChange > 0 ? 'text-green-600' : tx.quantityChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {tx.quantityChange > 0 ? '+' : ''}{tx.quantityChange}
                      </span>
                      <span className="text-gray-300">→</span>
                      <span className="font-bold text-gray-900">{tx.resultingStock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(tx.transactionType)}`}>
                        {tx.transactionType}
                      </span>
                      {tx.actorUsername && (
                        <span className="text-xs text-gray-500">by {tx.actorUsername}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>{tx.reason || '-'}</span>
                      {tx.orderNumber && (
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 truncate max-w-[200px]" title={tx.orderNumber}>
                          {tx.orderNumber}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">Page {page + 1} of {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
