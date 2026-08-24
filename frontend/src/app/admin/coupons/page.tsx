"use client";

import { useQuery } from "@tanstack/react-query";
import { api, AdminCoupon } from "@/lib/api";
import { useState } from "react";

export default function AdminCouponsPage() {
  const [page, setPage] = useState(0);
  const [searchCode, setSearchCode] = useState("");
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-coupons', page, searchCode],
    queryFn: () => api.getAdminCoupons(page, 10, searchCode),
  });

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 0,
    perCustomerLimit: 0,
    validFrom: '',
    validUntil: '',
    active: true
  });

  const { data: usageData, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['admin-coupon-usage', editingCoupon?.id],
    queryFn: () => editingCoupon ? api.getCouponUsage(editingCoupon.id) : null,
    enabled: !!editingCoupon && isUsageModalOpen,
  });

  const openAddModal = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '', description: '', discountType: 'PERCENTAGE', discountValue: 0,
      minOrderValue: 0, maxDiscount: 0, usageLimit: 0, perCustomerLimit: 0,
      validFrom: '', validUntil: '', active: true
    });
    setIsCouponModalOpen(true);
  };

  const openEditModal = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue || 0,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || 0,
      usageLimit: coupon.usageLimit || 0,
      perCustomerLimit: coupon.perCustomerLimit || 0,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : '',
      active: coupon.active
    });
    setIsCouponModalOpen(true);
  };

  const openUsageModal = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    setIsUsageModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Format dates to ISO
    const payload = { ...couponForm };
    if (payload.validFrom) payload.validFrom = new Date(payload.validFrom).toISOString();
    else payload.validFrom = null as any;
    
    if (payload.validUntil) payload.validUntil = new Date(payload.validUntil).toISOString();
    else payload.validUntil = null as any;

    try {
      if (editingCoupon) {
        await api.updateCoupon(editingCoupon.id, payload);
      } else {
        await api.createCoupon(payload);
      }
      setIsCouponModalOpen(false);
      refetch();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this coupon?`)) return;
    try {
      await api.toggleCouponStatus(id, !currentStatus);
      refetch();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Coupon Management</h2>
        <div className="flex space-x-4">
          <input 
            type="text" 
            placeholder="Search by code..." 
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <button 
            onClick={openAddModal}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700"
          >
            + Create Coupon
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Validity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data?.content?.map((coupon: AdminCoupon) => (
                <tr key={coupon.id} className={`hover:bg-slate-50 ${!coupon.active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{coupon.code}</div>
                    <div className="text-xs text-slate-500">{coupon.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-indigo-600">
                      {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                    </div>
                    {coupon.minOrderValue > 0 && <div className="text-xs text-slate-500">Min Order: ₹{coupon.minOrderValue}</div>}
                    {coupon.maxDiscount > 0 && <div className="text-xs text-slate-500">Max Disc: ₹{coupon.maxDiscount}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-slate-600" suppressHydrationWarning>
                      From: {coupon.validFrom ? new Date(coupon.validFrom).toLocaleString() : 'Anytime'}
                    </div>
                    <div className="text-xs text-slate-600" suppressHydrationWarning>
                      Until: {coupon.validUntil ? new Date(coupon.validUntil).toLocaleString() : 'No expiry'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{coupon.currentUsage}</div>
                    {coupon.usageLimit > 0 && <div className="text-xs text-slate-500">Limit: {coupon.usageLimit}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      coupon.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {coupon.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(coupon)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => openUsageModal(coupon)} className="text-blue-600 hover:text-blue-900 mr-4">Usage</button>
                    <button onClick={() => handleToggleStatus(coupon.id, coupon.active)} className="text-red-600 hover:text-red-900">
                      {coupon.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-sm text-slate-600">
        <div>
          Showing page {page + 1} of {data?.totalPages || 1}
        </div>
        <div className="space-x-2">
          <button 
            disabled={page === 0} 
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            disabled={!data || page >= data.totalPages - 1} 
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 mt-10">
            <h3 className="text-lg font-bold mb-4">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Code</label>
                  <input required type="text" value={couponForm.code} disabled={!!editingCoupon} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border disabled:bg-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Description</label>
                  <input type="text" value={couponForm.description} onChange={e => setCouponForm({...couponForm, description: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
                </div>
              </div>

              {!editingCoupon && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Discount Type</label>
                    <select value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border">
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Discount Value</label>
                    <input required type="number" step="0.01" min="0" value={couponForm.discountValue} onChange={e => setCouponForm({...couponForm, discountValue: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Min Order Value (₹)</label>
                  <input type="number" step="0.01" min="0" value={couponForm.minOrderValue} onChange={e => setCouponForm({...couponForm, minOrderValue: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Max Discount (₹)</label>
                  <input type="number" step="0.01" min="0" value={couponForm.maxDiscount} onChange={e => setCouponForm({...couponForm, maxDiscount: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Global Usage Limit (0 = unlimited)</label>
                  <input type="number" min="0" value={couponForm.usageLimit} onChange={e => setCouponForm({...couponForm, usageLimit: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Per Customer Limit (0 = unlimited)</label>
                  <input type="number" min="0" value={couponForm.perCustomerLimit} onChange={e => setCouponForm({...couponForm, perCustomerLimit: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Valid From</label>
                  <input type="datetime-local" value={couponForm.validFrom} onChange={e => setCouponForm({...couponForm, validFrom: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Valid Until</label>
                  <input type="datetime-local" value={couponForm.validUntil} onChange={e => setCouponForm({...couponForm, validUntil: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
                </div>
              </div>

              {!editingCoupon && (
                <div className="flex items-center">
                  <input type="checkbox" checked={couponForm.active} onChange={e => setCouponForm({...couponForm, active: e.target.checked})} className="mr-2 rounded border-slate-300" />
                  <label className="text-sm font-medium text-slate-700">Active</label>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsCouponModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">{loading ? 'Saving...' : 'Save Coupon'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {isUsageModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4">Coupon Usage Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Total Usage</span>
                <span className="font-bold text-slate-900">{usageData?.totalUsage ?? 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Global Limit</span>
                <span className="font-bold text-slate-900">{usageData?.usageLimit || 'Unlimited'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Per Customer Limit</span>
                <span className="font-bold text-slate-900">{usageData?.perCustomerLimit || 'Unlimited'}</span>
              </div>
              {usageData?.remainingUsage != null && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Remaining Usage</span>
                  <span className="font-bold text-indigo-600">{usageData.remainingUsage}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setIsUsageModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
