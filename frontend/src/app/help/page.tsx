"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  CreditCard,
  Truck,
  Tag,
  ShoppingCart,
  User,
  RefreshCw,
  Search,
  X,
  ChevronDown,
  HelpCircle,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  LifeBuoy
} from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface CategoryMeta {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryMeta[] = [
  {
    id: "orders",
    name: "Orders",
    description: "Track orders, view details, and reorder past purchases",
    icon: Package,
  },
  {
    id: "payments",
    name: "Payments",
    description: "Payment methods, verification, and transaction status",
    icon: CreditCard,
  },
  {
    id: "delivery",
    name: "Delivery",
    description: "Time slots, live tracking, and delivery progress",
    icon: Truck,
  },
  {
    id: "coupons",
    name: "Coupons & Offers",
    description: "Applying discount codes and promotion rules",
    icon: Tag,
  },
  {
    id: "cart",
    name: "Cart & Checkout",
    description: "Cart synchronization, stock limits, and checkout",
    icon: ShoppingCart,
  },
  {
    id: "accounts",
    name: "Accounts & Addresses",
    description: "Saved addresses, notifications, and profile settings",
    icon: User,
  },
  {
    id: "returns",
    name: "Returns & Cancellations",
    description: "Cancellation workflow and grocery item policies",
    icon: RefreshCw,
  },
];

const FAQS: FAQItem[] = [
  // Orders
  {
    id: "orders-1",
    category: "orders",
    question: "Where can I see my orders?",
    answer:
      "You can view your complete order history by clicking on 'Account' in the top header and navigating to 'My Orders' (or visiting /profile/orders). All past and current orders are listed chronologically.",
  },
  {
    id: "orders-2",
    category: "orders",
    question: "How can I view order details and tracking?",
    answer:
      "Click on any order card in your Order History to open its detailed page. There you can see the full item breakdown, subtotal, discounts, tax, chosen delivery slot, and live tracking progress.",
  },
  {
    id: "orders-3",
    category: "orders",
    question: "What happens after I place an order?",
    answer:
      "Once an order is placed, items are reserved from inventory and the order progresses through stages: 'Order Placed' → 'Packed' → 'Out for Delivery' → 'Delivered'. You can check real-time progress on the order details page.",
  },
  {
    id: "orders-4",
    category: "orders",
    question: "How does 'Buy Again' work?",
    answer:
      "You can click the 'Buy Again' button on any past order details page, or visit Account → Buy Again. This automatically adds previously ordered available items directly into your active cart in one click.",
  },

  // Payments
  {
    id: "payments-1",
    category: "payments",
    question: "Which payment methods are available?",
    answer:
      "KareMart supports Online Payment (via Razorpay with UPI, Credit/Debit Cards, and NetBanking) as well as Cash on Delivery (COD). You can select your preferred method during checkout.",
  },
  {
    id: "payments-2",
    category: "payments",
    question: "What happens if payment fails or is cancelled?",
    answer:
      "If an online payment fails, times out, or the payment window is closed, the order is marked as CANCELLED. Any inventory reserved for the order is automatically released back to stock.",
  },
  {
    id: "payments-3",
    category: "payments",
    question: "How is payment verified?",
    answer:
      "For online transactions, payment signatures are cryptographically verified by the backend with the payment provider before confirming the order.",
  },

  // Delivery
  {
    id: "delivery-1",
    category: "delivery",
    question: "How do I check delivery status?",
    answer:
      "Open your order from Account → My Orders to see the 4-stage tracking timeline (Order Placed, Packed, Out for Delivery, Delivered).",
  },
  {
    id: "delivery-2",
    category: "delivery",
    question: "What delivery slots can I choose from?",
    answer:
      "During checkout, you can select from available time slots: 'Express (Within 30 Mins)', 'Today (6 PM - 8 PM)', or 'Tomorrow Morning (8 AM - 10 AM)'.",
  },
  {
    id: "delivery-3",
    category: "delivery",
    question: "Where can I find delivery partner details?",
    answer:
      "When your order is marked as 'Out for Delivery' or 'Delivered', the delivery partner's name, rating, and vehicle number appear directly on the order details page.",
  },

  // Coupons & Offers
  {
    id: "coupons-1",
    category: "coupons",
    question: "How do I apply a coupon?",
    answer:
      "In the Cart drawer or on the Checkout page, enter your promo code into the coupon input field and click 'Apply'. If valid, the discount is calculated and subtracted immediately.",
  },
  {
    id: "coupons-2",
    category: "coupons",
    question: "Why was my coupon rejected?",
    answer:
      "Coupons may be rejected if the cart total does not meet the minimum purchase requirement, if the coupon has expired, if it has reached its maximum usage limit, or if the code was mistyped.",
  },
  {
    id: "coupons-3",
    category: "coupons",
    question: "Where is my discount shown?",
    answer:
      "Applied discounts are itemized in the Order Summary in your cart drawer, during checkout review, and on your final order details page alongside the applied coupon code.",
  },

  // Cart & Checkout
  {
    id: "cart-1",
    category: "cart",
    question: "Can I save my cart across sessions?",
    answer:
      "Yes. When you are signed in, your cart automatically syncs with the server. Your items are saved so you can resume shopping across browser sessions.",
  },
  {
    id: "cart-2",
    category: "cart",
    question: "Why can't I increase the quantity of a product?",
    answer:
      "KareMart monitors real-time inventory. You cannot add more units than the currently available stock for any product.",
  },
  {
    id: "cart-3",
    category: "cart",
    question: "Why is stock verified at checkout?",
    answer:
      "Stock is dynamically verified and reserved during checkout placement to guarantee that products are securely allocated for your order.",
  },

  // Accounts & Addresses
  {
    id: "accounts-1",
    category: "accounts",
    question: "How do I manage addresses?",
    answer:
      "Go to Account → Saved Addresses (/profile/addresses). Here you can add new addresses, edit existing details, delete unused addresses, or set a default address for quick checkout.",
  },
  {
    id: "accounts-2",
    category: "accounts",
    question: "Where are my notifications?",
    answer:
      "Click the bell icon in the top header or visit Account → Notifications (/profile/notifications) to view order status updates and notifications.",
  },
  {
    id: "accounts-3",
    category: "accounts",
    question: "How do I log out?",
    answer:
      "Click the logout button next to your account in the top navigation bar, or click 'Logout' in the Account sidebar navigation.",
  },

  // Returns & Cancellations
  {
    id: "returns-1",
    category: "returns",
    question: "Can I cancel an order after placing it?",
    answer:
      "Unpaid or failed orders are automatically cancelled. For confirmed orders requiring cancellation prior to dispatch, please contact KareMart support.",
  },
  {
    id: "returns-2",
    category: "returns",
    question: "What is the return policy for supermarket items?",
    answer:
      "As a grocery and supermarket store delivering perishables and essentials, issues with damaged or missing items should be reported directly through your configured KareMart support channel.",
  },
  {
    id: "returns-3",
    category: "returns",
    question: "What happens if an item is unavailable when reordering?",
    answer:
      "When reordering via 'Buy Again', if any product is currently out of stock, available products will be added to your cart and unavailable items are clearly listed in an on-screen notification.",
  },
];

function HelpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") || "all";
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    "orders-1": true, // open first item by default for quick clarity
  });

  const handleCategorySelect = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId === "all") {
      params.delete("category");
    } else {
      params.set("category", categoryId);
    }
    router.push(`/help?${params.toString()}`);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.replace(`/help?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.replace(`/help?${params.toString()}`);
  };

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    filteredFAQs.forEach((faq) => {
      allOpen[faq.id] = true;
    });
    setOpenIds(allOpen);
  };

  const collapseAll = () => {
    setOpenIds({});
  };

  // Filtered FAQs based on category and search query
  const filteredFAQs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory =
        activeCategory === "all" || faq.category === activeCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const catMeta = CATEGORIES.find((c) => c.id === faq.category);
      const catName = catMeta?.name.toLowerCase() || "";

      return (
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        catName.includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="w-full space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white p-8 md:p-14 shadow-lg border border-emerald-700/30">
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/20 backdrop-blur-sm">
            <LifeBuoy className="w-4 h-4" /> KareMart Customer Support
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            How can we help?
          </h1>

          <p className="text-base md:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            Find answers about orders, payments, delivery and shopping on KareMart.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <label htmlFor="faq-search-input" className="sr-only">
                Search Help Center
              </label>
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                id="faq-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by topic, e.g. payment, coupon, delivery, addresses..."
                className="w-full pl-12 pr-12 py-3.5 md:py-4 bg-white text-slate-900 rounded-2xl shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/40 text-sm md:text-base placeholder:text-slate-400 border border-slate-200"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Categories Grid */}
      <section aria-labelledby="help-categories-heading" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2
            id="help-categories-heading"
            className="text-xl md:text-2xl font-bold text-slate-900"
          >
            Browse by Topic
          </h2>
          {activeCategory !== "all" && (
            <button
              onClick={() => handleCategorySelect("all")}
              className="text-xs md:text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Show all topics
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = activeCategory === category.id;
            const count = FAQS.filter((f) => f.category === category.id).length;

            return (
              <button
                key={category.id}
                onClick={() =>
                  handleCategorySelect(isSelected ? "all" : category.id)
                }
                className={`p-5 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between group cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-500 shadow-md ring-1 ring-emerald-500"
                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                }`}
                aria-pressed={isSelected}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-emerald-200/70 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count} FAQs
                    </span>
                  </div>
                  <h3
                    className={`font-bold text-base transition-colors ${
                      isSelected
                        ? "text-emerald-950"
                        : "text-slate-900 group-hover:text-emerald-700"
                    }`}
                  >
                    {category.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {category.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-600 group-hover:text-emerald-600 transition-colors">
                  <span>{isSelected ? "Active filter" : "Explore questions"}</span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 ml-1 transition-transform ${
                      isSelected
                        ? "text-emerald-600 translate-x-1"
                        : "group-hover:translate-x-1"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Category Pills Quick-Filter */}
      <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => handleCategorySelect("all")}
          className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeCategory === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Topics ({FAQS.length})
        </button>
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const count = FAQS.filter((f) => f.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </section>

      {/* FAQ Accordion Section */}
      <section aria-labelledby="faq-list-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h2
              id="faq-list-heading"
              className="text-xl md:text-2xl font-bold text-slate-900"
            >
              Frequently Asked Questions
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              {searchQuery ? (
                <>
                  Found <span className="font-semibold text-slate-800">{filteredFAQs.length}</span>{" "}
                  result{filteredFAQs.length !== 1 ? "s" : ""} matching &ldquo;
                  <span className="font-semibold text-emerald-700">{searchQuery}</span>&rdquo;
                  {activeCategory !== "all" && (
                    <> in {CATEGORIES.find((c) => c.id === activeCategory)?.name}</>
                  )}
                </>
              ) : activeCategory === "all" ? (
                <>Showing all {filteredFAQs.length} practical FAQs across 7 shopping categories</>
              ) : (
                <>
                  Showing {filteredFAQs.length} questions in{" "}
                  <span className="font-semibold text-slate-800">
                    {CATEGORIES.find((c) => c.id === activeCategory)?.name}
                  </span>
                </>
              )}
            </p>
          </div>

          {filteredFAQs.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={expandAll}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* FAQs List */}
        {filteredFAQs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No matching answers found
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              We couldn&apos;t find any FAQs matching your query &ldquo;{searchQuery}&rdquo;. Try
              searching for a different term or clear your filters.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Clear Search
                </button>
              )}
              {activeCategory !== "all" && (
                <button
                  onClick={() => handleCategorySelect("all")}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                  View All Topics
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((faq) => {
              const isOpen = !!openIds[faq.id];
              const catMeta = CATEGORIES.find((c) => c.id === faq.category);

              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? "border-emerald-200 shadow-sm ring-1 ring-emerald-100"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    id={`faq-btn-${faq.id}`}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      {catMeta && (
                        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                          {catMeta.name}
                        </span>
                      )}
                      <span className="font-bold text-sm md:text-base text-slate-900">
                        {faq.question}
                      </span>
                    </div>
                    <div
                      className={`p-1.5 rounded-full transition-transform duration-200 flex-shrink-0 ${
                        isOpen
                          ? "bg-emerald-100 text-emerald-700 rotate-180"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-btn-${faq.id}`}
                      className="px-6 pb-5 pt-1 text-sm md:text-base text-slate-600 leading-relaxed border-t border-slate-50"
                    >
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Support & Quick Action Card */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-lg border border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-emerald-400 text-xs font-bold border border-slate-700">
              <ShieldCheck className="w-4 h-4" /> Customer Assistance
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Need further assistance?
            </h3>
            <p className="text-sm text-slate-400 max-w-xl">
              Please use the support channel configured by KareMart or navigate to your account to review live orders, addresses, and delivery status.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/profile/orders"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <Package className="w-4 h-4" /> View My Orders
            </Link>
            <Link
              href="/profile"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors border border-slate-700 flex items-center gap-2"
            >
              <User className="w-4 h-4" /> Account Center
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors border border-slate-700 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-sm font-medium">Loading KareMart Help Center...</p>
        </div>
      }
    >
      <HelpContent />
    </Suspense>
  );
}
