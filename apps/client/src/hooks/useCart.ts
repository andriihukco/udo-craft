"use client";

import { useState, useEffect } from "react";

export interface CartItem {
  productName: string;
  quantity: number;
  size: string;
  unitPriceCents: number;
  printCostCents: number;
  mockupsMap?: Record<string, string>;
  mockupDataUrl?: string;
  mockupBackDataUrl?: string;
  productImage?: string;
}

export interface UseCartReturn {
  cart: CartItem[];
  cartCount: number;
  totalCents: number;
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [totalCents, setTotalCents] = useState(0);

  const readCart = () => {
    try {
      const raw = sessionStorage.getItem("client-order-draft");
      if (!raw) {
        setCart([]);
        setCartCount(0);
        setTotalCents(0);
        return;
      }
      const draft = JSON.parse(raw);
      const cartItems: CartItem[] = Array.isArray(draft.cart) ? draft.cart : [];
      setCart(cartItems);
      setCartCount(cartItems.length);
      const total = cartItems.reduce((sum, item) => {
        return sum + (item.unitPriceCents + item.printCostCents) * item.quantity;
      }, 0);
      setTotalCents(total);
    } catch {
      setCart([]);
      setCartCount(0);
      setTotalCents(0);
    }
  };

  useEffect(() => {
    readCart();

    // Cross-tab sync via storage events
    window.addEventListener("storage", readCart);

    // Same-tab sync via BroadcastChannel
    const channel = new BroadcastChannel("udo-cart");
    channel.onmessage = () => readCart();

    return () => {
      window.removeEventListener("storage", readCart);
      channel.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { cart, cartCount, totalCents };
}
