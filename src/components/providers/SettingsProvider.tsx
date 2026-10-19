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
  /** ISO timestamp — when set the pop-up becomes a countdown offer that hides itself once passed. */
  popup_ends_at?: string | null;
  /** Also show the countdown as a thin bar above the header. */
  popup_show_bar?: boolean;
  popup_title_tr?: string;
  popup_message_tr?: string;
  popup_button_text_tr?: string;
}

interface SettingsContextType {
  hidePrices: boolean;
  popupSettings: PopupSettings | null;
  /** Products added within this many days get the "New" badge automatically (0 = off). */
  newBadgeDays: number;
}

const SettingsContext = createContext<SettingsContextType>({ hidePrices: false, popupSettings: null, newBadgeDays: 30 });

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({
  children,
  hidePrices,
  popupSettings = null,
  newBadgeDays = 30,
}: {
  children: ReactNode;
  hidePrices: boolean;
  popupSettings?: PopupSettings | null;
  newBadgeDays?: number;
}) => {
  return (
    <SettingsContext.Provider value={{ hidePrices, popupSettings, newBadgeDays }}>
      {children}
    </SettingsContext.Provider>
  );
};
