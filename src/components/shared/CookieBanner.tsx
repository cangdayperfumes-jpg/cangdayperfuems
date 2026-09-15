'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookies_accepted');
    if (!hasAccepted) {
      // Small delay so it doesn't appear instantly
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookies_accepted', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-4 md:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-full duration-500">
      <div className="container max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600 flex-1">
          <p className="font-medium text-black mb-1">We value your privacy</p>
          We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
        </div>
        <div className="flex flex-row items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setShowBanner(false)}
            className="flex-1 md:flex-none"
          >
            Decline
          </Button>
          <Button 
            onClick={acceptCookies}
            className="flex-1 md:flex-none bg-black text-white hover:bg-gray-800"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
