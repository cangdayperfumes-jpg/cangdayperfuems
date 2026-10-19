import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Snapshot of a product at the time it was favourited — enough to render the drawer without refetching. */
export interface WishlistItem {
  id: string;
  slug?: string | null;
  name: string;
  price: number;
  discount: number;
  image: string;
  hasVariants: boolean;
  inStock: boolean;
}

interface WishlistState {
  items: WishlistItem[];
  /** Adds the product, or removes it when already saved. Returns true when it is now saved. */
  toggle: (item: WishlistItem) => boolean;
  remove: (id: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some((i) => i.id === item.id);
        set({ items: exists ? get().items.filter((i) => i.id !== item.id) : [item, ...get().items] });
        return !exists;
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'wishlist-storage', storage: createJSONStorage(() => localStorage) }
  )
);
