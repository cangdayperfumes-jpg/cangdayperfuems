// Lets the product page's mobile sticky Add to Cart bar (in ProductActions)
// tell the global ScrollToTop button to shift out of its way — the two are
// otherwise unrelated components that would silently overlap in the same
// bottom-right band on mobile without this.
import { create } from 'zustand';

interface StickyBarState {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const useStickyBarStore = create<StickyBarState>((set) => ({
  visible: false,
  setVisible: (visible) => set({ visible }),
}));
