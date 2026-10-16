'use client';

import { useEffect } from 'react';

/**
 * Supabase password-recovery links redirect to the bare Site URL (the public
 * homepage) with the session tokens in the URL hash — there's no way to
 * point them straight at /admin/reset-password from the Supabase dashboard's
 * "send recovery email" action. Mounted once in the locale root layout so it
 * catches the hash regardless of which locale the link lands on, and forwards
 * to the page that actually handles it, tokens included.
 */
export default function AuthRecoveryRedirect() {
  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      window.location.replace(`/admin/reset-password${window.location.hash}`);
    }
  }, []);

  return null;
}
