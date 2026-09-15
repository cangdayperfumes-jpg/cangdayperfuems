// Consolidated Cart Store to replace use-cart.ts hook over time
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
}

export interface CartItem extends Product {
    quantity: number;
    variantId?: string;
    variantName?: string;
    image?: string; // Legacy support
    category?: string; // Legacy support
}

interface CartState {
    items: CartItem[];
    addItem: (product: Product & { variantId?: string; variantName?: string; image?: string; category?: string }) => void;
    removeItem: (productId: string, variantId?: string) => void;
    updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
    clearCart: () => void;
    
    // Computed
    // Computed
    getTotalPrice: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => set((state) => {
                const existingItem = state.items.find(item => 
                    item.id === product.id && item.variantId === product.variantId
                );
                
                if (existingItem) {
                    return {
                        items: state.items.map(item =>
                            (item.id === product.id && item.variantId === product.variantId)
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    };
                }
                return { items: [...state.items, { ...product, quantity: 1 }] };
            }),
            removeItem: (productId, variantId) => set((state) => ({
                items: state.items.filter(item => !(item.id === productId && item.variantId === variantId))
            })),
            updateQuantity: (productId, variantId, quantity) => set((state) => ({
                items: state.items.map(item =>
                    (item.id === productId && item.variantId === variantId)
                        ? { ...item, quantity: Math.max(0, quantity) }
                        : item
                ).filter(item => item.quantity > 0)
            })),
            clearCart: () => set({ items: [] }),
            getTotalPrice: () => {
                const { items } = get();
                return items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },
            getItemCount: () => {
                const { items } = get();
                return items.reduce((total, item) => total + item.quantity, 0);
            }
        }),
        {
            name: 'cart-storage', // Keep same name to persist data, but might need migration if structure breaks too much
            storage: createJSONStorage(() => localStorage),
        }
    )
);
