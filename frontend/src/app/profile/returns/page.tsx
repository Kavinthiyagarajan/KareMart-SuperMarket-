'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  api,
  ReturnRequestDto,
  CancellationRequestDto,
  CustomerRefundDto,
  RequestStatus,
  RefundStatus
} from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import {
  RotateCcw,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ChevronRight,
  HelpCircle,
  FileText,
  ShoppingBag,
  RefreshCw,
  Search
} from 'lucide-react';

const STATUS_BADGES: Record<RequestStatus, { label: string; bg: string; text: string; border: string }> = {
  PENDING: {
    label: 'Under Review',
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
  COMPLETED: { label: 'Refund Credited', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
  REJECTED: { label: 'Refund Rejected', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300' }
};

export default function ReturnsRefundsPage() {
  const { token } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'ALL' | 'RETURNS' | 'CANCELLATIONS' | 'REFUNDS'>('ALL');
  const [returns, setReturns] = useState<ReturnRequestDto[]>([]);
  const [cancellations, setCancellations] = useState<CancellationRequestDto[]>([]);
  const [refunds, setRefunds] = useState<CustomerRefundDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [retRes, canRes, refRes] = await Promise.all([
        api.getMyReturns(0, 50).catch(() => ({ content: [] })),
        api.getMyCancellations(0, 50).catch(() => ({ content: [] })),
        api.getMyRefunds().catch(() => [])
      ]);
      setReturns(retRes.content || []);
      setCancellations(canRes.content || []);
      setRefunds(refRes || []);
    } catch (e) {
      console.error('Failed to load returns and refunds:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    loadAll();
  }, [token, router]);

  if (!token) return null;

  const totalReturns = returns.length;
  const totalCancellations = cancellations.length;
  const pendingCount = returns.filter(r => r.status === 'PENDING').length + cancellations.filter(c => c.status === 'PENDING').length;
  const refundActiveCount = refunds.filter(r => r.refundStatus === 'REQUESTED' || r.refundStatus === 'APPROVED' || r.refundStatus === 'PROCESSING').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Returns & Refunds Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Track return requests, order cancellations, and refund statuses</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAll}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/help?category=returns"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors shadow-sm"
          >
            <HelpCircle className="w-4 h-4" />
            Return Policy & FAQ
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200/60 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center flex-shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalReturns}</p>
            <p className="text-xs font-semibold text-slate-500">Return Requests</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200/60 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCancellations}</p>
            <p className="text-xs font-semibold text-slate-500">Cancellations</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200/60 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingCount}</p>
            <p className="text-xs font-semibold text-slate-500">In Review</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200/60 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{refundActiveCount}</p>
            <p className="text-xs font-semibold text-slate-500">Active Refunds</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-gray-700 gap-6">
        {[
          { key: 'ALL', label: 'All Requests' },
          { key: 'RETURNS', label: `Returns (${returns.length})` },
          { key: 'CANCELLATIONS', label: `Cancellations (${cancellations.length})` },
          { key: 'REFUNDS', label: `Refunds (${refunds.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3.5 text-sm font-bold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto" />
          <p className="text-slate-500 text-sm mt-3">Loading requests...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* RETURNS TAB */}
          {(activeTab === 'ALL' || activeTab === 'RETURNS') && returns.length > 0 && (
            <div className="space-y-3">
              {activeTab === 'ALL' && <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Return Requests</h3>}
              {returns.map(req => {
                const statusBadge = STATUS_BADGES[req.status];
                const refundBadge = REFUND_BADGES[req.refundStatus];

                return (
                  <div key={`ret-${req.id}`} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200/60 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-purple-200 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/profile/orders/${req.orderNumber}`} className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors">
                            Order #{req.orderNumber.substring(0, 8).toUpperCase()}
                          </Link>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Reason: <span className="font-medium text-slate-700 dark:text-slate-300">{req.reason.replace(/_/g, ' ')}</span>
                          {req.notes && ` • "${req.notes}"`}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">Requested on {new Date(req.createdAt).toLocaleDateString()}</p>
                        {req.adminNotes && (
                          <div className="mt-2 text-xs p-2.5 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300">
                            <span className="font-bold">Admin Feedback:</span> {req.adminNotes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-gray-700">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500">Refund Amount</p>
                        <p className="font-black text-slate-900 dark:text-white text-base">₹{req.refundAmount.toFixed(2)}</p>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mt-1 ${refundBadge.bg} ${refundBadge.text}`}>
                          {refundBadge.label}
                        </span>
                      </div>
                      <Link
                        href={`/profile/orders/${req.orderNumber}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-white rounded-xl transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CANCELLATIONS TAB */}
          {(activeTab === 'ALL' || activeTab === 'CANCELLATIONS') && cancellations.length > 0 && (
            <div className="space-y-3">
              {activeTab === 'ALL' && <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-6">Cancellations</h3>}
              {cancellations.map(can => {
                const statusBadge = STATUS_BADGES[can.status];
                const refundBadge = REFUND_BADGES[can.refundStatus];

                return (
                  <div key={`can-${can.id}`} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200/60 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-red-200 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/profile/orders/${can.orderNumber}`} className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors">
                            Order #{can.orderNumber.substring(0, 8).toUpperCase()}
                          </Link>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                            Cancelled
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Reason: <span className="font-medium text-slate-700 dark:text-slate-300">{can.reason.replace(/_/g, ' ')}</span>
                          {can.notes && ` • "${can.notes}"`}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">Cancelled on {new Date(can.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-gray-700">
                      {can.refundStatus !== 'NOT_REQUESTED' && (
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-500">Refund</p>
                          <p className="font-black text-slate-900 dark:text-white text-base">₹{can.refundAmount?.toFixed(2) || '0.00'}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mt-1 ${refundBadge.bg} ${refundBadge.text}`}>
                            {refundBadge.label}
                          </span>
                        </div>
                      )}
                      <Link
                        href={`/profile/orders/${can.orderNumber}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-white rounded-xl transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* REFUNDS TAB */}
          {activeTab === 'REFUNDS' && (
            <div className="space-y-3">
              {refunds.length === 0 ? (
                <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/60 dark:border-gray-700 text-center text-slate-500 text-sm">
                  No active or past refunds.
                </div>
              ) : (
                refunds.map(ref => {
                  const refundBadge = REFUND_BADGES[ref.refundStatus];
                  return (
                    <div key={`ref-${ref.requestId}`} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200/60 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300">
                              {ref.requestType}
                            </span>
                            <Link href={`/profile/orders/${ref.orderNumber}`} className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors">
                              Order #{ref.orderNumber.substring(0, 8).toUpperCase()}
                            </Link>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Reason: <span className="font-medium text-slate-700 dark:text-slate-300">{ref.reason.replace(/_/g, ' ')}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">Requested on {new Date(ref.requestedAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-slate-900 dark:text-white text-lg">₹{ref.amount.toFixed(2)}</p>
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold mt-1 ${refundBadge.bg} ${refundBadge.text}`}>
                          {refundBadge.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Empty State */}
          {returns.length === 0 && cancellations.length === 0 && (
            <div className="p-12 bg-white dark:bg-gray-800 rounded-3xl border border-slate-200/60 dark:border-gray-700 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center mx-auto text-slate-400">
                <RotateCcw className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No return or cancellation requests yet</h3>
                <p className="text-sm text-slate-500 mt-1">Your past and active return/cancellation requests will appear here.</p>
              </div>
              <Link
                href="/profile/orders"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" /> View My Orders
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
