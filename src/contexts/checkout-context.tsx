'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CheckoutContextType {
  shippingFee: number;
  setShippingFee: (fee: number) => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [shippingFee, setShippingFee] = useState(0);

  return (
    <CheckoutContext.Provider value={{ shippingFee, setShippingFee }}>
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
