'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { ShippingQuote } from '@/lib/shipping';

interface CheckoutContextType {
  /** null until a destination is chosen. */
  shipping: ShippingQuote | null;
  setShipping: (quote: ShippingQuote | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [shipping, setShipping] = useState<ShippingQuote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <CheckoutContext.Provider value={{ shipping, setShipping, isSubmitting, setIsSubmitting }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
