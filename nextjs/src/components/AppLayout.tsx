"use client";
import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
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
    Sun,
    Moon
} from 'lucide-react';
import { useGlobal } from "@/lib/context/GlobalContext";
import { createSPASassClient } from "@/lib/supabase/client";
import { useTheme } from 'next-themes';
import { encryptObject, type PageData } from '@/lib/utils/encryption';

// Interface za Link href objekat
interface LinkHref {
    pathname: string;
    query: { data: string };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const { user, subscription, isSubscribed } = useGlobal();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Funkcija za enkripciju podataka za Example Table
    const getEncryptedTableParams = useCallback((): string => {
        const params: PageData = {
            subscriptionStatus: subscription?.subscription_status || 'none',
            accountName: user?.email?.split('@')[0] || 'user',
            isSubscribed: isSubscribed,
            timestamp: Date.now()
        };
        
        return encryptObject(params);
    }, [subscription, user, isSubscribed]);

    // Memoizovani enkriptovani parametri
    const encryptedTableParams = useMemo(() => getEncryptedTableParams(), [getEncryptedTableParams]);

    const handleLogout = async () => {
        try {
            const client = await createSPASassClient();
            await client.logout();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleChangePassword = async () => {
        router.push('/app/user-settings')
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const getInitials = (email: string) => {
        const parts = email.split('@')[0].split(/[._-]/);
        return parts.length > 1
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();
    };

    const productName = process.env.NEXT_PUBLIC_PRODUCTNAME;

    // Navigation sa enkriptovanim linkom za Example Table
    const navigation = [
        { name: 'Homepage', href: '/app', icon: Home },
        { name: 'Example Storage', href: '/app/storage', icon: Files },
        { 
            name: 'Example Table', 
            href: {
                pathname: '/app/table',
                query: { data: encryptedTableParams }
            }, 
            icon: LucideListTodo 
        },
        { name: 'User Settings', href: '/app/user-settings', icon: User },
    ];

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    // Helper funkcija za provjeru aktivne rute
    const isActiveRoute = (href: string | LinkHref): boolean => {
        const routePath = typeof href === 'string' ? href : href.pathname;
        return pathname === routePath;
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-90 z-20 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out z-30 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xl font-semibold text-primary-600 dark:text-primary-400">
                        {productName}
                    </span>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="mt-4 px-2 space-y-1">
                    {navigation.map((item) => {
                        const isActive = isActiveRoute(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                    isActive
                                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 transition-colors ${
                                        isActive 
                                            ? 'text-primary-500 dark:text-primary-400' 
                                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                                    }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Theme Toggle in Sidebar */}
                <div className="absolute bottom-4 left-4 right-4">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="h-4 w-4" />
                                Light Mode
                            </>
                        ) : (
                            <>
                                <Moon className="h-4 w-4" />
                                Dark Mode
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="lg:pl-64">
                <div className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white dark:bg-gray-800 shadow-sm px-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <Menu className="h-6 w-6"/>
                    </button>

                    <div className="flex items-center space-x-4 ml-auto">
                        {/* Theme Toggle in Header */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </button>

                        {/* User Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
                                className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <span className="text-primary-700 dark:text-primary-400 font-medium">
                                        {user ? getInitials(user.email) : '??'}
                                    </span>
                                </div>
                                <span className="hidden sm:block">{user?.email || 'Loading...'}</span>
                                <ChevronDown className="h-4 w-4"/>
                            </button>

                            {isUserDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {user?.email}
                                        </p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setUserDropdownOpen(false);
                                                handleChangePassword()
                                            }}
                                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Key className="mr-3 h-4 w-4 text-gray-400 dark:text-gray-500"/>
                                            Change Password
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setUserDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <LogOut className="mr-3 h-4 w-4 text-red-400"/>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <main className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}