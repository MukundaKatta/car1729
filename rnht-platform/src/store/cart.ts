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
  hasUnpricedItem: () => boolean;
};

// Resolve the unit price for a cart item, distinguishing "no price known"
// (null — e.g. a custom service with null price AND null suggested_donation)
// from a genuine $0. Returning null lets callers guard against an accidental
// no-charge checkout instead of silently coercing the item to free.
function resolveUnitPrice(item: CartItem): number | null {
  if (item.selectedTier) {
    return item.selectedTier.price;
  }
  const price = item.service.price ?? item.service.suggested_donation;
  return price ?? null;
}

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
          // Only sum items with a known price. Unpriced items (resolveUnitPrice
          // === null) are excluded rather than counted as $0; callers should
          // check hasUnpricedItem() before allowing checkout.
          const price = resolveUnitPrice(item);
          if (price === null) return total;
          return total + price * item.quantity;
        }, 0);
      },
      getItemCount: () => get().items.length,
      hasUnpricedItem: () =>
        get().items.some((item) => resolveUnitPrice(item) === null),
    }),
    {
      name: "rnht-cart",
      storage: browserStorage,
      // Rehydrate manually after mount via <StoreRehydrator />. Auto-rehydrate
      // would replace the empty cart (SSR default) with stored items during
      // the first client render, breaking hydration on the Header badge.
      skipHydration: true,
    }
  )
);
