'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Truck, Star, LogOut, Settings, Menu, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

interface SidebarProps {
  onSignOut: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function AdminSidebar({ onSignOut, isCollapsed = false, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/products', label: 'Products', icon: Package },
        { href: '/admin/categories', label: 'Categories', icon: LayoutDashboard }, // Using LayoutDashboard as placeholder if needed, or maybe specific icon
        { href: '/admin/brands', label: 'Brands', icon: Star },
        { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
        { href: '/admin/shipping', label: 'Shipping', icon: Truck },
        { href: '/admin/catalog', label: 'Catalog Gen', icon: Package },
      ],
    },
    {
      label: 'Marketing',
      items: [
        { href: '/admin/marketing/seasonal-collections', label: 'Seasonal Collection', icon: Sparkles },
      ],
    },
    {
      label: 'System',
      items: [
        { href: '/admin/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-zinc-950 text-white border-r border-zinc-800 relative">
        {setIsCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-6 h-6 w-6 bg-zinc-800 rounded-full items-center justify-center text-white border border-zinc-700 z-50 hover:bg-zinc-700 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
        <div className="p-6 flex items-center justify-center md:justify-start">
          <Link href="/" className={cn("flex items-center gap-2 mb-6", isCollapsed && "md:justify-center")}>
             <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center shrink-0">
                <span className="text-black font-bold text-xl">R</span>
             </div>
             <div className={cn("transition-all duration-300", isCollapsed && "md:hidden")}>
                <h1 className="text-lg font-playfair font-bold whitespace-nowrap">Royal Perfume</h1>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest whitespace-nowrap">Admin Panel</p>
             </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className={cn("px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2", isCollapsed && "md:hidden")}>{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white text-black shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900",
                      isCollapsed && "md:justify-center md:px-0"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-black" : "text-zinc-500 group-hover:text-white")} />
                    <span className={cn(isCollapsed && "md:hidden", "whitespace-nowrap")}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-zinc-900">
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/30 pl-4", isCollapsed && "md:justify-center md:pl-0")}
            onClick={onSignOut}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn(isCollapsed && "md:hidden", "whitespace-nowrap")}>Sign Out</span>
          </Button>
        </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex flex-col fixed inset-y-0 z-50 transition-all duration-300", isCollapsed ? "w-20" : "w-72")}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">R</span>
             </div>
             <span className="font-playfair font-bold">Admin</span>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-zinc-800 bg-zinc-950 w-80">
                <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                <SidebarContent />
            </SheetContent>
          </Sheet>
      </div>
    </>
  );
}
