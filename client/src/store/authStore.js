import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      
      setSession: (user, token) => set({ user, token }),
      clearSession: () => set({ user: null, token: null }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'gigshield-auth-storage', // name of item in localStorage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default the 'localStorage' is used
    }
  )
);
