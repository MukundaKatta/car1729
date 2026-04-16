import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Service, PriceTier, FamilyMember } from "@/types/database";
import { browserStorage } from "@/store/persistStorage";

export type CartItem = {
  id: string;
  service: Service;
  selectedTier: PriceTier | null;
  quantity: number;
  bookingDate: string;
  bookingTime: string;
  devoteeName: string;
  devoteeEmail: string;
  devoteePhone: string;
  gotra: string;
  nakshatra: string;
  rashi: string;
  specialInstructions: string;
  familyMembers: FamilyMember[];
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = item.selectedTier
            ? item.selectedTier.price
            : item.service.price ?? item.service.suggested_donation ?? 0;
          return total + price * item.quantity;
        }, 0);
      },
      getItemCount: () => get().items.length,
    }),
    {
      name: "rnht-cart",
      storage: browserStorage,
    }
  )
);
