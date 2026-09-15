'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export interface PopupSettings {
  popup_enabled: boolean;
  popup_title: string;
  popup_message: string;
  popup_button_text: string;
  popup_button_link: string;
  popup_image_url: string;
  popup_show_on: string; // 'all' | 'shop' | 'home'
}

interface SettingsContextType {
  hidePrices: boolean;
  popupSettings: PopupSettings | null;
}

const SettingsContext = createContext<SettingsContextType>({ hidePrices: false, popupSettings: null });

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({
  children,
  hidePrices,
  popupSettings = null,
}: {
  children: ReactNode;
  hidePrices: boolean;
  popupSettings?: PopupSettings | null;
}) => {
  return (
    <SettingsContext.Provider value={{ hidePrices, popupSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
