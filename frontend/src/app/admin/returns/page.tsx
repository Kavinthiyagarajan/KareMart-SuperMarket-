'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  api,
  ReturnRequestDto,
  CancellationRequestDto,
  RequestStatus,
  RefundStatus
} from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import { useToastStore } from '@/lib/toastStore';
import {
  RotateCcw,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Search,
  RefreshCw,
  Check,
  X,
  Package,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

const STATUS_BADGES: Record<RequestStatus, { label: string; bg: string; text: string; border: string }> = {
  PENDING: {
    label: 'Pending Review',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800'
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800'
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  REJECTED: {
    label: 'Declined',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800'
  }
};

const REFUND_BADGES: Record<RefundStatus, { label: string; bg: string; text: string }> = {
  NOT_REQUESTED: { label: 'N/A', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500' },
  REQUESTED: { label: 'Refund Requested', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
  APPROVED: { label: 'Refund Approved', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300' },
  PROCESSING: { label: 'Processing', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
  COMPLETED: { label: 'Refund Completed', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
  REJECTED: { label: 'Refund Rejected', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300' }
};

export default function AdminReturnsPage() {
  const { token, role } = useAuthStore();
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState<'RETURNS' | 'CANCELLATIONS'>('RETURNS');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [returns, setReturns] = useState<ReturnRequestDto[]>([]);
  const [cancellations, setCancellations] = useState<CancellationRequestDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    type: 'RETURN' | 'CANCELLATION';
    id: number;
    orderNumber: string;
    approve: boolean;
    adminNotes: string;
  } | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Complete return modal state
  const [completeModal, setCompleteModal] = useState<{
    open: boolean;
    id: number;
    orderNumber: string;
    refundAmount: number;
    restockItems: boolean;
    adminNotes: string;
  } | null>(null);
  const [submittingComplete, setSubmittingComplete] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      if (activeTab === 'RETURNS') {
        const res = await api.getAdminReturns(statusFilter, searchQuery, 0, 50);
        setReturns(res.content || []);
      } else {
        const res = await api.getAdminCancellations(statusFilter, searchQuery, 0, 50);
        setCancellations(res.content || []);
      }
    } catch (e) {
      console.error('Failed to load admin return requests:', e);
      addToast('Failed to load requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || role !== 'ADMIN') {
      router.replace('/login');
      return;
    }
    loadRequests();
  }, [token, role, activeTab, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRequests();
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal) return;
    setSubmittingReview(true);
    try {
      if (reviewModal.type === 'RETURN') {
        await api.reviewAdminReturn(reviewModal.id, {
          approve: reviewModal.approve,
          adminNotes: reviewModal.adminNotes
        });
        addToast(`Return request #${reviewModal.id} ${reviewModal.approve ? 'approved' : 'declined'}.`, 'success');
      } else {
        await api.reviewAdminCancellation(reviewModal.id, {
          approve: reviewModal.approve,
          adminNotes: reviewModal.adminNotes
        });
        addToast(`Cancellation request #${reviewModal.id} ${reviewModal.approve ? 'approved' : 'declined'}.`, 'success');
      }
      setReviewModal(null);
      await loadRequests();
    } catch (err: any) {
      addToast(err.message || 'Failed to review request.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModal) return;
    setSubmittingComplete(true);
    try {
      await api.completeAdminReturn(completeModal.id, {
        restockItems: completeModal.restockItems,
        adminNotes: completeModal.adminNotes
      });
      addToast(`Return #${completeModal.id} completed. Refund credited & inventory updated.`, 'success');
      setCompleteModal(null);
      await loadRequests();
    } catch (err: any) {
      addToast(err.message || 'Failed to complete return.', 'error');
    } finally {
      setSubmittingComplete(false);
    }
  };

  if (!token || role !== 'ADMIN') return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Returns & Cancellations Desk</h1>
          <p className="text-sm text-slate-500 mt-1">Review customer return requests, order cancellations, and refund workflows</p>
        </div>
        <button
          onClick={loadRequests}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => { setActiveTab('RETURNS'); setStatusFilter('ALL'); }}
          className={`pb-3.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'RETURNS'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-4 h-4" /> Return Requests
        </button>
        <button
          onClick={() => { setActiveTab('CANCELLATIONS'); setStatusFilter('ALL'); }}
          className={`pb-3.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'CANCELLATIONS'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <XCircle className="w-4 h-4" /> Cancellations
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="Search order # or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Content Table / Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto" />
          <p className="text-slate-500 text-sm mt-3">Loading requests...</p>
        </div>
      ) : activeTab === 'RETURNS' ? (
        returns.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
            No return requests matching current criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map(req => {
              const statusBadge = STATUS_BADGES[req.status];
              const refundBadge = REFUND_BADGES[req.refundStatus];

              return (
                <div key={req.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:border-purple-200 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-black text-slate-900 text-sm">#{req.id}</span>
                      <Link href={`/admin/orders/${req.orderNumber}`} className="font-bold text-emerald-600 hover:underline text-sm">
                        Order #{req.orderNumber.substring(0, 8).toUpperCase()}
                      </Link>
                      <span className="text-xs font-semibold text-slate-500">Customer: <span className="text-slate-900 font-bold">{req.userId}</span></span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p><span className="font-semibold text-slate-900">Reason:</span> {req.reason.replace(/_/g, ' ')}</p>
                      {req.notes && <p><span className="font-semibold text-slate-900">Customer Note:</span> "{req.notes}"</p>}
                      <p className="text-slate-400">Submitted: {new Date(req.createdAt).toLocaleString()}</p>
                    </div>

                    {req.adminNotes && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold">Admin Feedback ({req.reviewedBy}):</span> {req.adminNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <p className="text-xs font-semibold text-slate-500">Refund Amount</p>
                      <p className="font-black text-slate-900 text-lg">₹{req.refundAmount.toFixed(2)}</p>
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold mt-1 ${refundBadge.bg} ${refundBadge.text}`}>
                        {refundBadge.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => setReviewModal({
                              open: true,
                              type: 'RETURN',
                              id: req.id,
                              orderNumber: req.orderNumber,
                              approve: true,
                              adminNotes: ''
                            })}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setReviewModal({
                              open: true,
                              type: 'RETURN',
                              id: req.id,
                              orderNumber: req.orderNumber,
                              approve: false,
                              adminNotes: ''
                            })}
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </>
                      )}

                      {req.status === 'APPROVED' && (
                        <button
                          onClick={() => setCompleteModal({
                            open: true,
                            id: req.id,
                            orderNumber: req.orderNumber,
                            refundAmount: req.refundAmount,
                            restockItems: true,
                            adminNotes: ''
                          })}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <Package className="w-3.5 h-3.5" /> Complete & Restock
                        </button>
                      )}

                      <Link
                        href={`/admin/orders/${req.orderNumber}`}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        View Order
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        cancellations.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
            No cancellations matching current criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {cancellations.map(can => {
              const statusBadge = STATUS_BADGES[can.status];
              const refundBadge = REFUND_BADGES[can.refundStatus];

              return (
                <div key={can.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:border-red-200 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-black text-slate-900 text-sm">#{can.id}</span>
                      <Link href={`/admin/orders/${can.orderNumber}`} className="font-bold text-emerald-600 hover:underline text-sm">
                        Order #{can.orderNumber.substring(0, 8).toUpperCase()}
                      </Link>
                      <span className="text-xs font-semibold text-slate-500">Customer: <span className="text-slate-900 font-bold">{can.userId}</span></span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p><span className="font-semibold text-slate-900">Reason:</span> {can.reason.replace(/_/g, ' ')}</p>
                      {can.notes && <p><span className="font-semibold text-slate-900">Customer Note:</span> "{can.notes}"</p>}
                      <p className="text-slate-400">Cancelled at: {new Date(can.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    {can.refundStatus !== 'NOT_REQUESTED' && (
                      <div className="text-left lg:text-right">
                        <p className="text-xs font-semibold text-slate-500">Refund Amount</p>
                        <p className="font-black text-slate-900 text-lg">₹{can.refundAmount?.toFixed(2) || '0.00'}</p>
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold mt-1 ${refundBadge.bg} ${refundBadge.text}`}>
                          {refundBadge.label}
                        </span>
                      </div>
                    )}

                    <Link
                      href={`/admin/orders/${can.orderNumber}`}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* REVIEW MODAL */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {reviewModal.approve ? 'Approve Return Request' : 'Decline Return Request'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Reviewing request #{reviewModal.id} for order #{reviewModal.orderNumber.substring(0, 8).toUpperCase()}.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Admin Feedback / Reason
                </label>
                <textarea
                  value={reviewModal.adminNotes}
                  onChange={(e) => setReviewModal({ ...reviewModal, adminNotes: e.target.value })}
                  rows={3}
                  placeholder={reviewModal.approve ? 'Instructions for return shipment or verification...' : 'Explain why request was declined...'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required={!reviewModal.approve}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setReviewModal(null)}
                  disabled={submittingReview}
                  className="flex-1 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`flex-1 px-5 py-3 rounded-xl font-bold text-sm text-white transition-colors shadow-lg disabled:opacity-50 ${
                    reviewModal.approve ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                  }`}
                >
                  {submittingReview ? 'Submitting...' : reviewModal.approve ? 'Confirm Approval' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE RETURN MODAL */}
      {completeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Complete Return & Finalize Refund</h3>
            <p className="text-sm text-slate-500 mb-4">
              Order #{completeModal.orderNumber.substring(0, 8).toUpperCase()} • Refund: ₹{completeModal.refundAmount.toFixed(2)}
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="restockCheck"
                  checked={completeModal.restockItems}
                  onChange={(e) => setCompleteModal({ ...completeModal, restockItems: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="restockCheck" className="text-sm font-semibold text-slate-800 cursor-pointer">
                  Restock returned items back into active inventory
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Completion Notes (Optional)
                </label>
                <textarea
                  value={completeModal.adminNotes}
                  onChange={(e) => setCompleteModal({ ...completeModal, adminNotes: e.target.value })}
                  rows={3}
                  placeholder="Items inspected and verified in warehouse..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCompleteModal(null)}
                  disabled={submittingComplete}
                  className="flex-1 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplete}
                  className="flex-1 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {submittingComplete ? 'Processing...' : 'Complete Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
