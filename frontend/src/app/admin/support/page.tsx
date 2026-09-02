"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  api,
  SupportConversationDto,
  SupportConversationDetailDto,
  RequestType,
  ConversationStatus,
  AvailabilityStatus,
} from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { useToastStore } from "@/lib/toastStore";
import {
  MessageSquare,
  Send,
  Package,
  Calendar,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowLeft,
  RefreshCw,
  User,
  ShieldCheck,
  Tag,
  Check,
  ChevronDown
} from "lucide-react";

const STATUS_TABS: { key: string; label: string; status?: ConversationStatus }[] = [
  { key: "ALL", label: "All Requests" },
  { key: "OPEN", label: "Open", status: "OPEN" },
  { key: "IN_PROGRESS", label: "In Progress", status: "IN_PROGRESS" },
  { key: "WAITING_FOR_CUSTOMER", label: "Waiting for Customer", status: "WAITING_FOR_CUSTOMER" },
  { key: "RESOLVED", label: "Resolved", status: "RESOLVED" },
  { key: "CLOSED", label: "Closed", status: "CLOSED" },
];

const REQUEST_TYPE_OPTIONS: { key: string; label: string; type?: RequestType }[] = [
  { key: "ALL", label: "All Types" },
  { key: "PRODUCT_AVAILABILITY", label: "Product Availability", type: "PRODUCT_AVAILABILITY" },
  { key: "BULK_ORDER", label: "Bulk Order", type: "BULK_ORDER" },
  { key: "DELIVERY_QUESTION", label: "Delivery Question", type: "DELIVERY_QUESTION" },
  { key: "PRODUCT_REQUEST", label: "Product Request", type: "PRODUCT_REQUEST" },
  { key: "ORDER_ISSUE", label: "Order Issue", type: "ORDER_ISSUE" },
  { key: "OTHER", label: "General", type: "OTHER" },
];

const STATUS_BADGES: Record<
  ConversationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  OPEN: {
    label: "Open",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  WAITING_FOR_CUSTOMER: {
    label: "Waiting for Customer",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700",
  },
};

function AdminSupportContent() {
  const router = useRouter();
  const { token, role, username } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [conversations, setConversations] = useState<SupportConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeDetail, setActiveDetail] = useState<SupportConversationDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);

  // Reply Form State
  const [replyMessage, setReplyMessage] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>("NOT_APPLICABLE");
  const [availableAtDate, setAvailableAtDate] = useState("");
  const [newStatus, setNewStatus] = useState<ConversationStatus>("WAITING_FOR_CUSTOMER");
  const [submittingReply, setSubmittingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Security check: Admin only
  useEffect(() => {
    if (!token) {
      router.replace("/login?redirect=/admin/support");
    } else if (role !== "ADMIN") {
      router.replace("/support");
    }
  }, [token, role, router]);

  const loadConversations = async (silent = false) => {
    if (!token || role !== "ADMIN") return;
    if (!silent) setLoading(true);
    try {
      const activeStatus = STATUS_TABS.find((t) => t.key === activeTab)?.status;
      const activeReqType = REQUEST_TYPE_OPTIONS.find((t) => t.key === selectedType)?.type;

      const res = await api.getAdminSupportConversations(
        {
          status: activeStatus,
          requestType: activeReqType,
          search: searchQuery.trim() || undefined,
        },
        0,
        50
      );

      setConversations(res.content || []);

      if (selectedId === null && res.content && res.content.length > 0) {
        setSelectedId(res.content[0].id);
      }
    } catch (err) {
      console.error("Failed to load admin conversations:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [token, role, activeTab, selectedType, searchQuery]);

  const loadThread = async (id: number, silent = false) => {
    if (!silent) setThreadLoading(true);
    try {
      const res = await api.getAdminSupportConversation(id);
      setActiveDetail(res);
      // Default new status to match current or waiting for customer
      if (res.status === "OPEN" || res.status === "IN_PROGRESS") {
        setNewStatus("WAITING_FOR_CUSTOMER");
      } else {
        setNewStatus(res.status);
      }
    } catch (err) {
      console.error("Failed to load admin thread:", err);
      addToast("Failed to load conversation details", "error");
    } finally {
      if (!silent) setThreadLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      loadThread(selectedId);
    } else {
      setActiveDetail(null);
    }
  }, [selectedId]);

  // Polling every 20s
  useEffect(() => {
    if (!token || role !== "ADMIN" || !selectedId) return;

    const interval = setInterval(() => {
      loadThread(selectedId, true);
      loadConversations(true);
    }, 20000);

    return () => clearInterval(interval);
  }, [token, role, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeDetail?.messages]);

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyMessage.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      const payload = {
        message: replyMessage.trim(),
        availabilityStatus: availabilityStatus !== "NOT_APPLICABLE" ? availabilityStatus : undefined,
        availableAt: availableAtDate ? new Date(availableAtDate).toISOString() : undefined,
        newStatus: newStatus,
      };

      const newMsg = await api.sendAdminSupportReply(selectedId, payload);

      addToast("Reply and availability status sent to customer", "success");
      setReplyMessage("");
      setAvailabilityStatus("NOT_APPLICABLE");
      setAvailableAtDate("");

      if (activeDetail) {
        setActiveDetail({
          ...activeDetail,
          status: newStatus,
          messages: [...activeDetail.messages, newMsg],
        });
      }

      loadConversations(true);
    } catch (err: any) {
      addToast(err.message || "Failed to send admin reply", "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatus = async (status: ConversationStatus) => {
    if (!selectedId) return;
    try {
      const updated = await api.updateAdminSupportStatus(selectedId, status);
      setActiveDetail(updated);
      setNewStatus(status);
      addToast(`Status updated to ${status}`, "success");
      loadConversations(true);
    } catch (err: any) {
      addToast(err.message || "Failed to update status", "error");
    }
  };

  if (!token || role !== "ADMIN") return null;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Administrator Helpdesk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Customer Requests & Support Management
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Respond to customer queries, update product availability statuses, specify expected restock dates, and track tickets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" /> Products
          </Link>
          <button
            onClick={() => {
              loadConversations();
              if (selectedId) loadThread(selectedId);
            }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {STATUS_TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Secondary filters: Request Type & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, subject, or request ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="w-full sm:w-60">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {REQUEST_TYPE_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Conversation List */}
        <div className={`lg:col-span-4 space-y-4 ${selectedId && "hidden lg:block"}`}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[750px]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{conversations.length} Conversations</span>
              <span>Sorted by Latest Activity</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 p-2">
              {loading ? (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-xs">Loading requests...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold">No requests match criteria</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = selectedId === conv.id;
                  const statusInfo = STATUS_BADGES[conv.status];

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedId(conv.id)}
                      className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 shadow-sm"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" /> {conv.username}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-bold line-clamp-1 ${
                          isSelected ? "text-emerald-950 dark:text-emerald-300" : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {conv.subject}
                      </h4>

                      {conv.productName && (
                        <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-semibold truncate">
                          <Package className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{conv.productName}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-400">
                        <span>{conv.requestType.replace(/_/g, " ")}</span>
                        <span suppressHydrationWarning>
                          {new Date(conv.updatedAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Thread & Admin Reply Box */}
        <div className={`lg:col-span-8 ${!selectedId && "hidden lg:block"}`}>
          {selectedId && activeDetail ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[750px]">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 lg:hidden rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {activeDetail.subject}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          STATUS_BADGES[activeDetail.status].bg
                        } ${STATUS_BADGES[activeDetail.status].text} ${
                          STATUS_BADGES[activeDetail.status].border
                        }`}
                      >
                        {STATUS_BADGES[activeDetail.status].label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Customer: {activeDetail.username}
                      </span>
                      <span>•</span>
                      <span>{activeDetail.requestType.replace(/_/g, " ")}</span>
                      {activeDetail.productName && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" /> {activeDetail.productName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Status Selector */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs font-semibold text-slate-500">Status:</span>
                  <select
                    value={activeDetail.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as ConversationStatus)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-900/30">
                {threadLoading ? (
                  <div className="p-8 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  </div>
                ) : (
                  activeDetail.messages.map((msg) => {
                    const isAdmin = msg.senderType === "ADMIN";

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1 text-xs text-slate-400">
                          <span className={`font-bold ${isAdmin ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                            {isAdmin ? `Admin (${msg.senderUsername})` : `Customer (${activeDetail.username})`}
                          </span>
                          <span>•</span>
                          <span suppressHydrationWarning>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-xl rounded-2xl p-4 shadow-sm space-y-3 ${
                            isAdmin
                              ? "bg-slate-900 text-white rounded-tr-sm"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                          {msg.availabilityStatus && msg.availabilityStatus !== "NOT_APPLICABLE" && (
                            <div
                              className={`mt-2 p-3 rounded-xl border text-xs ${
                                msg.availabilityStatus === "AVAILABLE"
                                  ? "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                                  : msg.availabilityStatus === "AVAILABLE_LATER"
                                  ? "bg-amber-950/60 border-amber-700 text-amber-300"
                                  : "bg-red-950/60 border-red-700 text-red-300"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold mb-1">
                                {msg.availabilityStatus === "AVAILABLE" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                {msg.availabilityStatus === "AVAILABLE_LATER" && <Clock3 className="w-4 h-4 text-amber-400" />}
                                {msg.availabilityStatus === "NOT_AVAILABLE" && <AlertCircle className="w-4 h-4 text-red-400" />}
                                <span>
                                  {msg.availabilityStatus === "AVAILABLE" && "Product Status: Available"}
                                  {msg.availabilityStatus === "AVAILABLE_LATER" && "Product Status: Available on Expected Date"}
                                  {msg.availabilityStatus === "NOT_AVAILABLE" && "Product Status: Not Available / Out of Stock"}
                                </span>
                              </div>

                              {msg.availableAt && (
                                <div className="mt-1 flex items-center gap-1 font-medium text-[11px] opacity-90" suppressHydrationWarning>
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>Expected: {new Date(msg.availableAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Admin Reply & Availability Response Box */}
              <form onSubmit={handleSendAdminReply} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                {/* Availability Bar Controls */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" /> Availability & Status Response
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Availability Response
                      </label>
                      <select
                        value={availabilityStatus}
                        onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="NOT_APPLICABLE">Not Applicable (General Message)</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="AVAILABLE_LATER">Available Later</option>
                        <option value="NOT_AVAILABLE">Not Available</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Expected Availability Date
                      </label>
                      <input
                        type="datetime-local"
                        value={availableAtDate}
                        onChange={(e) => setAvailableAtDate(e.target.value)}
                        disabled={availabilityStatus !== "AVAILABLE_LATER"}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium disabled:opacity-40 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Update Status After Reply
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as ConversationStatus)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Text Area & Submit */}
                <div className="flex items-start gap-3">
                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Write an official response to the customer (e.g. We have confirmed stock with our distributor)..."
                    disabled={submittingReply}
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  ></textarea>

                  <button
                    type="submit"
                    disabled={!replyMessage.trim() || submittingReply}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-sm self-stretch justify-center"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center h-[750px] flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Select a conversation
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Choose a customer support request from the list to review the thread, answer questions, or update availability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-sm font-medium">Loading Admin Helpdesk...</p>
        </div>
      }
    >
      <AdminSupportContent />
    </Suspense>
  );
}
