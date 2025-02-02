import { create } from 'zustand';

export const useUserStore = create((set) => ({
  clerkId: null,
  organization: null,
  email: null,
  setUser: (user) => set({ user:user }),
  setOrganization: (org) => set({ organization: org }),
}));