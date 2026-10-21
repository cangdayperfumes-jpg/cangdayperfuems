'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import AdminSidebar from '@/components/admin/Sidebar';
import { cn } from '@/lib/utils';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // Don't show layout chrome for the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row print:bg-white print:block">
      {/* `contents` so the mobile top bar inside can stick to the viewport (a
          wrapper exactly its own height gave it nowhere to stick). */}
      <div className="contents print:hidden">
        <AdminSidebar
          onSignOut={handleSignOut}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>

      <main className={cn(
        "flex-1 min-w-0 p-4 md:p-8 overflow-y-auto w-full print:m-0 print:p-0 transition-all duration-300",
        isSidebarCollapsed ? "md:ml-[76px]" : "md:ml-64"
      )}>
        <div className="mx-auto max-w-[1600px] print:max-w-none">
            {children}
        </div>
      </main>
    </div>
  );
}
