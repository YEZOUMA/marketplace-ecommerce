import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'panier';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, quantite = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantite: i.quantite + quantite } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          nom: product.nom,
          prix: Number(product.prix),
          image: product.images?.[0]?.url,
          stock: product.stock,
          quantite,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantite) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantite: Math.max(1, quantite) } : i)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.prix * i.quantite, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans un CartProvider');
  return ctx;
}
