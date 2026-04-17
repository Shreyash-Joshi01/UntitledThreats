import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAdmin: false,
      
      setSession: (user, token) => set({ user, token }),
      setAdminAuth: (status) => set({ isAdmin: status }),
      clearSession: () => set({ user: null, token: null, isAdmin: false }),
      logout: () => set({ user: null, token: null, isAdmin: false }),
    }),
    {
      name: 'untitled-threats-auth-storage', // name of item in localStorage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default the 'localStorage' is used
    }
  )
);
