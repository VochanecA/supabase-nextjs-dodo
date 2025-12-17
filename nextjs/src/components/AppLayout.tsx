"use client";


import React, { 
  useState, 
  useCallback, 
  useEffect, 
  useMemo, 
  Suspense, 
  lazy 
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Key,
  Files,
  LucideListTodo,
} from 'lucide-react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { createSPAClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import { encryptObject, type PageData } from '@/lib/utils/encryption';

// Dynamic import za ThemeToggle
const ThemeToggle = lazy(() => import('@/components/ThemeToggle'));

// Interface za Link href objekat
interface LinkHref {
  pathname: string;
  query: { data: string };
}

// Type guard za provjeru tipa href-a
const isLinkHref = (href: string | LinkHref): href is LinkHref => {
  return typeof href !== 'string' && 'pathname' in href && 'query' in href;
};

// Navigation item interface
interface NavigationItem {
  name: string;
  href: string | LinkHref;
  icon: React.ComponentType<{ className?: string }>;
  prefetch?: boolean;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // State hooks - moraju biti na vrhu
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Context hooks
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { user, subscription, isSubscribed } = useGlobal();

  // Optimizovani mount efekt
  useEffect(() => {
    setMounted(true);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('NEXT_PUBLIC_SUPABASE_URL nije postavljen');
      return;
    }

    try {
      const url = new URL(supabaseUrl);
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url.origin;
      document.head.appendChild(link);

      return () => {
        const links = document.querySelectorAll(`link[href="${url.origin}"]`);
        links.forEach((linkElement) => linkElement.remove());
      };
    } catch (error) {
      console.error('Invalid Supabase URL:', error);
    }
  }, []);

  // Memoizovana funkcija za enkripciju
  const getEncryptedTableParams = useCallback((): string => {
    if (!subscription || !user) return '';
    
    const params: PageData = {
      subscriptionStatus: subscription.subscription_status || 'none',
      accountName: user.email?.split('@')[0] || 'user',
      isSubscribed: !!isSubscribed,
      timestamp: Date.now(),
    };
    
    return encryptObject(params);
  }, [subscription, user, isSubscribed]);

  // Memoizovani parametri
  const encryptedTableParams = useMemo(
    () => getEncryptedTableParams(),
    [getEncryptedTableParams],
  );

  // Optimizovani logout
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createSPAClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUserDropdownOpen(false);
      
      setTimeout(() => {
        router.push('/auth/login');
        router.refresh();
      }, 100);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  // Memoizovani hendleri
  const handleChangePassword = useCallback(() => {
    setUserDropdownOpen(false);
    router.push('/app/user-settings');
  }, [router]);

  const getInitials = useCallback((email: string): string => {
    const parts = email.split('@')[0].split(/[._-]/);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Memoizovana navigacija
  const navigation = useMemo((): NavigationItem[] => [
    { 
      name: 'Homepage', 
      href: '/app', 
      icon: Home,
      prefetch: true, 
    },
    { 
      name: 'Example Storage', 
      href: '/app/storage', 
      icon: Files,
      prefetch: false, 
    },
    { 
      name: 'Example Table', 
      href: {
        pathname: '/app/table',
        query: { data: encryptedTableParams },
      }, 
      icon: LucideListTodo,
      prefetch: true, 
    },
    { 
      name: 'User Settings', 
      href: '/app/user-settings', 
      icon: User,
      prefetch: true, 
    },
  ], [encryptedTableParams]);

  // Memoizovana provera aktivne rute
  const isActiveRoute = useCallback((href: string | LinkHref): boolean => {
    const routePath = typeof href === 'string' ? href : href.pathname;
    return pathname === routePath;
  }, [pathname]);

  // Memoizovani product name
  const productName = useMemo(() => 
    process.env.NEXT_PUBLIC_PRODUCTNAME || 'App',
  []);

  // Loading state - MORA BITI PRE SVIH USLOVNIH HOOK-OVA
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400" />
        </div>
      </div>
    );
  }

  // SADA MOŽEMO BEZBEDNO KORISTITI USLOVNE HOOK-OVE
  // Komponenta za dropdown overlay - samo JSX, bez useMemo
  const DropdownOverlay = isSidebarOpen ? (
    <div
      className="fixed inset-0 bg-gray-600/75 dark:bg-gray-900/90 z-20 lg:hidden"
      onClick={toggleSidebar}
      aria-hidden="true"
      role="presentation"
    />
  ) : null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile overlay */}
      {DropdownOverlay}

      {/* Sidebar */}

<aside 
  className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out z-30 
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
  aria-label="Main navigation"
>
  <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
    <span className="text-xl font-semibold text-primary-600 dark:text-primary-400 truncate">
      {productName}
    </span>
    <button
      type="button"
      onClick={toggleSidebar}
      className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1"
      aria-label="Close sidebar"
    >
      <X className="h-5 w-5" />
    </button>
  </div>

  {/* Navigation */}
  <nav className="mt-4 px-2 space-y-1" aria-label="Sidebar navigation">
    {navigation.map((item) => {
      const isActive = isActiveRoute(item.href);
      const Icon = item.icon;
      
      return (
        <Link
          key={item.name}
          href={item.href}
          prefetch={item.prefetch}
          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
          aria-current={isActive ? 'page' : undefined}
        >
          <Icon
            className={`mr-3 h-4 w-4 flex-shrink-0 transition-colors ${
              isActive 
                ? 'text-primary-500 dark:text-primary-400' 
                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
            }`}
            aria-hidden="true"
          />
          <span className="truncate">{item.name}</span>
        </Link>
      );
    })}
  </nav>

  {/* Sign Out u Sidebar */}
  <div className="absolute bottom-20 left-4 right-4">
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
      <span className="font-medium">Sign Out</span>
      {isLoggingOut && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 ml-1" />
      )}
    </button>
  </div>

  {/* Theme Toggle in Sidebar */}
  <div className="absolute bottom-4 left-4 right-4">
    <Suspense fallback={
      <div className="h-10 w-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md" />
    }>
      <ThemeToggle variant="floating" />
    </Suspense>
  </div>
</aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white dark:bg-gray-800 shadow-sm px-4 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {/* Theme Toggle in Header */}
            <Suspense fallback={
              <div className="h-9 w-9 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md" />
            }>
              <ThemeToggle variant="header" />
            </Suspense>

            {/* User Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
                aria-expanded={isUserDropdownOpen}
                aria-label="User menu"
              >
                <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 dark:text-primary-400 font-medium text-xs">
                    {user ? getInitials(user.email) : '??'}
                  </span>
                </div>
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {user?.email || 'Loading...'}
                </span>
                <ChevronDown className="h-3 w-3 flex-shrink-0" />
              </button>

              {isUserDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1" role="none">
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-100"
                      aria-label="Change password"
                      role="menuitem"
                    >
                      <Key className="mr-2 h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                      <span className="truncate">Change Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Sign out"
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <LogOut className="mr-2 h-3 w-3 text-red-400 flex-shrink-0"/>
                        <span className="truncate">Sign Out</span>
                      </div>
                      {isLoggingOut && (
                        <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-red-600 flex-shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400" />
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}