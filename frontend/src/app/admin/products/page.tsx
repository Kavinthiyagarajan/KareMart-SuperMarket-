"use client";

import { useQuery } from "@tanstack/react-query";
import { api, Product } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminProductsPage() {
  const router = useRouter();
  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.getAdminProducts(0, 100),
  });

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '', sku: '', barcode: '', brand: '', imageUrl: '', mrp: 0, sellingPrice: 0, availableQuantity: 0, unit: ''
  });
  const [stockForm, setStockForm] = useState({ operation: 'ADD', amount: 0 });

  const { data: priceHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['price-history', selectedProductId],
    queryFn: () => api.getPriceHistory(selectedProductId!),
    enabled: !!selectedProductId,
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({ name: '', sku: '', barcode: '', brand: '', imageUrl: '', mrp: 0, sellingPrice: 0, availableQuantity: 0, unit: '' });
    setIsProductModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '', sku: product.sku || '', barcode: product.barcode || '', brand: product.brand || '', imageUrl: product.imageUrl || '',
      mrp: product.mrp || 0, sellingPrice: product.sellingPrice || 0, availableQuantity: product.availableQuantity || 0, unit: product.unit || ''
    });
    setIsProductModalOpen(true);
  };

  const openStockModal = (product: Product) => {
    setEditingProduct(product);
    setStockForm({ operation: 'ADD', amount: 0 });
    setIsStockModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productForm);
      } else {
        await api.createProduct(productForm);
      }
      setIsProductModalOpen(false);
      refetch();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoading(true);
    try {
      await api.updateStock(editingProduct.id, stockForm.operation, Number(stockForm.amount));
      setIsStockModalOpen(false);
      refetch();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this product?`)) return;
    try {
      await api.toggleProductStatus(id, !currentStatus);
      refetch();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Catalog Management</h2>
        <button 
          onClick={openAddModal}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700"
        >
          + Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {products?.content?.map((product: any) => (
                <tr key={product.id} className={`hover:bg-slate-50 ${!product.active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{product.name}</div>
                    <div className="text-xs text-slate-500">{product.sku} | {product.brand}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">₹{product.sellingPrice}</div>
                    {product.mrp > product.sellingPrice && <div className="text-xs text-slate-400 line-through">₹{product.mrp}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-bold">{product.availableQuantity} {product.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.availabilityStatus === 'IN_STOCK' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {product.availabilityStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(product)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => openStockModal(product)} className="text-emerald-600 hover:text-emerald-900 mr-4">Stock</button>
                    <button onClick={() => setSelectedProductId(product.id)} className="text-slate-600 hover:text-slate-900 mr-4">History</button>
                    <button onClick={() => router.push(`/admin/inventory/history?productId=${product.id}`)} className="text-purple-600 hover:text-purple-900 mr-4">Inv. Audit</button>
                    <button onClick={() => handleToggleStatus(product.id, product.active)} className="text-red-600 hover:text-red-900">
                      {product.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700">Name</label>
              <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">SKU</label>
                <input type="text" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" /></div>
                <div><label className="block text-sm font-medium text-slate-700">Brand</label>
                <input type="text" value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">MRP (₹)</label>
                <input required type="number" step="0.01" value={productForm.mrp} onChange={e => setProductForm({...productForm, mrp: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" /></div>
                <div><label className="block text-sm font-medium text-slate-700">Selling Price (₹)</label>
                <input required type="number" step="0.01" value={productForm.sellingPrice} onChange={e => setProductForm({...productForm, sellingPrice: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" /></div>
              </div>

              {!editingProduct && (
                <div><label className="block text-sm font-medium text-slate-700">Initial Stock</label>
                <input required type="number" min="0" value={productForm.availableQuantity} onChange={e => setProductForm({...productForm, availableQuantity: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" /></div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">{loading ? 'Saving...' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {isStockModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-2">Adjust Stock</h3>
            <p className="text-sm text-slate-500 mb-4">Current Stock: <strong className="text-slate-900">{editingProduct.availableQuantity}</strong></p>
            
            <form onSubmit={handleSaveStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Operation</label>
                <select value={stockForm.operation} onChange={e => setStockForm({...stockForm, operation: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border">
                  <option value="ADD">Add (+)</option>
                  <option value="SUBTRACT">Subtract (-)</option>
                  <option value="SET">Set (=)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Amount</label>
                <input required type="number" min="0" value={stockForm.amount} onChange={e => setStockForm({...stockForm, amount: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">{loading ? 'Saving...' : 'Update Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {selectedProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Price History (Append-Only)</h3>
              <button onClick={() => setSelectedProductId(null)} className="text-slate-400 hover:text-slate-600">
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {isLoadingHistory ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-slate-100 rounded"></div>
                  <div className="h-10 bg-slate-100 rounded"></div>
                </div>
              ) : priceHistory && priceHistory.length > 0 ? (
                <div className="space-y-4">
                  {priceHistory.map((history, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 border border-slate-200 rounded-xl">
                      <div>
                        <div className="font-semibold text-slate-900">Selling Price: ₹{history.sellingPrice}</div>
                        <div className="text-sm text-slate-500">MRP: ₹{history.mrp}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Effective From</div>
                        <div className="text-sm font-medium text-slate-700" suppressHydrationWarning>
                          {new Date(history.effectiveFrom).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No price history found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
