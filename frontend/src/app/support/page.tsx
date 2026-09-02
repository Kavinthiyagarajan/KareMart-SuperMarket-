"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Plus,
  Send,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Clock3,
  HelpCircle,
  Search,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ShoppingBag,
  ExternalLink
} from "lucide-react";

const REQUEST_TYPE_LABELS: Record<RequestType, { label: string; icon: string }> = {
  PRODUCT_AVAILABILITY: { label: "Product Availability", icon: "📦" },
  BULK_ORDER: { label: "Bulk Order Request", icon: "🛍️" },
  DELIVERY_QUESTION: { label: "Delivery Question", icon: "🚚" },
  PRODUCT_REQUEST: { label: "New Product Request", icon: "✨" },
  ORDER_ISSUE: { label: "Order Issue", icon: "⚠️" },
  OTHER: { label: "General Support", icon: "💬" },
};

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
    label: "Reply Received",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700",
  },
};

function SupportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, username } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const prefillProductId = searchParams.get("productId");
  const prefillProductName = searchParams.get("productName");
  const prefillType = (searchParams.get("type") as RequestType) || "PRODUCT_AVAILABILITY";

  const [conversations, setConversations] = useState<SupportConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeDetail, setActiveDetail] = useState<SupportConversationDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New Request Modal state
  const [showModal, setShowModal] = useState(!!prefillProductId);
  const [newSubject, setNewSubject] = useState(
    prefillProductName ? `Availability check: ${prefillProductName}` : ""
  );
  const [newType, setNewType] = useState<RequestType>(prefillType);
  const [newProductId, setNewProductId] = useState<string>(prefillProductId || "");
  const [newMessage, setNewMessage] = useState(
    prefillProductName ? `Hi, can you tell me if ${prefillProductName} is available or when it can be arranged?` : ""
  );
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      router.replace("/login?redirect=/support");
    }
  }, [token, router]);

  // Load conversations
  const loadConversations = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const res = await api.getSupportConversations(0, 50);
      setConversations(res.content || []);

      // If nothing selected and we have conversations, select the first one on desktop
      if (selectedId === null && res.content && res.content.length > 0 && !showModal) {
        setSelectedId(res.content[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [token]);

  // Load active conversation details
  const loadThread = async (id: number, silent = false) => {
    if (!silent) setThreadLoading(true);
    try {
      const res = await api.getSupportConversation(id);
      setActiveDetail(res);
    } catch (err) {
      console.error("Failed to load thread:", err);
      addToast("Failed to load conversation thread", "error");
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

  // Polling every 15 seconds while viewing
  useEffect(() => {
    if (!token || !selectedId) return;

    const interval = setInterval(() => {
      loadThread(selectedId, true);
      loadConversations(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [token, selectedId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeDetail?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const newMsg = await api.sendSupportMessage(selectedId, replyText.trim());
      setReplyText("");
      if (activeDetail) {
        setActiveDetail({
          ...activeDetail,
          messages: [...activeDetail.messages, newMsg],
          status: activeDetail.status === "CLOSED" || activeDetail.status === "RESOLVED" ? "IN_PROGRESS" : activeDetail.status,
        });
      }
      loadConversations(true);
    } catch (err: any) {
      addToast(err.message || "Failed to send message", "error");
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim() || creating) return;

    setCreating(true);
    try {
      const created = await api.createSupportConversation({
        subject: newSubject.trim(),
        requestType: newType,
        productId: newProductId ? parseInt(newProductId) : undefined,
        message: newMessage.trim(),
      });

      addToast("Support request submitted successfully", "success");
      setShowModal(false);
      setNewSubject("");
      setNewMessage("");
      setNewProductId("");

      // Reload conversations and select the new one
      await loadConversations();
      setSelectedId(created.id);
      setActiveDetail(created);
    } catch (err: any) {
      addToast(err.message || "Failed to create request", "error");
    } finally {
      setCreating(false);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.subject.toLowerCase().includes(q) ||
        c.requestType.toLowerCase().includes(q) ||
        (c.productName && c.productName.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  if (!token) return null;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" /> KareMart Support Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Customer Requests & Support
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ask about product availability, bulk orders, delivery questions, or get direct help from our supermarket team.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
          <button
            onClick={() => {
              loadConversations();
              if (selectedId) loadThread(selectedId);
            }}
            title="Refresh conversations"
            className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Chat Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Conversations List */}
        <div className={`lg:col-span-4 space-y-4 ${selectedId && "hidden lg:block"}`}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[650px]">
            {/* Search Input */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 p-2">
              {loading ? (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-xs">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {searchQuery ? "No matching requests" : "No support requests yet"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {searchQuery
                      ? "Try searching for a different term."
                      : "Have a question about a product or order? Click 'New Request' to get started."}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedId === conv.id;
                  const statusInfo = STATUS_BADGES[conv.status];
                  const typeInfo = REQUEST_TYPE_LABELS[conv.requestType] || { label: conv.requestType, icon: "💬" };

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedId(conv.id)}
                      className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 shadow-sm"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <span>{typeInfo.icon}</span> {typeInfo.label}
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
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium truncate">
                          <Package className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{conv.productName}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-400">
                        <span>{conv.messageCount} messages</span>
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

        {/* Right Column: Chat Thread */}
        <div className={`lg:col-span-8 ${!selectedId && "hidden lg:block"}`}>
          {selectedId && activeDetail ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[650px]">
              {/* Thread Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between">
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
                      <span>Request #{activeDetail.id}</span>
                      <span>•</span>
                      <span>{REQUEST_TYPE_LABELS[activeDetail.requestType]?.label}</span>
                      {activeDetail.productName && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Package className="w-3 h-3" /> {activeDetail.productName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thread Messages */}
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
                        className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1 text-xs text-slate-400">
                          <span className={`font-bold ${isAdmin ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}`}>
                            {isAdmin ? "KareMart Support" : "You"}
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
                              ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm"
                              : "bg-emerald-600 text-white rounded-tr-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                          {/* Availability Response Badge / Card */}
                          {msg.availabilityStatus && msg.availabilityStatus !== "NOT_APPLICABLE" && (
                            <div
                              className={`mt-2 p-3 rounded-xl border text-xs ${
                                msg.availabilityStatus === "AVAILABLE"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                                  : msg.availabilityStatus === "AVAILABLE_LATER"
                                  ? "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                                  : "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold mb-1">
                                {msg.availabilityStatus === "AVAILABLE" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                {msg.availabilityStatus === "AVAILABLE_LATER" && <Clock3 className="w-4 h-4 text-amber-600" />}
                                {msg.availabilityStatus === "NOT_AVAILABLE" && <AlertCircle className="w-4 h-4 text-red-600" />}
                                <span>
                                  {msg.availabilityStatus === "AVAILABLE" && "Product is Available"}
                                  {msg.availabilityStatus === "AVAILABLE_LATER" && "Available on Request"}
                                  {msg.availabilityStatus === "NOT_AVAILABLE" && "Currently Out of Stock / Unavailable"}
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

              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message or follow-up question..."
                  disabled={sendingReply}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center h-[650px] flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Select a conversation
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Choose a request from the list or start a new request to talk directly with KareMart support.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Start New Request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create Support Request
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Request Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as RequestType)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need 10 packets of Basmati Rice for Friday"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {prefillProductName && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  <Package className="w-4 h-4" /> Attached Product: {prefillProductName} (ID: {prefillProductId})
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Message / Details
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your request, desired quantities, delivery preferences, or questions..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newSubject.trim() || !newMessage.trim()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  {creating ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-sm font-medium">Loading KareMart Support...</p>
        </div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}
