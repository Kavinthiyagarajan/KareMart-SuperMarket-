import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  username: string | null;
  role: 'CUSTOMER' | 'ADMIN' | null;
  setAuth: (token: string, username: string, role: 'CUSTOMER' | 'ADMIN') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      role: null,
      setAuth: (token, username, role) => set({ token, username, role }),
      logout: () => set({ token: null, username: null, role: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
