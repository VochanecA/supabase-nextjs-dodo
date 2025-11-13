"use client";
import { useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from "next/link";

export default function AuthAwareButtons({ variant = 'primary' }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = await createSPASassClient();
                const { data: { user } } = await supabase.getSupabaseClient().auth.getUser();
                setIsAuthenticated(!!user);
            } catch (error) {
                console.error('Error checking auth status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return null;
    }

    // Navigation buttons for the header
    if (variant === 'nav') {
        return isAuthenticated ? (
            <Link
                href="/app"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors font-medium"
            >
                Go to Dashboard
            </Link>
        ) : (
            <>
                <Link 
                    href="/auth/login" 
                    className="text-gray-900 hover:text-black dark:text-gray-100 dark:hover:text-orange-400 transition-colors font-medium"
                >
                    Login
                </Link>
                <Link
                    href="/auth/register"
                    className="bg-primary-600 text-black px-4 py-2 rounded-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors font-medium"
                >
                    Get Started
                </Link>
            </>
        );
    }

    // Mobile variant
    if (variant === 'mobile') {
        return isAuthenticated ? (
            <Link
                href="/app"
                className="w-full flex items-center justify-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
            >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
        ) : (
            <div className="space-y-3 w-full">
                <Link
                    href="/auth/register"
                    className="w-full flex items-center justify-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
                >
                    Start Building Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                    href="/auth/login"
                    className="w-full flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                    Sign In
                    <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
            </div>
        );
    }

    // Primary buttons for the hero section
    return isAuthenticated ? (
        <Link
            href="/app"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
        >
            Go to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
    ) : (
        <>
            <Link
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
            >
                Start Building Free
                <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
                href="#features"
                className="inline-flex items-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
            >
                Learn More
                <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
        </>
    );
}