import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name:      string;
  price:     number;
  currency:  string;
  type:      string;
  quantity:  number;
  image?:    string;
}

interface CartState {
  items:        CartItem[];
  isOpen:       boolean;
  addItem:      (item: Omit<CartItem, 'quantity'>) => void;
  removeItem:   (productId: string) => void;
  updateQty:    (productId: string, quantity: number) => void;
  clearCart:    () => void;
  toggleCart:   () => void;
  totalItems:   () => number;
  totalPrice:   () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items:  [],
  isOpen: false,

  addItem: (item) => {
    const existing = get().items.find(i => i.productId === item.productId);
    if (existing) {
      set(s => ({ items: s.items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i) }));
    } else {
      set(s => ({ items: [...s.items, { ...item, quantity: 1 }] }));
    }
  },

  removeItem: (productId) => set(s => ({ items: s.items.filter(i => i.productId !== productId) })),

  updateQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
    } else {
      set(s => ({ items: s.items.map(i => i.productId === productId ? { ...i, quantity } : i) }));
    }
  },

  clearCart: () => set({ items: [] }),

  toggleCart: () => set(s => ({ isOpen: !s.isOpen })),

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
