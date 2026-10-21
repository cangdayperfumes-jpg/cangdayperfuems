'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Award,
  BookOpen,
  ChevronLeft,
  ExternalLink,
  GalleryHorizontal,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Ticket,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import AdminLanguageToggle from './AdminLanguageToggle';

interface SidebarProps {
  onSignOut: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

function useNavGroups(): NavGroup[] {
  const t = useTranslations('nav');
  return [
    {
      label: t('overview'),
      items: [
        { href: '/admin', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/admin/orders', label: t('orders'), icon: ShoppingBag },
        { href: '/admin/products', label: t('products'), icon: Package },
        { href: '/admin/categories', label: t('categories'), icon: Layers },
        { href: '/admin/brands', label: t('brands'), icon: Award },
        { href: '/admin/shipping', label: t('shipping'), icon: Truck },
        { href: '/admin/catalog', label: t('catalogGen'), icon: BookOpen },
      ],
    },
    {
      label: t('marketing'),
      items: [
        { href: '/admin/blog', label: t('blog'), icon: Newspaper },
        { href: '/admin/coupons', label: t('coupons'), icon: Ticket },
        { href: '/admin/subscribers', label: t('subscribers'), icon: Mail },
        { href: '/admin/marketing/hero-slides', label: t('heroSlides'), icon: GalleryHorizontal },
        { href: '/admin/marketing/category-tiles', label: t('categoryTiles'), icon: LayoutGrid },
        { href: '/admin/marketing/seasonal-collections', label: t('seasonalCollection'), icon: Sparkles },
      ],
    },
    {
      label: t('system'),
      items: [{ href: '/admin/settings', label: t('settings'), icon: Settings }],
    },
  ];
}

function isActivePath(pathname: string | null, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || !!pathname?.startsWith(`${href}/`);
}

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'notch-corners flex h-9 w-9 shrink-0 items-center justify-center bg-gradient-to-br from-gold-soft via-gold to-gold-deep',
        className
      )}
    >
      <span className="font-heading text-lg font-semibold italic leading-none text-ink">C</span>
    </span>
  );
}

/**
 * Sidebar body, shared by the fixed desktop rail and the mobile sheet.
 * Kept as a real component (not one created inside render) so it isn't
 * remounted on every parent render.
 */
function SidebarBody({
  collapsed,
  onNavigate,
  onSignOut,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const groups = useNavGroups();

  return (
    <div className="flex h-full flex-col bg-ink font-body text-ivory">
      {/* Brand */}
      <div className={cn('flex h-[72px] shrink-0 items-center border-b border-ivory/[0.06] px-5', collapsed && 'md:justify-center md:px-0')}>
        <Link href="/admin" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <span className={cn('min-w-0', collapsed && 'md:hidden')}>
            <span className="block font-heading text-[19px] font-medium leading-none tracking-tight">Cangday</span>
            <span className="mt-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.28em] text-gold/80">
              {t('adminPanel')}
            </span>
          </span>
        </Link>
      </div>

      {/* Navigation — scrolls if the screen is short, with the bar hidden */}
      <nav
        aria-label={t('adminNavigation')}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {groups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-6')}>
            {collapsed ? (
              gi > 0 && <div className="mx-auto mb-3 hidden h-px w-6 bg-ivory/10 md:block" />
            ) : null}
            <p className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory/35', collapsed && 'md:hidden')}>
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group relative flex h-10 items-center gap-3 rounded-md px-3 text-[13.5px] font-medium transition-colors duration-150',
                        active
                          ? 'bg-ivory/[0.07] text-ivory'
                          : 'text-ivory/55 hover:bg-ivory/[0.04] hover:text-ivory',
                        collapsed && 'md:justify-center md:px-0'
                      )}
                    >
                      {/* Gold rail marks the current page */}
                      <span
                        aria-hidden
                        className={cn(
                          'absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-gold transition-opacity',
                          active ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          active ? 'text-gold' : 'text-ivory/40 group-hover:text-ivory/80'
                        )}
                      />
                      <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-1 border-t border-ivory/[0.06] p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? t('viewStore') : undefined}
          className={cn(
            'flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium text-ivory/55 transition-colors hover:bg-ivory/[0.04] hover:text-ivory',
            collapsed && 'md:justify-center md:px-0'
          )}
        >
          <ExternalLink className="h-[18px] w-[18px] shrink-0 text-ivory/40" />
          <span className={cn(collapsed && 'md:hidden')}>{t('viewStore')}</span>
        </a>
        <button
          type="button"
          onClick={onSignOut}
          title={collapsed ? t('signOut') : undefined}
          className={cn(
            'flex h-10 w-full items-center gap-3 rounded-md px-3 text-[13px] font-medium text-ivory/55 transition-colors hover:bg-rose-500/10 hover:text-rose-300',
            collapsed && 'md:justify-center md:px-0'
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span className={cn(collapsed && 'md:hidden')}>{t('signOut')}</span>
        </button>
        <div className="pt-2">
          <AdminLanguageToggle collapsed={collapsed} />
        </div>
      </div>
    </div>
  );
}

export default function AdminSidebar({ onSignOut, isCollapsed = false, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const groups = useNavGroups();
  const [isOpen, setIsOpen] = useState(false);

  const current = groups.flatMap((g) => g.items).find((i) => isActivePath(pathname, i.href));

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          'fixed inset-y-0 z-50 hidden flex-col border-r border-ivory/[0.06] transition-[width] duration-300 md:flex',
          isCollapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <SidebarBody collapsed={isCollapsed} onSignOut={onSignOut} />
        {setIsCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? t('expand') : t('collapse')}
            className="absolute -right-3 top-[60px] z-50 flex h-6 w-6 items-center justify-center rounded-full border border-ivory/10 bg-ink-elevated text-ivory/70 shadow-md transition-colors hover:border-gold/50 hover:text-gold"
          >
            <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform duration-300', isCollapsed && 'rotate-180')} />
          </button>
        )}
      </aside>

      {/* Mobile top bar + sheet */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ivory/[0.06] bg-ink px-3 font-body text-ivory md:hidden">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          <span className="min-w-0">
            <span className="block font-heading text-[15px] font-medium leading-none">Cangday</span>
            <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/80">
              {current?.label ?? t('admin')}
            </span>
          </span>
        </Link>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t('adminNavigation')}
              className="flex h-10 w-10 items-center justify-center rounded-md text-ivory/80 transition-colors hover:bg-ivory/[0.06] hover:text-ivory"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-r border-ivory/[0.06] bg-ink p-0 text-ivory [&>button]:text-ivory/60">
            <SheetTitle className="sr-only">{t('adminNavigation')}</SheetTitle>
            <SidebarBody collapsed={false} onNavigate={() => setIsOpen(false)} onSignOut={onSignOut} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
