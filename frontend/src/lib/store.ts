import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, api } from './api';
import { useAuthStore } from './authStore';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  resetLocalCart: () => void;
  syncWithBackend: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      resetLocalCart: () => set({ items: [] }),
      syncWithBackend: async () => {
        const token = useAuthStore.getState().token;
        if (token) {
          try {
            const data = await api.getCart();
            set({ items: data.items });
          } catch (e) {
            console.error("Failed to sync cart", e);
          }
        }
      },
      addItem: async (product, quantity = 1) => {
        const token = useAuthStore.getState().token;
        if (token) {
          try {
            await api.addToCart(product.id, quantity);
          } catch (e) {
            console.error(e);
            return;
          }
        }
        set((state) => {
          const existingItem = state.items.find((item) => item.product.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, { product, quantity }], isOpen: true };
        });
      },
      removeItem: async (productId) => {
        const token = useAuthStore.getState().token;
        if (token) {
          try {
            await api.removeFromCart(productId);
          } catch (e) {
            console.error(e);
            return;
          }
        }
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },
      updateQuantity: async (productId, quantity) => {
        const token = useAuthStore.getState().token;
        if (token) {
          try {
            await api.updateCartItemQuantity(productId, quantity);
          } catch (e) {
            console.error(e);
            return;
          }
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: async () => {
        const token = useAuthStore.getState().token;
        if (token) {
          try {
            await api.clearCart();
          } catch (e) {
            console.error(e);
          }
        }
        set({ items: [] });
      },
    }),
    {
      name: 'smart-grocery-cart',
    }
  )
);
