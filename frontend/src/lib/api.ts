export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
}

export interface Product {
  id: number;
  externalId: string;
  sku: string;
  barcode: string;
  name: string;
  slug: string;
  brand?: string;
  category: Category;
  imageUrl?: string;
  mrp: number;
  sellingPrice: number;
  discountPercent?: number;
  availableQuantity: number;
  availabilityStatus: string;
  unit?: string;
}

export interface WishlistItemDto {
  id: number;
  product: Product;
  addedAt: string;
}

export interface CartItemDto {
  productId: number;
  quantity: number;
}

export interface CheckoutRequest {
  items: CartItemDto[];
  addressId?: number;
}

export interface CheckoutError {
  productId: number;
  message: string;
  reason: string;
}

export interface CheckoutResponse {
  success: boolean;
  checkoutToken: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  couponCode?: string;
  errors: CheckoutError[];
}

export interface Delivery {
  id?: number;
  orderNumber: string;
  provider: string;
  providerDeliveryId?: string;
  status: string;
  trackingUrl?: string | null;
  estimatedDeliveryTime?: string | null;
  createdAt?: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: number;
  productId: number;
  quantityChange: number;
  previousStock: number;
  resultingStock: number;
  transactionType: string;
  reason: string | null;
  orderNumber: string | null;
  actorUsername: string | null;
  createdAt: string;
}

export interface AdminCoupon {
  id: number;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  usageLimit: number;
  perCustomerLimit: number;
  currentUsage: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCouponUsage {
  totalUsage: number;
  usageLimit: number;
  perCustomerLimit: number;
  remainingUsage: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
}

export interface Review {
  id: number;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export interface ReviewEligibility {
  eligible: boolean;
  hasReviewed: boolean;
  reviewId: number | null;
}

export interface Address {
  id: number;
  type: 'HOME' | 'WORK' | 'OTHER';
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  isServiceable?: boolean;
  unserviceableReason?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';


export interface OrderSummary {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  delivery: Delivery | null;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderDetails {
  orderNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  couponCode?: string;
  createdAt: string;
  paymentMethod?: string;
  paymentStatus?: string;
  delivery: Delivery | null;
  items: OrderItem[];
}

import { useAuthStore } from './authStore';

export interface PagedResponse<T> {
  content: T[];
  pageable: { pageNumber: number, pageSize: number };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
}

export interface NotificationDto {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  orderNumber: string | null;
  createdAt: string;
}

export const api = {
  // ... existing ...
  baseUrl: 'http://localhost:8080',

  getHeaders: () => {
    const token = useAuthStore.getState().token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },
  getProducts: async (page = 0, size = 20): Promise<PagedResponse<Product>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/products?page=${page}&size=${size}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    } catch (e) {
      console.error("API error", e);
      throw e; 
    }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/categories`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    } catch (e) {
      console.error("API error", e);
      return [];
    }
  },

  searchProducts: async (filters: { q?: string, category?: string, minPrice?: number, maxPrice?: number, availability?: string, sort?: string }, page = 0, size = 20): Promise<PagedResponse<Product>> => {
    try {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.availability) params.append('availability', filters.availability);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('page', page.toString());
      params.append('size', size.toString());

      const response = await fetch(`${API_BASE_URL}/v1/products/search?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to search products");
      return response.json();
    } catch (e) {
      console.error("API error", e);
      throw e; 
    }
  },

  getDeals: async (filters: { category?: string, minPrice?: number, maxPrice?: number, availability?: string, sort?: string }, page = 0, size = 20): Promise<PagedResponse<Product>> => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.availability) params.append('availability', filters.availability);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('page', page.toString());
      params.append('size', size.toString());

      const response = await fetch(`${API_BASE_URL}/v1/products/deals?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch deals");
      return response.json();
    } catch (e) {
      console.error("API error", e);
      throw e;
    }
  },

  getProductBySlug: async (slug: string): Promise<Product | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/products/${slug}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch product");
      }
      return response.json();
    } catch (e) {
      console.error("API error", e);
      return null;
    }
  },

  getRelatedProducts: async (productId: number): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/products/${productId}/related`);
      if (!response.ok) return [];
      return response.json();
    } catch (e) {
      return [];
    }
  },

  getPopularProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/products/popular`);
      if (!response.ok) return [];
      return response.json();
    } catch (e) {
      return [];
    }
  },

  getBuyAgainProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/profile/buy-again`, {
        headers: api.getHeaders()
      });
      if (!response.ok) return [];
      return response.json();
    } catch (e) {
      return [];
    }
  },

  validateCheckout: async (request: { items: any[], addressId?: number, couponCode?: string }): Promise<CheckoutResponse> => {
    const response = await fetch(`${API_BASE_URL}/v1/checkout/validate`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error("Validation failed");
    return response.json();
  },

  placeOrder: async (request: { items: any[], addressId?: number, couponCode?: string }): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/v1/checkout/place-order`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to place order");
    }
    return response.json();
  },

  validateCoupon: async (code: string, subtotal: number): Promise<{ valid: boolean, discountAmount: number, errorMessage: string, normalizedCode: string }> => {
    const response = await fetch(`${API_BASE_URL}/v1/promotions/validate`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify({ code, subtotal }),
    });
    if (!response.ok) throw new Error("Validation failed");
    return response.json();
  },



  // Admin APIs
  getOrders: async (): Promise<Order[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/admin/orders`, {
        headers: api.getHeaders()
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getDeliveryForOrder: async (orderNumber: string): Promise<Delivery | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/orders/${orderNumber}/delivery`, {
        headers: api.getHeaders()
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch delivery");
      }
      return response.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },



  getMyOrders: async (page = 0, size = 20): Promise<PagedResponse<OrderSummary>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/profile/orders?page=${page}&size=${size}`, {
        headers: api.getHeaders()
      });
      if (!response.ok) throw new Error("Failed to fetch personal orders");
      return response.json();
    } catch (e) {
      console.error(e);
      return { 
        content: [], 
        totalElements: 0, 
        totalPages: 0, 
        number: 0, 
        size: size,
        pageable: { pageNumber: 0, pageSize: size },
        last: true,
        first: true
      };
    }
  },

  getOrderDetails: async (orderNumber: string): Promise<OrderDetails | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/profile/orders/${orderNumber}`, {
        headers: api.getHeaders()
      });
      if (!response.ok) {
        if (response.status === 404 || response.status === 403) return null;
        throw new Error("Failed to fetch order details");
      }
      return response.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  getReviews: async (productId: number): Promise<Review[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/products/${productId}/reviews`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getReviewSummary: async (productId: number): Promise<ReviewSummary> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/products/${productId}/reviews/summary`);
      if (!response.ok) throw new Error("Failed to fetch review summary");
      return response.json();
    } catch (e) {
      console.error(e);
      return { averageRating: 0, totalReviews: 0 };
    }
  },

  checkReviewEligibility: async (productId: number): Promise<ReviewEligibility> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/products/${productId}/reviews/eligibility`, {
        headers: api.getHeaders()
      });
      if (!response.ok) return { eligible: false, hasReviewed: false, reviewId: null };
      return response.json();
    } catch (e) {
      return { eligible: false, hasReviewed: false, reviewId: null };
    }
  },

  submitReview: async (productId: number, rating: number, comment: string): Promise<Review> => {
    const response = await fetch(`${API_BASE_URL}/v1/products/${productId}/reviews`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify({ rating, comment })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to submit review");
    }
    return response.json();
  },

  updateReview: async (productId: number, reviewId: number, rating: number, comment: string): Promise<Review> => {
    const response = await fetch(`${API_BASE_URL}/v1/products/${productId}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: api.getHeaders(),
      body: JSON.stringify({ rating, comment })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to update review");
    }
    return response.json();
  },

  deleteReview: async (productId: number, reviewId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/products/${productId}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: api.getHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to delete review");
    }
  },

  syncProduct: async (externalId: string): Promise<Product | null> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/sync/product/${externalId}`, {
      method: 'POST',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Sync failed");
    return response.json();
  },

  getAdminOrders: async (page: number = 0, size: number = 20, status?: string, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status && status !== 'All') params.append('status', status);
    if (search) params.append('search', search);
    const response = await fetch(`${API_BASE_URL}/v1/admin/orders?${params.toString()}`, { headers: api.getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch admin orders");
    return response.json();
  },

  getAdminOrderDetails: async (orderNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/orders/${orderNumber}`, { headers: api.getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch admin order details");
    return response.json();
  },

  cancelAdminOrder: async (orderNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/orders/${orderNumber}/cancel`, {
      method: 'PATCH',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to cancel admin order");
    return response.json();
  },

  updateAdminOrderStatus: async (orderNumber: string, status: string) => {
    const params = new URLSearchParams({ status });
    const response = await fetch(`${API_BASE_URL}/v1/admin/orders/${orderNumber}/status?${params.toString()}`, {
      method: 'PATCH',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to update order status");
    return response.json();
  },

  getAdminProducts: async (page: number = 0, size: number = 20): Promise<PagedResponse<Product>> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/products?page=${page}&size=${size}`, { headers: api.getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch admin products");
    return response.json();
  },

  createProduct: async (productData: any): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/products`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getAdminDashboardSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/dashboard/summary`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch dashboard summary");
    return response.json();
  },

  updateProduct: async (id: number, productData: any): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/products/${id}`, {
      method: 'PUT',
      headers: api.getHeaders(),
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  toggleProductStatus: async (id: number, active: boolean): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/products/${id}/status?active=${active}`, {
      method: 'PATCH',
      headers: api.getHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  updateStock: async (id: number, operation: string, amount: number): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/products/${id}/stock`, {
      method: 'PATCH',
      headers: api.getHeaders(),
      body: JSON.stringify({ operation, amount }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getPriceHistory: async (productId: number): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/admin/products/${productId}/price-history`, {
        headers: api.getHeaders()
      });
      if (!response.ok) throw new Error("Failed to fetch price history");
      return response.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // Address APIs
  getAddresses: async (): Promise<Address[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/profile/addresses`, {
        headers: api.getHeaders()
      });
      if (!response.ok) throw new Error("Failed to fetch addresses");
      return response.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  createAddress: async (request: Omit<Address, 'id' | 'isServiceable' | 'unserviceableReason'>): Promise<Address> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/addresses`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error("Failed to create address");
    return response.json();
  },

  updateAddress: async (id: number, request: Omit<Address, 'id' | 'isServiceable' | 'unserviceableReason'>): Promise<Address> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/addresses/${id}`, {
      method: 'PUT',
      headers: api.getHeaders(),
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error("Failed to update address");
    return response.json();
  },

  deleteAddress: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/addresses/${id}`, {
      method: 'DELETE',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete address");
  },

  setDefaultAddress: async (id: number): Promise<Address> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/addresses/${id}/default`, {
      method: 'PUT',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to set default address");
    return response.json();
  },

  checkServiceability: async (id: number): Promise<{ serviceable: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/addresses/${id}/serviceability`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to check serviceability");
    return response.json();
  },

  // Wishlist APIs
  getWishlist: async (): Promise<WishlistItemDto[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/profile/wishlist`, {
        headers: api.getHeaders()
      });
      if (!response.ok) throw new Error("Failed to fetch wishlist");
      return response.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  addToWishlist: async (productId: number): Promise<WishlistItemDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/wishlist/${productId}`, {
      method: 'POST',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to add to wishlist");
    return response.json();
  },

  removeFromWishlist: async (productId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/wishlist/${productId}`, {
      method: 'DELETE',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to remove from wishlist");
  },

  checkWishlist: async (productId: number): Promise<{ exists: boolean }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/profile/wishlist/${productId}/exists`, {
        headers: api.getHeaders()
      });
      if (!response.ok) return { exists: false };
      return response.json();
    } catch (e) {
      return { exists: false };
    }
  },

  // Payment APIs
  getPaymentConfig: async (): Promise<{ provider: string, razorpayKeyId: string }> => {
    const response = await fetch(`${API_BASE_URL}/v1/payments/config`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch payment config");
    return response.json();
  },

  createPayment: async (request: { orderNumber: string, paymentMethod: string, idempotencyKey: string }): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/v1/payments/create`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error("Failed to create payment");
    return response.json();
  },

  verifyPayment: async (paymentId: number, verificationData: Record<string, string>): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/v1/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(verificationData)
    });
    if (!response.ok) throw new Error("Failed to verify payment");
    return response.json();
  },

  getCart: async (): Promise<{ items: { product: Product, quantity: number }[] }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/cart`, {
        headers: api.getHeaders()
      });
      if (!response.ok) throw new Error("Failed to fetch cart");
      return response.json();
    } catch (e) {
      console.error(e);
      return { items: [] };
    }
  },

  addToCart: async (productId: number, quantity: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/cart/items?productId=${productId}&quantity=${quantity}`, {
      method: 'POST',
      headers: api.getHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to add to cart");
    }
  },

  updateCartItemQuantity: async (productId: number, quantity: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/cart/items/${productId}?quantity=${quantity}`, {
      method: 'PUT',
      headers: api.getHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to update cart item");
    }
  },

  removeFromCart: async (productId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/cart/items/${productId}`, {
      method: 'DELETE',
      headers: api.getHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to remove from cart");
    }
  },

  clearCart: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/cart`, {
      method: 'DELETE',
      headers: api.getHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to clear cart");
    }
  },

  reorder: async (orderNumber: string): Promise<{ itemsAdded: number, itemsUnavailable: number, unavailableProductNames: string[] }> => {
    const response = await fetch(`${API_BASE_URL}/v1/cart/reorder/${orderNumber}`, {
      method: 'POST',
      headers: api.getHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to reorder");
    }
    return response.json();
  },

  getAdminCoupons: async (page: number, size: number, code?: string): Promise<{ content: AdminCoupon[], totalPages: number, totalElements: number }> => {
    const url = new URL(`${API_BASE_URL}/v1/admin/coupons`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('size', size.toString());
    if (code) url.searchParams.append('code', code);
    
    const response = await fetch(url.toString(), {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch coupons");
    return response.json();
  },

  createCoupon: async (couponData: any): Promise<AdminCoupon> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/coupons`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(couponData)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to create coupon");
    }
    return response.json();
  },

  updateCoupon: async (id: number, couponData: any): Promise<AdminCoupon> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/coupons/${id}`, {
      method: 'PUT',
      headers: api.getHeaders(),
      body: JSON.stringify(couponData)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to update coupon");
    }
    return response.json();
  },

  toggleCouponStatus: async (id: number, active: boolean): Promise<AdminCoupon> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/coupons/${id}/status?active=${active}`, {
      method: 'PATCH',
      headers: api.getHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to update coupon status");
    }
    return response.json();
  },

  getCouponUsage: async (id: number): Promise<AdminCouponUsage> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/coupons/${id}/usage`, {
      headers: api.getHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to fetch coupon usage");
    }
    return response.json();
  },

  getInventoryHistory: async (page: number = 0, size: number = 50, productId?: number, transactionType?: string, orderNumber?: string): Promise<PagedResponse<InventoryTransaction>> => {
    const queryParams = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (productId !== undefined && productId !== null && !isNaN(productId)) queryParams.append('productId', productId.toString());
    if (transactionType) queryParams.append('transactionType', transactionType);
    if (orderNumber) queryParams.append('orderNumber', orderNumber);

    const response = await fetch(`${API_BASE_URL}/v1/admin/inventory/history?${queryParams.toString()}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch inventory history");
    return response.json();
  },

  // Demo APIs
  seedCatalog: async (): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/v1/demo/seed-catalog`, {
      method: 'POST',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to seed catalog");
    return response.text();
  },

  seedOrders: async (): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/v1/demo/seed-orders`, {
      method: 'POST',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to seed orders");
    return response.text();
  },

  // Notifications
  getNotifications: async (page: number = 0, size: number = 20): Promise<PagedResponse<NotificationDto>> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/notifications?page=${page}&size=${size}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to get notifications");
    return response.json();
  },

  getUnreadNotificationCount: async (): Promise<{count: number}> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/notifications/unread-count`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to get unread notification count");
    return response.json();
  },

  markNotificationAsRead: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/notifications/${id}/read`, {
      method: 'PATCH',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to mark notification as read");
  },

  markAllNotificationsAsRead: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/notifications/read-all`, {
      method: 'PATCH',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to mark all notifications as read");
  },

  // Support Chat
  getSupportConversations: async (page: number = 0, size: number = 20): Promise<PagedResponse<SupportConversationDto>> => {
    const response = await fetch(`${API_BASE_URL}/v1/support/conversations?page=${page}&size=${size}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to get support conversations");
    return response.json();
  },

  getSupportConversation: async (id: number): Promise<SupportConversationDetailDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/support/conversations/${id}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to get conversation details");
    return response.json();
  },

  createSupportConversation: async (data: CreateConversationRequest): Promise<SupportConversationDetailDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/support/conversations`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create support request");
    }
    return response.json();
  },

  sendSupportMessage: async (conversationId: number, message: string): Promise<SupportMessageDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/support/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify({ message })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to send message");
    }
    return response.json();
  },

  markSupportConversationRead: async (conversationId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/v1/support/conversations/${conversationId}/read`, {
      method: 'PATCH',
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to mark conversation as read");
  },

  // Admin Support
  getAdminSupportConversations: async (
    filters?: { status?: string; requestType?: string; search?: string },
    page: number = 0,
    size: number = 20
  ): Promise<PagedResponse<SupportConversationDto>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.requestType) params.set('requestType', filters.requestType);
    if (filters?.search) params.set('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/v1/admin/support/conversations?${params.toString()}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to get admin support conversations");
    return response.json();
  },

  getAdminSupportConversation: async (id: number): Promise<SupportConversationDetailDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/support/conversations/${id}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to get admin conversation details");
    return response.json();
  },

  sendAdminSupportReply: async (conversationId: number, data: AdminReplyRequest): Promise<SupportMessageDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/support/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to send admin reply");
    }
    return response.json();
  },

  updateAdminSupportStatus: async (conversationId: number, status: ConversationStatus): Promise<SupportConversationDetailDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/support/conversations/${conversationId}/status`, {
      method: 'PATCH',
      headers: api.getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update conversation status");
    }
    return response.json();
  },

  // Customer Cancellation & Returns
  cancelOrder: async (orderNumber: string, data: CancelOrderRequest): Promise<CancellationRequestDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/orders/${orderNumber}/cancel`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to cancel order");
    }
    return response.json();
  },

  requestReturn: async (orderNumber: string, data: ReturnOrderRequest): Promise<ReturnRequestDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/orders/${orderNumber}/return`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to submit return request");
    }
    return response.json();
  },

  getOrderActionEligibility: async (orderNumber: string): Promise<OrderActionEligibilityDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/orders/${orderNumber}/actions`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load order action eligibility");
    return response.json();
  },

  getMyReturns: async (page: number = 0, size: number = 20): Promise<PagedResponse<ReturnRequestDto>> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/returns?page=${page}&size=${size}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load return requests");
    return response.json();
  },

  getReturnDetails: async (id: number): Promise<ReturnRequestDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/returns/${id}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load return request details");
    return response.json();
  },

  getMyCancellations: async (page: number = 0, size: number = 20): Promise<PagedResponse<CancellationRequestDto>> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/cancellations?page=${page}&size=${size}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load cancellation requests");
    return response.json();
  },

  getMyRefunds: async (): Promise<CustomerRefundDto[]> => {
    const response = await fetch(`${API_BASE_URL}/v1/profile/refunds`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load refund history");
    return response.json();
  },

  // Admin Returns & Cancellations
  getAdminReturns: async (status?: string, search?: string, page: number = 0, size: number = 20): Promise<PagedResponse<ReturnRequestDto>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status && status !== 'ALL') params.set('status', status);
    if (search) params.set('search', search);

    const response = await fetch(`${API_BASE_URL}/v1/admin/returns?${params.toString()}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load admin returns");
    return response.json();
  },

  getAdminCancellations: async (status?: string, search?: string, page: number = 0, size: number = 20): Promise<PagedResponse<CancellationRequestDto>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status && status !== 'ALL') params.set('status', status);
    if (search) params.set('search', search);

    const response = await fetch(`${API_BASE_URL}/v1/admin/cancellations?${params.toString()}`, {
      headers: api.getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load admin cancellations");
    return response.json();
  },

  reviewAdminCancellation: async (id: number, data: AdminReviewRequest): Promise<CancellationRequestDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/cancellations/${id}/review`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to review cancellation request");
    }
    return response.json();
  },

  reviewAdminReturn: async (id: number, data: AdminReviewRequest): Promise<ReturnRequestDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/returns/${id}/review`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to review return request");
    }
    return response.json();
  },

  completeAdminReturn: async (id: number, data: AdminCompleteReturnRequest): Promise<ReturnRequestDto> => {
    const response = await fetch(`${API_BASE_URL}/v1/admin/returns/${id}/complete`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to complete return");
    }
    return response.json();
  }
};

export type ConversationStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type RequestType = 'PRODUCT_AVAILABILITY' | 'BULK_ORDER' | 'DELIVERY_QUESTION' | 'PRODUCT_REQUEST' | 'ORDER_ISSUE' | 'OTHER';
export type AvailabilityStatus = 'AVAILABLE' | 'NOT_AVAILABLE' | 'AVAILABLE_LATER' | 'NOT_APPLICABLE';
export type SenderType = 'CUSTOMER' | 'ADMIN';

export interface SupportMessageDto {
  id: number;
  conversationId: number;
  senderType: SenderType;
  senderUsername: string;
  message: string;
  availabilityStatus?: AvailabilityStatus;
  availableAt?: string;
  createdAt: string;
}

export interface SupportConversationDto {
  id: number;
  userId: number;
  username: string;
  subject: string;
  requestType: RequestType;
  productId?: number;
  productName?: string;
  productImageUrl?: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: SupportMessageDto;
}

export interface SupportConversationDetailDto {
  id: number;
  userId: number;
  username: string;
  subject: string;
  requestType: RequestType;
  productId?: number;
  productName?: string;
  productImageUrl?: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessageDto[];
}

export interface CreateConversationRequest {
  subject: string;
  requestType: RequestType;
  productId?: number;
  message: string;
}

export interface AdminReplyRequest {
  message: string;
  availabilityStatus?: AvailabilityStatus;
  availableAt?: string;
  newStatus?: ConversationStatus;
}

export type CancellationReason = 'CHANGED_MIND' | 'ORDERED_BY_MISTAKE' | 'DELIVERY_DELAY' | 'OTHER';
export type ReturnReason = 'DAMAGED_INCORRECT_ITEM' | 'PRODUCT_ISSUE' | 'ORDERED_BY_MISTAKE' | 'OTHER';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type RefundStatus = 'NOT_REQUESTED' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED';

export interface CancelOrderRequest {
  reason: CancellationReason;
  notes?: string;
}

export interface ReturnOrderRequest {
  reason: ReturnReason;
  notes?: string;
}

export interface AdminReviewRequest {
  approve: boolean;
  adminNotes?: string;
}

export interface AdminCompleteReturnRequest {
  restockItems: boolean;
  adminNotes?: string;
}

export interface CancellationRequestDto {
  id: number;
  orderNumber: string;
  userId: string;
  reason: CancellationReason;
  notes?: string;
  status: RequestStatus;
  refundStatus: RefundStatus;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
}

export interface ReturnRequestDto {
  id: number;
  orderNumber: string;
  userId: string;
  reason: ReturnReason;
  notes?: string;
  status: RequestStatus;
  refundStatus: RefundStatus;
  refundAmount: number;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
}

export interface OrderActionEligibilityDto {
  canCancel: boolean;
  canRequestReturn: boolean;
  hasActiveCancellation: boolean;
  hasActiveReturn: boolean;
  cancelIneligibleReason?: string;
  returnIneligibleReason?: string;
  cancellation?: CancellationRequestDto;
  returnRequest?: ReturnRequestDto;
}

export interface CustomerRefundDto {
  requestType: 'CANCELLATION' | 'RETURN';
  requestId: number;
  orderNumber: string;
  amount: number;
  refundStatus: RefundStatus;
  reason: string;
  notes?: string;
  requestedAt: string;
  updatedAt: string;
  adminNotes?: string;
}


